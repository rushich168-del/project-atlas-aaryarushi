import { serve } from 'https://deno.land/std@0.224.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.45.0'

const SENDGRID_MAIL_SEND_URL = 'https://api.sendgrid.com/v3/mail/send'
const DOCX_MIME_TYPE = 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
const DEFAULT_MAX_RECIPIENTS = 5
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

function parsePositiveInt(value: string | undefined, fallback: number) {
  const parsed = Number.parseInt(String(value || ''), 10)
  return Number.isFinite(parsed) && parsed > 0 ? parsed : fallback
}

function normalizeEmail(value: unknown) {
  return String(value || '').trim().toLowerCase()
}

function isValidEmail(value: unknown) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(String(value || '').trim())
}

function rowDataContainsRecipient(rowData: Record<string, unknown> | null, recipient: string) {
  const normalizedRecipient = normalizeEmail(recipient)

  if (!rowData || !normalizedRecipient) {
    return false
  }

  return Object.values(rowData).some((value) => normalizeEmail(value) === normalizedRecipient)
}

function bytesToBase64(bytes: Uint8Array) {
  let binary = ''
  const chunkSize = 0x8000

  for (let index = 0; index < bytes.length; index += chunkSize) {
    binary += String.fromCharCode(...bytes.subarray(index, index + chunkSize))
  }

  return btoa(binary)
}

function getSendGridErrorCode(body: unknown, fallback: string) {
  if (!body || typeof body !== 'object') {
    return fallback
  }

  const errors = (body as { errors?: Array<{ field?: string; message?: string; id?: string }> }).errors
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

function truncate(value: string, maxLength = 1000) {
  return value.length > maxLength ? `${value.slice(0, maxLength)}...` : value
}

function safeResponseBodyForLog(responseText: string, responseBody: unknown) {
  if (responseBody) {
    return truncate(JSON.stringify(responseBody))
  }

  return truncate(responseText || '')
}

function buildRowResult({
  rowId,
  generationOutputId,
  rowNumber,
  status,
  errorCode = null,
  errorMessage = null,
  providerMessageId = null,
  attachmentFileName = null,
  attachmentSizeBytes = null,
}: {
  rowId: string
  generationOutputId: string | null
  rowNumber: number | null
  status: string
  errorCode?: string | null
  errorMessage?: string | null
  providerMessageId?: string | null
  attachmentFileName?: string | null
  attachmentSizeBytes?: number | null
}) {
  return {
    rowId,
    generationOutputId,
    rowNumber,
    status,
    errorCode,
    errorMessage,
    providerMessageId,
    attachmentFileName,
    attachmentSizeBytes,
  }
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
    const provider = Deno.env.get('EMAIL_PROVIDER') || 'sendgrid'
    const providerMode = Deno.env.get('EMAIL_MODE') || 'sandbox'
    const allowProductionSend = Deno.env.get('EMAIL_ALLOW_PRODUCTION_SEND') === 'true'
    const sendGridApiKey = Deno.env.get('SENDGRID_API_KEY')
    const fromEmail = Deno.env.get('SENDGRID_FROM_EMAIL')
    const fromName = Deno.env.get('SENDGRID_FROM_NAME')
    const maxRecipients = parsePositiveInt(Deno.env.get('EMAIL_MAX_RECIPIENTS_PER_JOB'), DEFAULT_MAX_RECIPIENTS)
    const maxAttachmentBytes = parsePositiveInt(Deno.env.get('EMAIL_MAX_ATTACHMENT_MB'), DEFAULT_MAX_ATTACHMENT_MB) * 1024 * 1024

    if (!supabaseUrl || !supabaseServiceRoleKey) {
      return jsonResponse({ error: 'Edge function is not configured.' }, 500)
    }

    if (provider !== 'sendgrid' || providerMode !== 'sandbox' || allowProductionSend) {
      return jsonResponse({
        error: 'Production email sending is blocked. Configure SendGrid sandbox mode only.',
        blocked: true,
      }, 403)
    }

    const missingSendGridSecrets = [
      !sendGridApiKey ? 'SENDGRID_API_KEY' : '',
      !fromEmail ? 'SENDGRID_FROM_EMAIL' : '',
      !fromName ? 'SENDGRID_FROM_NAME' : '',
    ].filter(Boolean)

    if (missingSendGridSecrets.length > 0) {
      console.warn('SendGrid sandbox configuration missing required secrets', {
        missingSecrets: missingSendGridSecrets,
      })

      return jsonResponse({
        ok: false,
        provider,
        mode: providerMode,
        message: `SendGrid sandbox configuration is incomplete: ${missingSendGridSecrets.join(', ')} missing.`,
        emailDeliveryJobId: null,
        preparedRecipients: 0,
        sandboxValidated: 0,
        sandboxFailed: 0,
        blocked: 0,
        rowResults: [],
        firstError: {
          status: 'sandbox_failed',
          errorCode: 'missing_sendgrid_secret',
          errorMessage: `Missing required Edge Function secret: ${missingSendGridSecrets.join(', ')}`,
        },
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
    const emailDeliveryJobId = body.emailDeliveryJobId

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

    if (deliveryOutputs.length === 0) {
      await supabase
        .from('email_delivery_jobs')
        .update({ status: 'blocked' })
        .eq('id', emailDeliveryJobId)

      return jsonResponse({
        ok: true,
        provider,
        mode: providerMode,
        message: 'Sandbox validation blocked. No prepared recipients were found.',
        emailDeliveryJobId,
        preparedRecipients: 0,
        sandboxValidated: 0,
        sandboxFailed: 0,
        blocked: 0,
        realEmailsDelivered: 0,
      })
    }

    if (deliveryOutputs.length > maxRecipients) {
      await supabase
        .from('email_delivery_outputs')
        .update({
          status: 'blocked',
          error_code: 'recipient_limit_exceeded',
          error_message: `Sandbox validation supports a maximum of ${maxRecipients} recipients per job.`,
          provider,
          provider_mode: providerMode,
        })
        .eq('email_delivery_job_id', emailDeliveryJobId)

      await supabase
        .from('email_delivery_jobs')
        .update({ status: 'blocked', failed_count: deliveryOutputs.length })
        .eq('id', emailDeliveryJobId)

      return jsonResponse({
        ok: false,
        provider,
        mode: providerMode,
        message: `Sandbox validation blocked. Maximum ${maxRecipients} recipients are allowed.`,
        emailDeliveryJobId,
        preparedRecipients: deliveryOutputs.length,
        sandboxValidated: 0,
        sandboxFailed: 0,
        blocked: deliveryOutputs.length,
        realEmailsDelivered: 0,
      }, 400)
    }

    const generationOutputIds = deliveryOutputs
      .map((output) => output.generation_output_id)
      .filter(Boolean)

    const { data: generationOutputs, error: generationOutputsError } = generationOutputIds.length > 0
      ? await supabase
        .from('generation_outputs')
        .select('id, row_index, row_data, storage_bucket, storage_path, status, file_name')
        .in('id', generationOutputIds)
      : { data: [], error: null }

    if (generationOutputsError) {
      return jsonResponse({ error: 'Unable to load generated DOCX outputs.' }, 500)
    }

    const generationOutputById = new Map((generationOutputs || []).map((output) => [output.id, output]))
    const summary = {
      preparedRecipients: deliveryOutputs.length,
      sandboxValidated: 0,
      sandboxFailed: 0,
      blocked: 0,
    }
    const rowResults: Array<ReturnType<typeof buildRowResult>> = []

    await supabase
      .from('email_delivery_jobs')
      .update({ status: 'sandbox_queued' })
      .eq('id', emailDeliveryJobId)

    for (const output of deliveryOutputs) {
      const generationOutput = output.generation_output_id ? generationOutputById.get(output.generation_output_id) : null
      const recipient = String(output.recipient_email || '').trim()

      await supabase
        .from('email_delivery_outputs')
        .update({
          status: 'sandbox_queued',
          error_code: null,
          error_message: null,
          provider,
          provider_mode: providerMode,
          provider_message_id: null,
        })
        .eq('id', output.id)

      try {
        if (!isValidEmail(recipient)) {
          throw new Error('blocked:invalid_recipient:Recipient email is missing or invalid.')
        }

        if (!generationOutput) {
          throw new Error('blocked:generation_output_missing:Generated DOCX output was not found.')
        }

        if (generationOutput.status !== 'generated') {
          throw new Error('blocked:generation_output_not_ready:Generated output is not ready for sandbox validation.')
        }

        if (!rowDataContainsRecipient(generationOutput.row_data, recipient)) {
          throw new Error('blocked:recipient_not_in_row_data:Recipient email could not be confirmed from saved row data.')
        }

        if (!generationOutput.storage_bucket || !generationOutput.storage_path) {
          throw new Error('blocked:storage_path_missing:Generated DOCX storage path is missing.')
        }

        const fileName = String(generationOutput.file_name || '')
        const storagePath = String(generationOutput.storage_path || '')
        const attachmentFileName = fileName || `row-${output.row_number || generationOutput.row_index || 'document'}.docx`

        if (![fileName, storagePath].some((value) => value.toLowerCase().endsWith('.docx'))) {
          throw new Error('blocked:docx_only:Only DOCX attachments are allowed.')
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
          throw new Error('blocked:attachment_too_large:DOCX attachment exceeds the sandbox size limit.')
        }

        console.info('SendGrid sandbox attachment prepared', {
          rowId: output.id,
          generationOutputId: output.generation_output_id || null,
          rowNumber: output.row_number || null,
          attachmentFileName,
          attachmentSizeBytes: attachmentBytes.byteLength,
        })

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
              content: bytesToBase64(attachmentBytes),
              type: DOCX_MIME_TYPE,
              filename: attachmentFileName,
              disposition: 'attachment',
            },
          ],
          mail_settings: {
            sandbox_mode: {
              enable: true,
            },
          },
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
        const sendGridStatusCode = sendGridResponse.status

        console.info('SendGrid sandbox response', {
          rowId: output.id,
          generationOutputId: output.generation_output_id || null,
          rowNumber: output.row_number || null,
          statusCode: sendGridStatusCode,
          providerMessageId,
          responseBody: safeResponseBodyForLog(responseText, responseBody),
        })

        if (!sendGridResponse.ok) {
          const errorCode = getSendGridErrorCode(responseBody, `sendgrid_${sendGridStatusCode}`)
          const errorMessage = getSendGridErrorMessage(responseBody, responseText || 'SendGrid sandbox validation failed.')

          await supabase
            .from('email_delivery_outputs')
            .update({
              status: 'sandbox_failed',
              error_code: errorCode,
              error_message: errorMessage,
              provider,
              provider_mode: providerMode,
              provider_message_id: providerMessageId,
            })
            .eq('id', output.id)

          rowResults.push(buildRowResult({
            rowId: output.id,
            generationOutputId: output.generation_output_id || null,
            rowNumber: output.row_number ?? null,
            status: 'sandbox_failed',
            errorCode,
            errorMessage,
            providerMessageId,
            attachmentFileName,
            attachmentSizeBytes: attachmentBytes.byteLength,
          }))
          summary.sandboxFailed += 1
          continue
        }

        await supabase
          .from('email_delivery_outputs')
          .update({
            status: 'sandbox_validated',
            error_code: null,
            error_message: null,
            provider,
            provider_mode: providerMode,
            provider_message_id: providerMessageId,
          })
          .eq('id', output.id)

        rowResults.push(buildRowResult({
          rowId: output.id,
          generationOutputId: output.generation_output_id || null,
          rowNumber: output.row_number ?? null,
          status: 'sandbox_validated',
          providerMessageId,
          attachmentFileName,
          attachmentSizeBytes: attachmentBytes.byteLength,
        }))
        summary.sandboxValidated += 1
      } catch (error) {
        const parts = getErrorMessage(error, '').split(':')
        const isBlocked = parts[0] === 'blocked'
        const errorCode = isBlocked ? parts[1] : 'sandbox_validation_error'
        const errorMessage = isBlocked ? parts.slice(2).join(':') : 'Sandbox validation failed.'
        const rowStatus = isBlocked ? 'blocked' : 'sandbox_failed'

        console.warn('SendGrid sandbox row validation issue', {
          rowId: output.id,
          generationOutputId: output.generation_output_id || null,
          rowNumber: output.row_number || null,
          status: rowStatus,
          errorCode,
          errorMessage,
        })

        await supabase
          .from('email_delivery_outputs')
          .update({
            status: rowStatus,
            error_code: errorCode,
            error_message: errorMessage,
            provider,
            provider_mode: providerMode,
          })
          .eq('id', output.id)

        rowResults.push(buildRowResult({
          rowId: output.id,
          generationOutputId: output.generation_output_id || null,
          rowNumber: output.row_number ?? null,
          status: rowStatus,
          errorCode,
          errorMessage,
        }))

        if (isBlocked) {
          summary.blocked += 1
        } else {
          summary.sandboxFailed += 1
        }
      }
    }

    const finalJobStatus = summary.blocked > 0
      ? 'blocked'
      : summary.sandboxFailed > 0
        ? 'sandbox_failed'
        : 'sandbox_validated'

    await supabase
      .from('email_delivery_jobs')
      .update({
        status: finalJobStatus,
        sent_count: 0,
        failed_count: summary.sandboxFailed + summary.blocked,
        completed_at: new Date().toISOString(),
      })
      .eq('id', emailDeliveryJobId)

    return jsonResponse({
      ok: summary.sandboxFailed === 0 && summary.blocked === 0,
      provider,
      mode: providerMode,
      message: 'SendGrid sandbox validation finished. No real emails were delivered.',
      emailDeliveryJobId,
      ...summary,
      rowResults,
      firstError: rowResults.find((result) => result.errorMessage) || null,
      realEmailsDelivered: 0,
    })
  } catch (error) {
    return jsonResponse({
      error: 'SendGrid sandbox validation failed.',
      detail: getErrorMessage(error, 'Unknown error'),
      realEmailsDelivered: 0,
    }, 500)
  }
})
