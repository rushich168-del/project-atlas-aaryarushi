import { serve } from 'https://deno.land/std@0.224.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.45.0'

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

// Server-side recipient validation. Readiness is decided here, not by the client.
function isValidRecipientEmail(value: unknown) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(String(value || '').trim())
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
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

    const { data: { user }, error: userError } = await supabase.auth.getUser(authHeader.replace('Bearer ', ''))

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

    if (job.user_id !== user.id) {
      return jsonResponse({ error: 'Forbidden' }, 403)
    }

    const { data: outputs, error: outputsError } = await supabase
      .from('email_delivery_outputs')
      .select('*')
      .eq('email_delivery_job_id', emailDeliveryJobId)

    if (outputsError) {
      return jsonResponse({ error: 'Unable to load email delivery outputs.' }, 500)
    }

    const deliveryOutputs = outputs || []
    const totalRecipients = deliveryOutputs.length
    // preparedCount is the count of rows with a valid recipient email, not the raw
    // row count. Readiness is authoritative and computed entirely server-side.
    const preparedCount = deliveryOutputs.filter((output) => isValidRecipientEmail(output.recipient_email)).length
    const sendReady = totalRecipients > 0 && preparedCount === totalRecipients

    return jsonResponse({
      ok: true,
      mode: 'dry_run',
      authoritative: true,
      message: 'Dry-run checked successfully. No emails were sent.',
      emailDeliveryJobId,
      totalRecipients,
      preparedCount,
      sendReady,
    })
  } catch (error) {
    return jsonResponse({ error: 'Dry-run check failed.' }, 500)
  }
})
