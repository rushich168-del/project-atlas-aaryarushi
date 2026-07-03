import { isSupabaseConfigured, supabase } from '../lib/supabaseClient.js'
import { validateEmailRecipient } from './emailDeliveryService.js'

const EDGE_FUNCTION_NAME = 'email-delivery-dry-run'
const SENDGRID_SANDBOX_FUNCTION_NAME = 'email-delivery-sendgrid-sandbox'

function normalizeEmailDeliveryError(error) {
  if (!error) {
    return 'Unable to save email preparation at this time.'
  }

  if (typeof error === 'string') {
    return error
  }

  return error.message || 'Unable to save email preparation at this time.'
}

export async function createEmailDeliveryDryRunJob({ organizationId = null, userId, generationJobId = null } = {}) {
  if (!isSupabaseConfigured) {
    throw new Error('Email prep saving requires Supabase to be configured.')
  }

  if (!userId) {
    throw new Error('A signed-in user is required to save email preparation.')
  }

  const { data, error } = await supabase
    .from('email_delivery_jobs')
    .insert({
      organization_id: organizationId,
      user_id: userId,
      generation_job_id: generationJobId,
      status: 'prepared',
      mode: 'dry_run',
      total_recipients: 0,
      prepared_count: 0,
      sent_count: 0,
      failed_count: 0,
    })
    .select('id')
    .single()

  if (error) {
    throw error
  }

  return data
}

export async function createEmailDeliveryDryRunOutputs(jobId, outputs = []) {
  if (!jobId) {
    throw new Error('A delivery job is required before saving prepared outputs.')
  }

  if (!Array.isArray(outputs) || outputs.length === 0) {
    return []
  }

  const { data, error } = await supabase
    .from('email_delivery_outputs')
    .insert(
      outputs.map((output) => ({
        email_delivery_job_id: jobId,
        generation_output_id: output.generation_output_id || null,
        row_number: output.row_number ?? null,
        recipient_email: output.recipient_email || null,
        subject: output.subject || null,
        message: output.message || null,
        status: 'prepared',
      })),
    )
    .select('id')

  if (error) {
    throw error
  }

  return data || []
}

export async function prepareBatchEmailDryRun({ organizationId = null, userId, generationJobId = null, previews = [] } = {}) {
  const job = await createEmailDeliveryDryRunJob({ organizationId, userId, generationJobId })
  const createdOutputs = await createEmailDeliveryDryRunOutputs(job.id, previews)
  const validRecipientCount = (previews || []).filter((preview) => validateEmailRecipient(preview.recipient_email)).length

  const { data: updatedJob, error: updateError } = await supabase
    .from('email_delivery_jobs')
    .update({
      total_recipients: previews.length,
      prepared_count: validRecipientCount,
    })
    .eq('id', job.id)
    .select('*')
    .single()

  if (updateError) {
    throw updateError
  }

  return {
    job: updatedJob || job,
    outputs: createdOutputs,
  }
}

export async function getEmailDeliveryJob(jobId) {
  if (!jobId) {
    return null
  }

  const { data, error } = await supabase
    .from('email_delivery_jobs')
    .select('*')
    .eq('id', jobId)
    .single()

  if (error) {
    throw error
  }

  return data
}

export async function listEmailDeliveryOutputs(jobId) {
  if (!jobId) {
    return []
  }

  const { data, error } = await supabase
    .from('email_delivery_outputs')
    .select('*')
    .eq('email_delivery_job_id', jobId)
    .order('row_number', { ascending: true })

  if (error) {
    throw error
  }

  return data || []
}

export async function listEmailDeliveryDryRunJobsForGeneration(generationJobId) {
  if (!generationJobId) {
    return []
  }

  const { data, error } = await supabase
    .from('email_delivery_jobs')
    .select('*')
    .eq('generation_job_id', generationJobId)
    .order('created_at', { ascending: false })

  if (error) {
    throw error
  }

  return data || []
}

export async function checkEmailDeliveryDryRunWithEdgeFunction(emailDeliveryJobId) {
  if (!isSupabaseConfigured) {
    throw new Error('Email readiness check requires Supabase to be configured.')
  }

  if (!emailDeliveryJobId) {
    throw new Error('An email delivery job is required for the readiness check.')
  }

  const { data, error } = await supabase.functions.invoke(EDGE_FUNCTION_NAME, {
    body: { emailDeliveryJobId },
  })

  if (error) {
    throw error
  }

  return data
}

export async function validateEmailDeliverySendGridSandbox(emailDeliveryJobId) {
  if (!isSupabaseConfigured) {
    throw new Error('SendGrid sandbox validation requires Supabase to be configured.')
  }

  if (!emailDeliveryJobId) {
    throw new Error('An email delivery job is required for sandbox validation.')
  }

  const { data, error } = await supabase.functions.invoke(SENDGRID_SANDBOX_FUNCTION_NAME, {
    body: { emailDeliveryJobId },
  })

  if (error) {
    throw error
  }

  return data
}

export function getEmailDeliveryDryRunErrorMessage(error) {
  const message = normalizeEmailDeliveryError(error)

  if (/not found|404|function|failed to send/i.test(message)) {
    return 'Send readiness check is not deployed yet. Email prep is saved, and no emails were sent.'
  }

  if (/network|failed to fetch|fetch/i.test(message)) {
    return 'Send readiness check is not deployed yet. Email prep is saved, and no emails were sent.'
  }

  return message
}

export function getEmailDeliverySandboxErrorMessage(error) {
  const message = normalizeEmailDeliveryError(error)

  if (/not found|404|function|failed to send/i.test(message)) {
    return 'SendGrid sandbox validation is not deployed yet. No real emails were delivered.'
  }

  if (/network|failed to fetch|fetch/i.test(message)) {
    return 'SendGrid sandbox validation is not deployed yet. No real emails were delivered.'
  }

  return message
}
