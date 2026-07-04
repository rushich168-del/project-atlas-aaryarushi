import { serve } from 'https://deno.land/std@0.224.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.45.0'

// Flexible local client type: matches the type inferred from createClient(url, key)
// at the call sites (SupabaseClient<any, 'public', any>), which is wider than the
// default-parameterized ReturnType<typeof createClient>.
type EdgeSupabaseClient = ReturnType<typeof createClient<any, 'public', any>>

const SENDGRID_MAIL_SEND_URL = 'https://api.sendgrid.com/v3/mail/send'
const DOCX_MIME_TYPE = 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
const DEFAULT_MAX_RESEND_ROWS = 5
const DEFAULT_MAX_ATTACHMENT_MB = 10
const DEFAULT_CONFIRMATION_PHRASE = 'RESEND FAILED ROWS'

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

function truncate(value: string, maxLength = 1000) {
  return value.length > maxLength ? `${value.slice(0, maxLength)}...` : value
}

function safeResponseBodyForLog(responseText: string, responseBody: unknown) {
  if (responseBody) {
    return truncate(JSON.stringify(responseBody))
  }

  return truncate(responseText || '')
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

function buildSummary({
  emailDeliveryJobId,
  status,
  plannedRows,
  sent = 0,
  failed = 0,
  blocked = 0,
  skipped = 0,
  safetyFlagStatus,
  firstErrorCode = null,
  firstErrorMessage = null,
  rowResults = [],
}: {
  emailDeliveryJobId: string | null
  status: string
  plannedRows: number
  sent?: number
  failed?: number
  blocked?: number
  skipped?: number
  safetyFlagStatus: string
  firstErrorCode?: string | null
  firstErrorMessage?: string | null
  rowResults?: Array<Record<string, unknown>>
}) {
  return {
    ok: sent > 0 && failed === 0 && blocked === 0,
    mode: 'failed_row_resend',
    status,
    emailDeliveryJobId,
    plannedRows,
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
    realRowRecipientEmailsSent: sent,
  }
}

async function markResendBlocked(
  supabase: EdgeSupabaseClient,
  rowIds: string[],
  errorCode: string,
  errorMessage: string,
  status = 'resend_blocked',
) {
  if (rowIds.length === 0) {
    return
  }

  await supabase
    .from('email_delivery_outputs')
    .update({
      resend_status: status,
      resend_error_code: errorCode,
      resend_error_message: errorMessage,
      resend_sent_at: null,
      resend_provider_message_id: null,
    })
    .in('id', rowIds)
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

    const allOutputs = outputs || []
    const failedRows = allOutputs.filter((output) => output.batch_send_status === 'batch_failed')
    const batchSentRows = allOutputs.filter((output) => output.batch_send_status === 'batch_sent')
    const failedRowIds = failedRows.map((output) => output.id).filter(Boolean)
    const plannedRows = failedRows.length
    const allowFailedRowResend = Deno.env.get('EMAIL_ALLOW_FAILED_ROW_RESEND') === 'true'
    const safetyFlagStatus = allowFailedRowResend ? 'enabled' : 'blocked'

    async function blockedResponse(errorCode: string, errorMessage: string, status = 'resend_blocked') {
      await markResendBlocked(supabase, failedRowIds, errorCode, errorMessage, status)

      return jsonResponse(buildSummary({
        emailDeliveryJobId,
        status,
        plannedRows,
        blocked: plannedRows,
        safetyFlagStatus,
        firstErrorCode: errorCode,
        firstErrorMessage: errorMessage,
        rowResults: failedRows.map((output) => ({
          rowId: output.id,
          rowNumber: output.row_number ?? null,
          status,
          errorCode,
          errorMessage,
        })),
      }))
    }

    if (body.cc || body.bcc) {
      return await blockedResponse('blocked_by_safety_limit', 'CC and BCC are blocked for failed-row resend.')
    }

    if (['zip', 'pdf'].includes(String(body.attachmentType || '').trim().toLowerCase())) {
      return await blockedResponse('attachment_not_docx', 'ZIP and PDF attachments are blocked for failed-row resend.')
    }

    if (!allowFailedRowResend) {
      console.warn('Failed-row resend blocked by safety flag', {
        emailDeliveryJobId,
        failedRows: plannedRows,
        batchSentRows: batchSentRows.length,
        safetyFlagStatus,
      })

      return await blockedResponse(
        'failed_row_resend_safety_flag_disabled',
        'Failed row resend is blocked by safety flag. No row-recipient emails were sent.',
      )
    }

    const provider = Deno.env.get('EMAIL_PROVIDER')
    const sendGridApiKey = Deno.env.get('SENDGRID_API_KEY')
    const fromEmail = Deno.env.get('SENDGRID_FROM_EMAIL')
    const fromName = Deno.env.get('SENDGRID_FROM_NAME')
    const maxResendRows = parsePositiveInt(Deno.env.get('EMAIL_MAX_FAILED_ROW_RESEND_ROWS'), DEFAULT_MAX_RESEND_ROWS)
    const maxAttachmentBytes = parsePositiveInt(Deno.env.get('EMAIL_MAX_ATTACHMENT_MB'), DEFAULT_MAX_ATTACHMENT_MB) * 1024 * 1024
    // v2.42: prerequisite-flag parity with controlled batch. Both must be exactly
    // 'true' server-side, or resend is blocked (missing / false / any other value).
    const dryRunRequired = Deno.env.get('EMAIL_BATCH_SEND_DRY_RUN_REQUIRED') === 'true'
    const ownerTestRequired = Deno.env.get('EMAIL_OWNER_TEST_REQUIRED') === 'true'
    // H3: the required phrase must come only from a securely configured, non-default
    // server env value. DEFAULT_CONFIRMATION_PHRASE is kept only as a value to reject.
    const configuredConfirmationPhrase = String(Deno.env.get('EMAIL_FAILED_ROW_RESEND_CONFIRMATION_PHRASE') || '').trim()
    const confirmationPhraseConfigured = configuredConfirmationPhrase.length > 0
      && configuredConfirmationPhrase !== DEFAULT_CONFIRMATION_PHRASE
    const requiredConfirmationPhrase = configuredConfirmationPhrase
    const missingOrUnsafeSecrets = [
      !sendGridApiKey ? 'SENDGRID_API_KEY' : '',
      !fromEmail ? 'SENDGRID_FROM_EMAIL' : '',
      !fromName ? 'SENDGRID_FROM_NAME' : '',
      provider !== 'sendgrid' ? 'EMAIL_PROVIDER=sendgrid' : '',
      !dryRunRequired ? 'EMAIL_BATCH_SEND_DRY_RUN_REQUIRED=true' : '',
      !ownerTestRequired ? 'EMAIL_OWNER_TEST_REQUIRED=true' : '',
    ].filter(Boolean)

    if (missingOrUnsafeSecrets.length > 0) {
      return await blockedResponse(
        'failed_row_resend_configuration_blocked',
        `Failed-row resend configuration is incomplete or unsafe: ${missingOrUnsafeSecrets.join(', ')}`,
      )
    }

    // H3: reject resend unless a secure, non-default confirmation phrase is
    // configured server-side. Never log or return the configured phrase itself.
    if (!confirmationPhraseConfigured) {
      return await blockedResponse(
        'confirmation_phrase_configuration_blocked',
        'Failed-row resend requires a securely configured confirmation phrase. Set EMAIL_FAILED_ROW_RESEND_CONFIRMATION_PHRASE to a non-default value.',
      )
    }

    if (confirmationPhrase !== requiredConfirmationPhrase) {
      return await blockedResponse(
        'confirmation_phrase_required',
        'Failed-row resend requires the exact confirmation phrase.',
        'resend_confirmation_required',
      )
    }

    if (plannedRows === 0) {
      return jsonResponse(buildSummary({
        emailDeliveryJobId,
        status: 'resend_blocked',
        plannedRows,
        safetyFlagStatus,
        firstErrorCode: 'no_failed_rows',
        firstErrorMessage: 'No failed controlled-batch rows are available for resend.',
      }))
    }

    if (plannedRows > maxResendRows || plannedRows > DEFAULT_MAX_RESEND_ROWS) {
      return await blockedResponse(
        'blocked_by_safety_limit',
        `Failed-row resend is limited to ${Math.min(maxResendRows, DEFAULT_MAX_RESEND_ROWS)} rows.`,
      )
    }

    const invalidRecipient = failedRows.find((output) => !isValidEmail(output.recipient_email))

    if (invalidRecipient) {
      return await blockedResponse(
        'invalid_recipient',
        `Invalid recipient on failed row ${invalidRecipient.row_number || '-'}.`,
      )
    }

    const nonAllowlistedRow = failedRows.find((output) => !isRecipientAllowlisted(output.recipient_email))

    if (nonAllowlistedRow) {
      return await blockedResponse(
        'recipient_not_allowlisted',
        `Recipient on failed row ${nonAllowlistedRow.row_number || '-'} is not on the approved allowlist. No email was sent.`,
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
      || hourSendCount + plannedRows > maxRealSendsPerHour
      || daySendCount + plannedRows > maxRealSendsPerDay
    ) {
      return await blockedResponse(
        'rate_limit_exceeded',
        'Sending limit reached — no email sent. Please try later.',
      )
    }

    const generationOutputIds = failedRows
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

    for (const output of failedRows) {
      const generationOutput = output.generation_output_id ? generationOutputById.get(output.generation_output_id) : null

      if (!generationOutput || generationOutput.status !== 'generated') {
        return await blockedResponse(
          'attachment_missing',
          `Generated DOCX is missing for failed row ${output.row_number || '-'}.`,
        )
      }

      if (!generationOutput.storage_bucket || !generationOutput.storage_path) {
        return await blockedResponse(
          'attachment_missing',
          `Generated DOCX storage path is missing for failed row ${output.row_number || '-'}.`,
        )
      }

      const fileName = String(generationOutput.file_name || '')
      const storagePath = String(generationOutput.storage_path || '')
      const attachmentFileName = fileName || `row-${output.row_number || generationOutput.row_index || 'document'}.docx`
      const lowerAttachmentName = attachmentFileName.toLowerCase()

      if (![fileName, storagePath, attachmentFileName].some((value) => String(value || '').toLowerCase().endsWith('.docx'))) {
        return await blockedResponse(
          'attachment_not_docx',
          `Only DOCX attachments are allowed. Failed row ${output.row_number || '-'} is not DOCX.`,
        )
      }

      if (lowerAttachmentName.endsWith('.zip') || lowerAttachmentName.endsWith('.pdf')) {
        return await blockedResponse(
          'attachment_not_docx',
          'ZIP and PDF attachments are blocked for failed-row resend.',
        )
      }

      const { data: fileData, error: downloadError } = await supabase.storage
        .from(generationOutput.storage_bucket)
        .download(generationOutput.storage_path)

      if (downloadError || !fileData) {
        return await blockedResponse(
          'attachment_missing',
          `Generated DOCX could not be downloaded for failed row ${output.row_number || '-'}.`,
        )
      }

      const attachmentBytes = new Uint8Array(await fileData.arrayBuffer())

      if (attachmentBytes.byteLength === 0) {
        return await blockedResponse(
          'attachment_missing',
          `Generated DOCX is empty for failed row ${output.row_number || '-'}.`,
        )
      }

      if (attachmentBytes.byteLength > maxAttachmentBytes) {
        return await blockedResponse(
          'attachment_too_large',
          `Generated DOCX exceeds the 10 MB safety limit for failed row ${output.row_number || '-'}.`,
        )
      }

      preparedAttachments.push({
        output,
        attachmentFileName,
        attachmentBytes,
      })
    }

    await supabase
      .from('email_delivery_outputs')
      .update({
        resend_status: 'resend_queued',
        resend_error_code: null,
        resend_error_message: null,
        resend_sent_at: null,
        resend_provider_message_id: null,
      })
      .in('id', failedRowIds)

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

      console.info('Failed-row resend SendGrid response', {
        emailDeliveryJobId,
        rowId: output.id,
        rowNumber: output.row_number ?? null,
        recipient,
        attachmentFileName: item.attachmentFileName,
        attachmentSizeBytes: item.attachmentBytes.byteLength,
        providerStatusCode,
        providerMessageId,
        responseBody: safeResponseBodyForLog(responseText, responseBody),
      })

      if (!sendGridResponse.ok) {
        const fallbackCode = providerStatusCode === 401
          ? 'provider_401'
          : providerStatusCode === 403
            ? 'provider_403'
            : providerStatusCode === 429
              ? 'rate_limited'
              : 'provider_temp_error'
        const errorCode = getSendGridErrorCode(responseBody, fallbackCode)
        const errorMessage = getSendGridErrorMessage(responseBody, responseText || 'SendGrid failed-row resend failed.')

        await supabase
          .from('email_delivery_outputs')
          .update({
            resend_status: 'resend_failed',
            resend_error_code: errorCode,
            resend_error_message: errorMessage,
            resend_provider_message_id: providerMessageId,
            resend_attempt_count: Number(output.resend_attempt_count || 0) + 1,
          })
          .eq('id', output.id)

        rowResults.push({
          rowId: output.id,
          rowNumber: output.row_number ?? null,
          status: 'resend_failed',
          errorCode,
          errorMessage,
          providerMessageId,
          providerStatusCode,
        })
        failed += 1
        continue
      }

      const sentAt = new Date().toISOString()

      await supabase
        .from('email_delivery_outputs')
        .update({
          resend_status: 'resend_sent',
          resend_error_code: null,
          resend_error_message: null,
          resend_sent_at: sentAt,
          resend_provider_message_id: providerMessageId,
          resend_attempt_count: Number(output.resend_attempt_count || 0) + 1,
        })
        .eq('id', output.id)

      rowResults.push({
        rowId: output.id,
        rowNumber: output.row_number ?? null,
        status: 'resend_sent',
        providerMessageId,
        providerStatusCode,
      })
      sent += 1
    }

    return jsonResponse(buildSummary({
      emailDeliveryJobId,
      status: failed > 0 ? 'resend_failed' : 'resend_sent',
      plannedRows,
      sent,
      failed,
      safetyFlagStatus,
      firstErrorCode: rowResults.find((result) => result.errorCode)?.errorCode as string | null || null,
      firstErrorMessage: rowResults.find((result) => result.errorMessage)?.errorMessage as string | null || null,
      rowResults,
    }))
  } catch (error) {
    return jsonResponse({
      ok: false,
      mode: 'failed_row_resend',
      status: 'resend_failed',
      plannedRows: 0,
      sent: 0,
      failed: 0,
      blocked: 0,
      skipped: 0,
      safetyFlagStatus: 'unknown',
      firstError: {
        errorCode: 'failed_row_resend_error',
        errorMessage: getErrorMessage(error, 'Failed-row resend gate failed.'),
      },
      firstErrorMessage: getErrorMessage(error, 'Failed-row resend gate failed.'),
      realRowRecipientEmailsSent: 0,
    }, 500)
  }
})
