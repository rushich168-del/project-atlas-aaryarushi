import { serve } from 'https://deno.land/std@0.224.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.45.0'

const SENDGRID_MAIL_SEND_URL = 'https://api.sendgrid.com/v3/mail/send'
const DOCX_MIME_TYPE = 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
const DEFAULT_MAX_ATTACHMENT_MB = 10

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
// gating) only when enforcement is off or mode is 'off'. For owner test, the target
// is the configured owner/test address, which must itself be allowlisted when
// enforcement is on.
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

// H6: structured, PII-safe audit logging. Never logs raw recipient emails,
// the owner/test target email, original recipient preview, phrases, secrets,
// allowlist values, or attachment content.
const AUDIT_FUNCTION_NAME = 'owner_test'

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

function getErrorMessage(error: unknown, fallback: string) {
  return error instanceof Error ? error.message : fallback
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

function truncate(value: string, maxLength = 1000) {
  return value.length > maxLength ? `${value.slice(0, maxLength)}...` : value
}

function safeResponseBodyForLog(responseText: string, responseBody: unknown) {
  if (responseBody) {
    return truncate(JSON.stringify(responseBody))
  }

  return truncate(responseText || '')
}

function blockedResult({
  emailDeliveryJobId,
  target,
  originalRecipient,
  attachmentFileName,
  errorCode,
  errorMessage,
}: {
  emailDeliveryJobId: string
  target: string
  originalRecipient: string | null
  attachmentFileName: string | null
  errorCode: string
  errorMessage: string
}) {
  return {
    ok: false,
    mode: 'owner_test',
    status: 'owner_test_blocked',
    emailDeliveryJobId,
    ownerTestEmailTarget: target,
    originalRowRecipientPreview: originalRecipient,
    attachmentFileName,
    errorCode,
    errorMessage,
    realEmailsDelivered: 0,
  }
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  if (req.method !== 'POST') {
    return jsonResponse({ error: 'Method not allowed.' }, 405)
  }

  let emailDeliveryJobId: string | null = null
  let selectedOutputId: string | null = null
  let ownerTestEmailTarget = ''
  let originalRowRecipientPreview: string | null = null
  let selectedAttachmentFileName: string | null = null

  try {
    const authHeader = req.headers.get('Authorization') || ''

    if (!authHeader.startsWith('Bearer ')) {
      return jsonResponse({ error: 'Unauthorized' }, 401)
    }

    const supabaseUrl = Deno.env.get('SUPABASE_URL')
    const supabaseServiceRoleKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')
    const provider = Deno.env.get('EMAIL_PROVIDER')
    const allowProductionSend = Deno.env.get('EMAIL_ALLOW_PRODUCTION_SEND')
    const ownerTestMode = Deno.env.get('EMAIL_OWNER_TEST_MODE')
    const maxOwnerTestSends = parsePositiveInt(Deno.env.get('EMAIL_MAX_OWNER_TEST_SENDS'), 0)
    const sendGridApiKey = Deno.env.get('SENDGRID_API_KEY')
    const fromEmail = Deno.env.get('SENDGRID_FROM_EMAIL')
    const fromName = Deno.env.get('SENDGRID_FROM_NAME')
    const ownerTestEmail = normalizeEmail(Deno.env.get('EMAIL_OWNER_TEST_EMAIL'))
    ownerTestEmailTarget = ownerTestEmail
    const maxAttachmentMbSecret = Deno.env.get('EMAIL_MAX_ATTACHMENT_MB')
    const maxAttachmentBytes = parsePositiveInt(maxAttachmentMbSecret, DEFAULT_MAX_ATTACHMENT_MB) * 1024 * 1024

    if (!supabaseUrl || !supabaseServiceRoleKey) {
      return jsonResponse({ error: 'Edge function is not configured.' }, 500)
    }

    const requiredSecrets = [
      !sendGridApiKey ? 'SENDGRID_API_KEY' : '',
      !fromEmail ? 'SENDGRID_FROM_EMAIL' : '',
      !fromName ? 'SENDGRID_FROM_NAME' : '',
      provider !== 'sendgrid' ? 'EMAIL_PROVIDER=sendgrid' : '',
      !ownerTestEmail ? 'EMAIL_OWNER_TEST_EMAIL' : '',
      ownerTestMode !== 'true' ? 'EMAIL_OWNER_TEST_MODE=true' : '',
      maxOwnerTestSends !== 1 ? 'EMAIL_MAX_OWNER_TEST_SENDS=1' : '',
      !maxAttachmentMbSecret ? 'EMAIL_MAX_ATTACHMENT_MB=10' : '',
      allowProductionSend !== 'false' ? 'EMAIL_ALLOW_PRODUCTION_SEND=false' : '',
    ].filter(Boolean)

    if (requiredSecrets.length > 0) {
      auditLog('blocked_attempt', {
        reasonCode: 'owner_test_configuration_blocked',
        missingConfigCount: requiredSecrets.length,
      })

      return jsonResponse({
        ok: false,
        mode: 'owner_test',
        status: 'owner_test_blocked',
        errorCode: 'owner_test_configuration_blocked',
        errorMessage: `Owner-test email configuration is incomplete or unsafe: ${requiredSecrets.join(', ')}`,
        realEmailsDelivered: 0,
      })
    }

    if (!isValidEmail(ownerTestEmail)) {
      return jsonResponse({
        ok: false,
        mode: 'owner_test',
        status: 'owner_test_blocked',
        errorCode: 'invalid_owner_test_email',
        errorMessage: 'Configured owner/test recipient email is invalid.',
        realEmailsDelivered: 0,
      })
    }

    if (!isRecipientAllowlisted(ownerTestEmail)) {
      return jsonResponse({
        ok: false,
        mode: 'owner_test',
        status: 'owner_test_blocked',
        errorCode: 'recipient_not_allowlisted',
        errorMessage: 'Owner/test recipient is not on the approved allowlist. No email was sent.',
        realEmailsDelivered: 0,
      })
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
    emailDeliveryJobId = body.emailDeliveryJobId

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

    if ((job.owner_test_sent_count || 0) >= 1 || job.owner_test_status === 'owner_test_sent') {
      return jsonResponse({
        ok: false,
        mode: 'owner_test',
        status: 'owner_test_blocked',
        emailDeliveryJobId,
        ownerTestEmailTarget: ownerTestEmail,
        originalRowRecipientPreview: null,
        attachmentFileName: null,
        errorCode: 'owner_test_send_limit_reached',
        errorMessage: 'Owner-test send blocked. This email prep job has already sent its one allowed owner test email.',
        realEmailsDelivered: 0,
      })
    }

    const { data: outputs, error: outputsError } = await supabase
      .from('email_delivery_outputs')
      .select('*')
      .eq('email_delivery_job_id', emailDeliveryJobId)
      .order('row_number', { ascending: true })

    if (outputsError) {
      return jsonResponse({ error: 'Unable to load email delivery outputs.' }, 500)
    }

    const preparedOutputs = outputs || []
    const selectedOutput = preparedOutputs.find((output) => (
      output.generation_output_id
      && isValidEmail(output.recipient_email)
      && ['prepared', 'ready', 'sandbox_validated'].includes(String(output.status || ''))
    ))

    if (!selectedOutput) {
      await supabase
        .from('email_delivery_jobs')
        .update({ owner_test_status: 'owner_test_blocked', owner_test_failed_count: 1 })
        .eq('id', emailDeliveryJobId)

      return jsonResponse(blockedResult({
        emailDeliveryJobId,
        target: ownerTestEmail,
        originalRecipient: null,
        attachmentFileName: null,
        errorCode: 'no_valid_prepared_output',
        errorMessage: 'Owner-test send blocked. Save email prep and ensure at least one generated DOCX row has a valid recipient.',
      }))
    }

    selectedOutputId = selectedOutput.id

    await supabase
      .from('email_delivery_outputs')
      .update({
        owner_test_status: 'owner_test_queued',
        owner_test_error_code: null,
        owner_test_error_message: null,
        owner_test_sent_at: null,
        owner_test_provider_message_id: null,
      })
      .eq('id', selectedOutputId)

    await supabase
      .from('email_delivery_jobs')
      .update({
        owner_test_status: 'owner_test_queued',
        owner_test_failed_count: 0,
      })
      .eq('id', emailDeliveryJobId)

    const { data: generationOutput, error: generationOutputError } = await supabase
      .from('generation_outputs')
      .select('id, row_index, row_data, storage_bucket, storage_path, status, file_name')
      .eq('id', selectedOutput.generation_output_id)
      .single()

    if (generationOutputError || !generationOutput) {
      throw new Error('blocked:generation_output_missing:Generated DOCX output was not found.')
    }

    if (generationOutput.status !== 'generated') {
      throw new Error('blocked:generation_output_not_ready:Generated output is not ready for owner-test sending.')
    }

    if (!generationOutput.storage_bucket || !generationOutput.storage_path) {
      throw new Error('blocked:storage_path_missing:Generated DOCX storage path is missing.')
    }

    const originalRecipient = normalizeEmail(selectedOutput.recipient_email)
    originalRowRecipientPreview = originalRecipient
    const fileName = String(generationOutput.file_name || '')
    const storagePath = String(generationOutput.storage_path || '')
    const attachmentFileName = fileName || `row-${selectedOutput.row_number || generationOutput.row_index || 'document'}.docx`
    selectedAttachmentFileName = attachmentFileName

    if (![fileName, storagePath, attachmentFileName].some((value) => value.toLowerCase().endsWith('.docx'))) {
      throw new Error('blocked:docx_only:Only one DOCX attachment is allowed for owner-test sending.')
    }

    if (attachmentFileName.toLowerCase().endsWith('.pdf') || attachmentFileName.toLowerCase().endsWith('.zip')) {
      throw new Error('blocked:docx_only:ZIP and PDF attachments are not allowed for owner-test sending.')
    }

    const { data: fileData, error: downloadError } = await supabase.storage
      .from(generationOutput.storage_bucket)
      .download(generationOutput.storage_path)

    if (downloadError || !fileData) {
      throw new Error('blocked:storage_download_failed:Generated DOCX could not be downloaded from storage.')
    }

    const attachmentBytes = new Uint8Array(await fileData.arrayBuffer())

    if (attachmentBytes.byteLength === 0) {
      throw new Error('blocked:attachment_empty:DOCX attachment is empty.')
    }

    if (attachmentBytes.byteLength > maxAttachmentBytes) {
      throw new Error('blocked:attachment_too_large:DOCX attachment exceeds the owner-test size limit.')
    }

    auditLog('send_attempt_start', {
      emailDeliveryJobId,
      rowNumber: selectedOutput.row_number || null,
      recipientHash: await hashRecipientForAudit(originalRecipient),
      attachmentSizeBytes: attachmentBytes.byteLength,
    })

    const message = [
      selectedOutput.message || 'Your generated document is attached.',
      '',
      'Owner/test delivery preview context:',
      `Original row recipient: ${originalRecipient || 'not available'}`,
      'This controlled test email was delivered only to the configured owner/test email.',
    ].join('\n')

    const sendGridPayload = {
      personalizations: [
        {
          to: [{ email: ownerTestEmail }],
          subject: `[Owner Test] ${selectedOutput.subject || 'Your document is ready'}`,
        },
      ],
      from: {
        email: fromEmail,
        name: fromName,
      },
      content: [
        {
          type: 'text/plain',
          value: message,
        },
      ],
      attachments: [
        {
          content: bytesToBase64(attachmentBytes),
          type: DOCX_MIME_TYPE,
          filename: attachmentFileName,
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

    const recipientHash = await hashRecipientForAudit(originalRecipient)

    if (!sendGridResponse.ok) {
      const errorCode = getSendGridErrorCode(responseBody, `sendgrid_${sendGridResponse.status}`)
      const errorMessage = getSendGridErrorMessage(responseBody, responseText || 'SendGrid owner-test email failed.')

      await supabase
        .from('email_delivery_outputs')
        .update({
          owner_test_status: 'owner_test_failed',
          owner_test_error_code: errorCode,
          owner_test_error_message: errorMessage,
          owner_test_provider_message_id: providerMessageId,
        })
        .eq('id', selectedOutputId)

      await supabase
        .from('email_delivery_jobs')
        .update({
          owner_test_status: 'owner_test_failed',
          owner_test_sent_count: 0,
          owner_test_failed_count: 1,
        })
        .eq('id', emailDeliveryJobId)

      auditLog('failed_send', {
        emailDeliveryJobId,
        rowNumber: selectedOutput.row_number || null,
        recipientHash,
        providerStatus: sendGridResponse.status,
        providerMessageId,
        reasonCode: errorCode,
        responseBody: safeResponseBodyForLog(responseText, responseBody),
      })

      return jsonResponse({
        ok: false,
        mode: 'owner_test',
        status: 'owner_test_failed',
        emailDeliveryJobId,
        ownerTestEmailTarget: ownerTestEmail,
        originalRowRecipientPreview: originalRecipient,
        attachmentFileName,
        providerMessageId,
        errorCode,
        errorMessage,
        realEmailsDelivered: 0,
      })
    }

    const sentAt = new Date().toISOString()

    await supabase
      .from('email_delivery_outputs')
      .update({
        owner_test_status: 'owner_test_sent',
        owner_test_error_code: null,
        owner_test_error_message: null,
        owner_test_sent_at: sentAt,
        owner_test_provider_message_id: providerMessageId,
      })
      .eq('id', selectedOutputId)

    await supabase
      .from('email_delivery_jobs')
      .update({
        owner_test_status: 'owner_test_sent',
        owner_test_sent_count: 1,
        owner_test_failed_count: 0,
        owner_test_last_sent_at: sentAt,
      })
      .eq('id', emailDeliveryJobId)

    auditLog('successful_send', {
      emailDeliveryJobId,
      rowNumber: selectedOutput.row_number || null,
      recipientHash,
      providerStatus: sendGridResponse.status,
      providerMessageId,
    })

    return jsonResponse({
      ok: true,
      mode: 'owner_test',
      status: 'owner_test_sent',
      message: 'Owner test email sent. Exactly one real email was delivered to the configured owner/test email.',
      emailDeliveryJobId,
      ownerTestEmailTarget: ownerTestEmail,
      originalRowRecipientPreview: originalRecipient,
      attachmentFileName,
      providerMessageId,
      sentAt,
      realEmailsDelivered: 1,
    })
  } catch (error) {
    const parts = getErrorMessage(error, '').split(':')
    const isBlocked = parts[0] === 'blocked'
    const errorCode = isBlocked ? parts[1] : 'owner_test_send_error'
    const errorMessage = isBlocked ? parts.slice(2).join(':') : getErrorMessage(error, 'Owner-test send failed.')
    const status = isBlocked ? 'owner_test_blocked' : 'owner_test_failed'

    console.warn('SendGrid owner-test issue', {
      emailDeliveryJobId,
      rowId: selectedOutputId,
      status,
      errorCode,
      errorMessage,
    })

    if (emailDeliveryJobId && selectedOutputId) {
      const supabaseUrl = Deno.env.get('SUPABASE_URL')
      const supabaseServiceRoleKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')

      if (supabaseUrl && supabaseServiceRoleKey) {
        const supabase = createClient(supabaseUrl, supabaseServiceRoleKey, {
          auth: {
            persistSession: false,
            autoRefreshToken: false,
          },
        })

        await supabase
          .from('email_delivery_outputs')
          .update({
            owner_test_status: status,
            owner_test_error_code: errorCode,
            owner_test_error_message: errorMessage,
          })
          .eq('id', selectedOutputId)

        await supabase
          .from('email_delivery_jobs')
          .update({
            owner_test_status: status,
            owner_test_sent_count: 0,
            owner_test_failed_count: 1,
          })
          .eq('id', emailDeliveryJobId)
      }
    }

    return jsonResponse({
      ok: false,
      mode: 'owner_test',
      status,
      ownerTestEmailTarget,
      originalRowRecipientPreview,
      attachmentFileName: selectedAttachmentFileName,
      errorCode,
      errorMessage,
      realEmailsDelivered: 0,
    })
  }
})
