import { serve } from 'https://deno.land/std@0.224.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.45.0'

// Flexible local client type: matches the type inferred from createClient(url, key)
// at the call sites (SupabaseClient<any, 'public', any>), which is wider than the
// default-parameterized ReturnType<typeof createClient>.
type EdgeSupabaseClient = ReturnType<typeof createClient<any, 'public', any>>

const SENDGRID_MAIL_SEND_URL = 'https://api.sendgrid.com/v3/mail/send'
const DOCX_MIME_TYPE = 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
const DEFAULT_MAX_RECIPIENTS = 5
const DEFAULT_MAX_ATTACHMENT_MB = 10
const DEFAULT_CONFIRMATION_PHRASE = 'SEND 5 TEST EMAILS'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
}

function jsonResponse(body: Record<string, unknown>, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: {
      ...corsHeaders,
      'Content-Type': 'application/json',
    },
  })
}

function normalizeEmail(value: unknown) {
  return String(value || '').trim().toLowerCase()
}

function isValidEmail(value: unknown) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(String(value || '').trim())
}

function parseAllowlistEntries(value: string | undefined) {
  return String(value || '')
    .split(',')
    .map((entry) => entry.trim().toLowerCase())
    .filter(Boolean)
}

// Server-side recipient allowlist (v2.33 / H1). Deny-by-default: when enforced and
// the mode is active, an empty allowlist blocks every recipient. Returns true (no
// gating) only when enforcement is off or mode is 'off'.
function isRecipientAllowlisted(recipient: unknown) {
  const enforced = Deno.env.get('EMAIL_ALLOWLIST_ENFORCED') === 'true'
  const mode = String(Deno.env.get('EMAIL_RECIPIENT_ALLOWLIST_MODE') || 'off').trim().toLowerCase()

  if (!enforced || mode === 'off') {
    return true
  }

  const normalized = normalizeEmail(recipient)

  if (!normalized) {
    return false
  }

  const exactList = parseAllowlistEntries(Deno.env.get('EMAIL_RECIPIENT_ALLOWLIST'))
  const domainList = parseAllowlistEntries(Deno.env.get('EMAIL_RECIPIENT_ALLOWLIST_DOMAINS'))
  const atIndex = normalized.lastIndexOf('@')
  const domain = atIndex >= 0 ? normalized.slice(atIndex + 1) : ''

  const exactAllowed = (mode === 'exact' || mode === 'exact_or_domain') && exactList.includes(normalized)
  const domainAllowed = (mode === 'domain' || mode === 'exact_or_domain') && Boolean(domain) && domainList.includes(domain)

  return exactAllowed || domainAllowed
}

function parsePositiveInt(value: string | undefined, fallback: number) {
  const parsed = Number.parseInt(String(value || ''), 10)
  return Number.isFinite(parsed) && parsed > 0 ? parsed : fallback
}

// H5: parse a rate-cap env var. Unset/empty -> safe default. Set-but-invalid
// (non-numeric or <= 0) -> null so the caller fails closed.
function parseRateCap(value: string | undefined, fallback: number) {
  if (value === undefined || value === null || String(value).trim() === '') {
    return fallback
  }
  const parsed = Number.parseInt(String(value), 10)
  return Number.isFinite(parsed) && parsed > 0 ? parsed : null
}

// H5: shared rolling-window real-send count, scoped to the job owner's user_id.
// Counts existing real-send timestamps (batch_send_sent_at + resend_sent_at) so
// controlled batch and resend share one ceiling. Returns null on any uncertainty
// (query error or null count) so callers fail closed.
async function getSharedRealSendWindowCount(
  supabase: EdgeSupabaseClient,
  userId: string,
  windowStartIso: string,
): Promise<number | null> {
  const { data: jobs, error: jobsError } = await supabase
    .from('email_delivery_jobs')
    .select('id')
    .eq('user_id', userId)

  if (jobsError) {
    return null
  }

  const jobIds = (jobs || []).map((entry) => entry.id).filter(Boolean)

  if (jobIds.length === 0) {
    return 0
  }

  const { count: batchCount, error: batchError } = await supabase
    .from('email_delivery_outputs')
    .select('id', { count: 'exact', head: true })
    .in('email_delivery_job_id', jobIds)
    .gte('batch_send_sent_at', windowStartIso)

  if (batchError || batchCount === null || batchCount === undefined) {
    return null
  }

  const { count: resendCount, error: resendError } = await supabase
    .from('email_delivery_outputs')
    .select('id', { count: 'exact', head: true })
    .in('email_delivery_job_id', jobIds)
    .gte('resend_sent_at', windowStartIso)

  if (resendError || resendCount === null || resendCount === undefined) {
    return null
  }

  return batchCount + resendCount
}

// H6: structured, PII-safe audit logging. Never logs raw recipient emails,
// phrases, secrets, allowlist values, or attachment content.
const AUDIT_FUNCTION_NAME = 'controlled_batch'

function isAuditLogEnabled() {
  return String(Deno.env.get('EMAIL_AUDIT_LOG_ENABLED') || 'true').trim().toLowerCase() !== 'false'
}

// Returns a short salted SHA-256 of the recipient, or null when no salt is
// configured. Never returns or logs the raw email.
async function hashRecipientForAudit(email: unknown): Promise<string | null> {
  const salt = Deno.env.get('EMAIL_AUDIT_RECIPIENT_HASH_SALT')
  const normalizedEmail = normalizeEmail(email)

  if (!salt || !normalizedEmail) {
    return null
  }

  const data = new TextEncoder().encode(`${salt}:${normalizedEmail}`)
  const digest = await crypto.subtle.digest('SHA-256', data)
  return Array.from(new Uint8Array(digest))
    .map((byte) => byte.toString(16).padStart(2, '0'))
    .join('')
    .slice(0, 16)
}

function auditLog(event: string, fields: Record<string, unknown> = {}) {
  if (!isAuditLogEnabled()) {
    return
  }

  console.info('[email-audit]', {
    event,
    functionName: AUDIT_FUNCTION_NAME,
    timestamp: new Date().toISOString(),
    ...fields,
  })
}

function bytesToBase64(bytes: Uint8Array) {
  let binary = ''
  const chunkSize = 0x8000

  for (let index = 0; index < bytes.length; index += chunkSize) {
    binary += String.fromCharCode(...bytes.subarray(index, index + chunkSize))
  }

  return btoa(binary)
}

function parseJsonOrNull(value: string) {
  if (!value) {
    return null
  }

  try {
    return JSON.parse(value)
  } catch {
    return null
  }
}

function getSendGridErrorCode(body: unknown, fallback: string) {
  if (!body || typeof body !== 'object') {
    return fallback
  }

  const errors = (body as { errors?: Array<{ field?: string; id?: string }> }).errors
  const firstError = Array.isArray(errors) ? errors[0] : null

  return firstError?.field || firstError?.id || fallback
}

function getSendGridErrorMessage(body: unknown, fallback: string) {
  if (!body || typeof body !== 'object') {
    return fallback
  }

  const errors = (body as { errors?: Array<{ message?: string }> }).errors
  const firstError = Array.isArray(errors) ? errors[0] : null

  return firstError?.message || fallback
}

function getErrorMessage(error: unknown, fallback: string) {
  return error instanceof Error ? error.message : fallback
}

function truncate(value: string, maxLength = 1000) {
  return value.length > maxLength ? `${value.slice(0, maxLength)}...` : value
}

function safeResponseBodyForLog(responseText: string, responseBody: unknown) {
  if (responseBody) {
    return truncate(JSON.stringify(responseBody))
  }

  return truncate(responseText || '')
}

function buildSummary({
  emailDeliveryJobId,
  status,
  plannedRecipients,
  sent = 0,
  failed = 0,
  blocked = 0,
  skipped = 0,
  safetyFlagStatus,
  firstErrorCode = null,
  firstErrorMessage = null,
  rowResults = [],
  diagnostics = null,
}: {
  emailDeliveryJobId: string | null
  status: string
  plannedRecipients: number
  sent?: number
  failed?: number
  blocked?: number
  skipped?: number
  safetyFlagStatus: string
  firstErrorCode?: string | null
  firstErrorMessage?: string | null
  rowResults?: Array<Record<string, unknown>>
  diagnostics?: Record<string, unknown> | null
}) {
  return {
    ok: sent > 0 && failed === 0 && blocked === 0,
    mode: 'controlled_batch',
    status,
    emailDeliveryJobId,
    plannedRecipients,
    sent,
    failed,
    blocked,
    skipped,
    safetyFlagStatus,
    firstError: firstErrorMessage
      ? {
          errorCode: firstErrorCode,
          errorMessage: firstErrorMessage,
        }
      : null,
    firstErrorMessage,
    rowResults,
    diagnostics,
    realRowRecipientEmailsSent: sent,
  }
}

async function markBatchBlocked(
  supabase: EdgeSupabaseClient,
  emailDeliveryJobId: string,
  errorCode: string,
  errorMessage: string,
) {
  await supabase
    .from('email_delivery_outputs')
    .update({
      batch_send_status: 'batch_blocked',
      batch_send_error_code: errorCode,
      batch_send_error_message: errorMessage,
      batch_send_sent_at: null,
      batch_send_provider_message_id: null,
    })
    .eq('email_delivery_job_id', emailDeliveryJobId)
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  if (req.method !== 'POST') {
    return jsonResponse({ error: 'Method not allowed.' }, 405)
  }

  try {
    const authHeader = req.headers.get('Authorization') || ''

    if (!authHeader.startsWith('Bearer ')) {
      return jsonResponse({ error: 'Unauthorized' }, 401)
    }

    const supabaseUrl = Deno.env.get('SUPABASE_URL')
    const supabaseServiceRoleKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')

    if (!supabaseUrl || !supabaseServiceRoleKey) {
      return jsonResponse({ error: 'Edge function is not configured.' }, 500)
    }

    const supabase = createClient(supabaseUrl, supabaseServiceRoleKey, {
      auth: {
        persistSession: false,
        autoRefreshToken: false,
      },
    })

    const token = authHeader.replace('Bearer ', '')
    const { data: { user }, error: userError } = await supabase.auth.getUser(token)

    if (userError || !user) {
      return jsonResponse({ error: 'Unauthorized' }, 401)
    }

    const body = await req.json().catch(() => ({}))
    const emailDeliveryJobId = body.emailDeliveryJobId
    const confirmationPhrase = String(body.confirmationPhrase || '').trim()

    if (!emailDeliveryJobId) {
      return jsonResponse({ error: 'emailDeliveryJobId is required.' }, 400)
    }

    const { data: job, error: jobError } = await supabase
      .from('email_delivery_jobs')
      .select('*')
      .eq('id', emailDeliveryJobId)
      .single()

    if (jobError || !job) {
      return jsonResponse({ error: 'Email delivery job not found.' }, 404)
    }

    let allowed = job.user_id === user.id

    if (!allowed && job.organization_id) {
      const { data: membership } = await supabase
        .from('organization_members')
        .select('id')
        .eq('organization_id', job.organization_id)
        .eq('user_id', user.id)
        .maybeSingle()

      allowed = Boolean(membership)
    }

    if (!allowed) {
      return jsonResponse({ error: 'Forbidden' }, 403)
    }

    const { data: outputs, error: outputsError } = await supabase
      .from('email_delivery_outputs')
      .select('*')
      .eq('email_delivery_job_id', emailDeliveryJobId)
      .order('row_number', { ascending: true })

    if (outputsError) {
      return jsonResponse({ error: 'Unable to load email delivery outputs.' }, 500)
    }

    const deliveryOutputs = outputs || []
    const plannedRecipients = deliveryOutputs.length
    const allowControlledBatchSend = Deno.env.get('EMAIL_ALLOW_CONTROLLED_BATCH_SEND') === 'true'
    const safetyFlagStatus = allowControlledBatchSend ? 'enabled' : 'blocked'

    async function blockedResponse(
      errorCode: string,
      errorMessage: string,
      status = 'batch_blocked',
      diagnostics: Record<string, unknown> | null = null,
    ) {
      auditLog('blocked_attempt', { emailDeliveryJobId, reasonCode: errorCode, plannedCount: plannedRecipients })
      await markBatchBlocked(supabase, emailDeliveryJobId, errorCode, errorMessage)

      return jsonResponse(buildSummary({
        emailDeliveryJobId,
        status,
        plannedRecipients,
        blocked: plannedRecipients,
        safetyFlagStatus,
        firstErrorCode: errorCode,
        firstErrorMessage: errorMessage,
        diagnostics,
      }))
    }

    if (body.cc || body.bcc) {
      return await blockedResponse('blocked_by_safety_limit', 'CC and BCC are blocked for controlled batch sending.')
    }

    if (['zip', 'pdf'].includes(String(body.attachmentType || '').trim().toLowerCase())) {
      return await blockedResponse('attachment_not_docx', 'ZIP and PDF attachments are blocked for controlled batch sending.')
    }

    if (!allowControlledBatchSend) {
      console.warn('Controlled batch send blocked by safety flag', {
        emailDeliveryJobId,
        plannedRecipients,
        safetyFlagStatus,
      })

      return await blockedResponse(
        'controlled_batch_safety_flag_disabled',
        'Controlled batch send is blocked by safety flag. No row-recipient emails were sent.',
      )
    }

    const provider = Deno.env.get('EMAIL_PROVIDER')
    const sendGridApiKey = Deno.env.get('SENDGRID_API_KEY')
    const fromEmail = Deno.env.get('SENDGRID_FROM_EMAIL')
    const fromName = Deno.env.get('SENDGRID_FROM_NAME')
    const maxRecipientsSecret = Deno.env.get('EMAIL_MAX_CONTROLLED_BATCH_RECIPIENTS')
    const maxAttachmentMbSecret = Deno.env.get('EMAIL_MAX_ATTACHMENT_MB')
    // H3: the required phrase must come only from a securely configured, non-default
    // server env value. DEFAULT_CONFIRMATION_PHRASE is kept only as a value to reject.
    const configuredConfirmationPhrase = String(Deno.env.get('EMAIL_BATCH_SEND_CONFIRMATION_PHRASE') || '').trim()
    const confirmationPhraseConfigured = configuredConfirmationPhrase.length > 0
      && configuredConfirmationPhrase !== DEFAULT_CONFIRMATION_PHRASE
    const requiredConfirmationPhrase = configuredConfirmationPhrase
    const dryRunRequired = Deno.env.get('EMAIL_BATCH_SEND_DRY_RUN_REQUIRED') === 'true'
    const ownerTestRequired = Deno.env.get('EMAIL_OWNER_TEST_REQUIRED') === 'true'
    const maxRecipients = parsePositiveInt(maxRecipientsSecret, DEFAULT_MAX_RECIPIENTS)
    const maxAttachmentBytes = parsePositiveInt(maxAttachmentMbSecret, DEFAULT_MAX_ATTACHMENT_MB) * 1024 * 1024
    const missingOrUnsafeSecrets = [
      !sendGridApiKey ? 'SENDGRID_API_KEY' : '',
      !fromEmail ? 'SENDGRID_FROM_EMAIL' : '',
      !fromName ? 'SENDGRID_FROM_NAME' : '',
      provider !== 'sendgrid' ? 'EMAIL_PROVIDER=sendgrid' : '',
      !maxRecipientsSecret ? 'EMAIL_MAX_CONTROLLED_BATCH_RECIPIENTS=5' : '',
      !maxAttachmentMbSecret ? 'EMAIL_MAX_ATTACHMENT_MB=10' : '',
      !dryRunRequired ? 'EMAIL_BATCH_SEND_DRY_RUN_REQUIRED=true' : '',
      !ownerTestRequired ? 'EMAIL_OWNER_TEST_REQUIRED=true' : '',
    ].filter(Boolean)

    if (missingOrUnsafeSecrets.length > 0) {
      return await blockedResponse(
        'controlled_batch_configuration_blocked',
        `Controlled batch configuration is incomplete or unsafe: ${missingOrUnsafeSecrets.join(', ')}`,
      )
    }

    // H3: reject sending unless a secure, non-default confirmation phrase is
    // configured server-side. Never log or return the configured phrase itself.
    if (!confirmationPhraseConfigured) {
      return await blockedResponse(
        'confirmation_phrase_configuration_blocked',
        'Controlled batch send requires a securely configured confirmation phrase. Set EMAIL_BATCH_SEND_CONFIRMATION_PHRASE to a non-default value.',
      )
    }

    if (job.status !== 'sandbox_validated') {
      return await blockedResponse(
        'sandbox_validation_required',
        'Controlled batch send requires successful sandbox validation for all prepared rows.',
      )
    }

    const checkedOutputIds = deliveryOutputs.map((output) => output.id).filter(Boolean)
    const ownerTestRows = deliveryOutputs.filter((output) => Boolean(output.owner_test_status))
    const ownerTestSentRows = deliveryOutputs.filter((output) => output.owner_test_status === 'owner_test_sent')
    const ownerTestDiagnostics = {
      ownerTestRowsFound: ownerTestRows.length,
      ownerTestSentRowsFound: ownerTestSentRows.length,
      checkedEmailPrepJobId: emailDeliveryJobId,
      checkedOutputIds,
    }

    console.info('Controlled batch owner-test prerequisite check', ownerTestDiagnostics)

    if (ownerTestRequired && ownerTestSentRows.length === 0) {
      return await blockedResponse(
        'owner_test_required',
        'Controlled batch send requires a successful owner/test email first.',
        'batch_blocked',
        ownerTestDiagnostics,
      )
    }

    if (confirmationPhrase !== requiredConfirmationPhrase) {
      return await blockedResponse(
        'confirmation_phrase_required',
        'Controlled batch send requires the exact confirmation phrase.',
        'batch_confirmation_required',
      )
    }

    if (plannedRecipients === 0) {
      return await blockedResponse(
        'recipient_count_zero',
        'Controlled batch send requires at least one prepared recipient.',
      )
    }

    if (plannedRecipients > maxRecipients) {
      return await blockedResponse(
        'blocked_by_safety_limit',
        `Controlled batch send is limited to ${maxRecipients} recipients.`,
      )
    }

    const invalidRecipient = deliveryOutputs.find((output) => !isValidEmail(output.recipient_email))

    if (invalidRecipient) {
      return await blockedResponse(
        'invalid_recipient',
        `Invalid recipient on row ${invalidRecipient.row_number || '-'}.`,
      )
    }

    const nonAllowlistedOutput = deliveryOutputs.find((output) => !isRecipientAllowlisted(output.recipient_email))

    if (nonAllowlistedOutput) {
      return await blockedResponse(
        'recipient_not_allowlisted',
        `Recipient on row ${nonAllowlistedOutput.row_number || '-'} is not on the approved allowlist. No email was sent.`,
      )
    }

    // H5: shared rolling-window real-send rate cap. Controlled batch and resend
    // count toward the same ceiling. Fail closed on invalid caps or unknown counts.
    const maxRealSendsPerHour = parseRateCap(Deno.env.get('EMAIL_MAX_REAL_SENDS_PER_HOUR'), 20)
    const maxRealSendsPerDay = parseRateCap(Deno.env.get('EMAIL_MAX_REAL_SENDS_PER_DAY'), 50)

    if (maxRealSendsPerHour === null || maxRealSendsPerDay === null) {
      return await blockedResponse(
        'rate_limit_exceeded',
        'Sending limit reached — no email sent. Please try later.',
      )
    }

    const hourWindowStartIso = new Date(Date.now() - 60 * 60 * 1000).toISOString()
    const dayWindowStartIso = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString()
    const hourSendCount = await getSharedRealSendWindowCount(supabase, job.user_id, hourWindowStartIso)
    const daySendCount = await getSharedRealSendWindowCount(supabase, job.user_id, dayWindowStartIso)

    if (
      hourSendCount === null
      || daySendCount === null
      || hourSendCount + plannedRecipients > maxRealSendsPerHour
      || daySendCount + plannedRecipients > maxRealSendsPerDay
    ) {
      return await blockedResponse(
        'rate_limit_exceeded',
        'Sending limit reached — no email sent. Please try later.',
      )
    }

    const unsandboxedOutput = deliveryOutputs.find((output) => output.status !== 'sandbox_validated')

    if (unsandboxedOutput) {
      return await blockedResponse(
        'sandbox_validation_required',
        `Row ${unsandboxedOutput.row_number || '-'} has not passed sandbox validation.`,
      )
    }

    const generationOutputIds = deliveryOutputs
      .map((output) => output.generation_output_id)
      .filter(Boolean)

    const { data: generationOutputs, error: generationOutputsError } = generationOutputIds.length > 0
      ? await supabase
        .from('generation_outputs')
        .select('id, row_index, storage_bucket, storage_path, status, file_name')
        .in('id', generationOutputIds)
      : { data: [], error: null }

    if (generationOutputsError) {
      return jsonResponse({ error: 'Unable to load generated DOCX outputs.' }, 500)
    }

    const generationOutputById = new Map((generationOutputs || []).map((output) => [output.id, output]))
    const preparedAttachments: Array<{
      output: Record<string, unknown>
      attachmentFileName: string
      attachmentBytes: Uint8Array
    }> = []

    for (const output of deliveryOutputs) {
      const generationOutput = output.generation_output_id ? generationOutputById.get(output.generation_output_id) : null

      if (!generationOutput || generationOutput.status !== 'generated') {
        return await blockedResponse(
          'attachment_missing',
          `Generated DOCX is missing for row ${output.row_number || '-'}.`,
        )
      }

      if (!generationOutput.storage_bucket || !generationOutput.storage_path) {
        return await blockedResponse(
          'attachment_missing',
          `Generated DOCX storage path is missing for row ${output.row_number || '-'}.`,
        )
      }

      const fileName = String(generationOutput.file_name || '')
      const storagePath = String(generationOutput.storage_path || '')
      const attachmentFileName = fileName || `row-${output.row_number || generationOutput.row_index || 'document'}.docx`
      const lowerAttachmentName = attachmentFileName.toLowerCase()

      if (![fileName, storagePath, attachmentFileName].some((value) => String(value || '').toLowerCase().endsWith('.docx'))) {
        return await blockedResponse(
          'attachment_not_docx',
          `Only DOCX attachments are allowed. Row ${output.row_number || '-'} is not DOCX.`,
        )
      }

      if (lowerAttachmentName.endsWith('.zip') || lowerAttachmentName.endsWith('.pdf')) {
        return await blockedResponse(
          'attachment_not_docx',
          'ZIP and PDF attachments are blocked for controlled batch sending.',
        )
      }

      const { data: fileData, error: downloadError } = await supabase.storage
        .from(generationOutput.storage_bucket)
        .download(generationOutput.storage_path)

      if (downloadError || !fileData) {
        return await blockedResponse(
          'attachment_missing',
          `Generated DOCX could not be downloaded for row ${output.row_number || '-'}.`,
        )
      }

      const attachmentBytes = new Uint8Array(await fileData.arrayBuffer())

      if (attachmentBytes.byteLength === 0) {
        return await blockedResponse(
          'attachment_missing',
          `Generated DOCX is empty for row ${output.row_number || '-'}.`,
        )
      }

      if (attachmentBytes.byteLength > maxAttachmentBytes) {
        return await blockedResponse(
          'attachment_too_large',
          `Generated DOCX exceeds the 10 MB safety limit for row ${output.row_number || '-'}.`,
        )
      }

      auditLog('send_attempt_start', {
        emailDeliveryJobId,
        rowNumber: output.row_number ?? null,
        recipientHash: await hashRecipientForAudit(output.recipient_email),
        attachmentSizeBytes: attachmentBytes.byteLength,
      })

      preparedAttachments.push({
        output,
        attachmentFileName,
        attachmentBytes,
      })
    }

    await supabase
      .from('email_delivery_outputs')
      .update({
        batch_send_status: 'batch_queued',
        batch_send_error_code: null,
        batch_send_error_message: null,
        batch_send_sent_at: null,
        batch_send_provider_message_id: null,
      })
      .eq('email_delivery_job_id', emailDeliveryJobId)

    const rowResults: Array<Record<string, unknown>> = []
    let sent = 0
    let failed = 0

    for (const item of preparedAttachments) {
      const output = item.output
      const recipient = normalizeEmail(output.recipient_email)

      const sendGridPayload = {
        personalizations: [
          {
            to: [{ email: recipient }],
            subject: output.subject || 'Your document is ready',
          },
        ],
        from: {
          email: fromEmail,
          name: fromName,
        },
        content: [
          {
            type: 'text/plain',
            value: output.message || 'Your generated document is attached.',
          },
        ],
        attachments: [
          {
            content: bytesToBase64(item.attachmentBytes),
            type: DOCX_MIME_TYPE,
            filename: item.attachmentFileName,
            disposition: 'attachment',
          },
        ],
      }

      const sendGridResponse = await fetch(SENDGRID_MAIL_SEND_URL, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${sendGridApiKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(sendGridPayload),
      })

      const responseText = await sendGridResponse.text()
      const responseBody = parseJsonOrNull(responseText)
      const providerMessageId = sendGridResponse.headers.get('x-message-id')
      const providerStatusCode = sendGridResponse.status

      const recipientHash = await hashRecipientForAudit(output.recipient_email)

      if (!sendGridResponse.ok) {
        const providerErrorPreview = safeResponseBodyForLog(responseText, responseBody)
        const fallbackCode = providerStatusCode === 403 && /sender|verified|verification/i.test(providerErrorPreview)
          ? 'sender_not_verified'
          : providerStatusCode === 401
          ? 'provider_401'
          : providerStatusCode === 403
            ? 'provider_403'
            : providerStatusCode === 429
              ? 'rate_limited'
              : 'provider_temp_error'
        const errorCode = getSendGridErrorCode(responseBody, fallbackCode)
        const errorMessage = getSendGridErrorMessage(responseBody, responseText || 'SendGrid controlled batch email failed.')

        await supabase
          .from('email_delivery_outputs')
          .update({
            batch_send_status: 'batch_failed',
            batch_send_error_code: errorCode,
            batch_send_error_message: errorMessage,
            batch_send_provider_message_id: providerMessageId,
            batch_send_attempt_count: Number(output.batch_send_attempt_count || 0) + 1,
          })
          .eq('id', output.id)

        rowResults.push({
          rowId: output.id,
          rowNumber: output.row_number ?? null,
          status: 'batch_failed',
          errorCode,
          errorMessage,
          providerMessageId,
          providerStatusCode,
          recipient,
          attachmentFileName: item.attachmentFileName,
          attachmentSizeBytes: item.attachmentBytes.byteLength,
        })
        auditLog('failed_send', {
          emailDeliveryJobId,
          rowNumber: output.row_number ?? null,
          recipientHash,
          providerStatus: providerStatusCode,
          providerMessageId,
          reasonCode: errorCode,
          responseBody: safeResponseBodyForLog(responseText, responseBody),
        })
        failed += 1
        continue
      }

      const sentAt = new Date().toISOString()

      await supabase
        .from('email_delivery_outputs')
        .update({
          batch_send_status: 'batch_sent',
          batch_send_error_code: null,
          batch_send_error_message: null,
          batch_send_sent_at: sentAt,
          batch_send_provider_message_id: providerMessageId,
          batch_send_attempt_count: Number(output.batch_send_attempt_count || 0) + 1,
        })
        .eq('id', output.id)

      rowResults.push({
        rowId: output.id,
        rowNumber: output.row_number ?? null,
        status: 'batch_sent',
        providerMessageId,
        providerStatusCode,
        recipient,
        attachmentFileName: item.attachmentFileName,
        attachmentSizeBytes: item.attachmentBytes.byteLength,
      })
      auditLog('successful_send', {
        emailDeliveryJobId,
        rowNumber: output.row_number ?? null,
        recipientHash,
        providerStatus: providerStatusCode,
        providerMessageId,
      })
      sent += 1
    }

    return jsonResponse(buildSummary({
      emailDeliveryJobId,
      status: failed > 0 ? 'batch_failed' : 'batch_sent',
      plannedRecipients,
      sent,
      failed,
      blocked: 0,
      skipped: 0,
      safetyFlagStatus,
      firstErrorCode: rowResults.find((result) => result.errorCode)?.errorCode as string | null || null,
      firstErrorMessage: rowResults.find((result) => result.errorMessage)?.errorMessage as string | null || null,
      rowResults,
    }))
  } catch (error) {
    return jsonResponse({
      ok: false,
      mode: 'controlled_batch',
      status: 'batch_failed',
      plannedRecipients: 0,
      sent: 0,
      failed: 0,
      blocked: 0,
      skipped: 0,
      safetyFlagStatus: 'unknown',
      firstError: {
        errorCode: 'controlled_batch_error',
        errorMessage: getErrorMessage(error, 'Controlled batch gate failed.'),
      },
      firstErrorMessage: getErrorMessage(error, 'Controlled batch gate failed.'),
      realRowRecipientEmailsSent: 0,
    }, 500)
  }
})
