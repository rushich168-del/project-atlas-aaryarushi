import { serve } from 'https://deno.land/std@0.224.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.45.0'

serve(async (req) => {
  try {
    const authHeader = req.headers.get('Authorization') || ''

    if (!authHeader.startsWith('Bearer ')) {
      return new Response(JSON.stringify({ error: 'Unauthorized' }), {
        status: 401,
        headers: { 'Content-Type': 'application/json' },
      })
    }

    const supabaseUrl = Deno.env.get('SUPABASE_URL')
    const supabaseServiceRoleKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')

    if (!supabaseUrl || !supabaseServiceRoleKey) {
      return new Response(JSON.stringify({ error: 'Edge function is not configured.' }), {
        status: 500,
        headers: { 'Content-Type': 'application/json' },
      })
    }

    const supabase = createClient(supabaseUrl, supabaseServiceRoleKey, {
      auth: {
        persistSession: false,
        autoRefreshToken: false,
      },
    })

    const { data: { user }, error: userError } = await supabase.auth.getUser(authHeader.replace('Bearer ', ''))

    if (userError || !user) {
      return new Response(JSON.stringify({ error: 'Unauthorized' }), {
        status: 401,
        headers: { 'Content-Type': 'application/json' },
      })
    }

    const body = await req.json().catch(() => ({}))
    const emailDeliveryJobId = body.emailDeliveryJobId

    if (!emailDeliveryJobId) {
      return new Response(JSON.stringify({ error: 'emailDeliveryJobId is required.' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' },
      })
    }

    const { data: job, error: jobError } = await supabase
      .from('email_delivery_jobs')
      .select('*')
      .eq('id', emailDeliveryJobId)
      .single()

    if (jobError || !job) {
      return new Response(JSON.stringify({ error: 'Email delivery job not found.' }), {
        status: 404,
        headers: { 'Content-Type': 'application/json' },
      })
    }

    if (job.user_id !== user.id) {
      return new Response(JSON.stringify({ error: 'Forbidden' }), {
        status: 403,
        headers: { 'Content-Type': 'application/json' },
      })
    }

    const { data: outputs, error: outputsError } = await supabase
      .from('email_delivery_outputs')
      .select('*')
      .eq('email_delivery_job_id', emailDeliveryJobId)

    if (outputsError) {
      return new Response(JSON.stringify({ error: 'Unable to load email delivery outputs.' }), {
        status: 500,
        headers: { 'Content-Type': 'application/json' },
      })
    }

    if (!outputs || outputs.length === 0) {
      return new Response(JSON.stringify({
        ok: true,
        mode: 'dry_run',
        message: 'Dry-run checked successfully. No emails were sent.',
        emailDeliveryJobId,
        totalRecipients: 0,
        preparedCount: 0,
        sendReady: false,
      }), {
        status: 200,
        headers: { 'Content-Type': 'application/json' },
      })
    }

    return new Response(JSON.stringify({
      ok: true,
      mode: 'dry_run',
      message: 'Dry-run checked successfully. No emails were sent.',
      emailDeliveryJobId,
      totalRecipients: outputs.length,
      preparedCount: outputs.length,
      sendReady: true,
    }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    })
  } catch (error) {
    return new Response(JSON.stringify({ error: 'Dry-run check failed.' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    })
  }
})
