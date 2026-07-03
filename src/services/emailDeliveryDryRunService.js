import { isSupabaseConfigured, supabase } from '../lib/supabaseClient.js'

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

  return {
    job,
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

export function getEmailDeliveryDryRunErrorMessage(error) {
  return normalizeEmailDeliveryError(error)
}
