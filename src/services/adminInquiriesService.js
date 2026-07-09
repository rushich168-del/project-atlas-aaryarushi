import { isSupabaseConfigured, supabase } from '../lib/supabaseClient.js'

// Project Atlas v3.8 — admin-only access to custom setup inquiries.
//
// Uses the normal browser Supabase client; all access is gated by RLS (admins
// only, via the is_app_admin() function). No service role key is used here.
// The client never reads the admin allowlist directly — it only asks Supabase
// for a boolean via the is_app_admin RPC.

const TABLE = 'custom_setup_inquiries'

export const INQUIRY_STATUSES = ['new', 'contacted', 'setup_started', 'completed']

// Returns true only for a logged-in, active admin. Any error / no session → false.
export async function getIsCurrentUserAdmin() {
  if (!isSupabaseConfigured) {
    return false
  }
  const { data, error } = await supabase.rpc('is_app_admin')
  if (error) {
    return false
  }
  return data === true
}

// Lists inquiries newest-first. RLS returns rows only to admins; a non-admin gets
// an empty/blocked result rather than data. Returns { ok, inquiries, error }.
export async function listCustomSetupInquiries() {
  if (!isSupabaseConfigured) {
    return { ok: false, inquiries: [], error: 'Inquiries are not available in this environment.' }
  }

  const { data, error } = await supabase
    .from(TABLE)
    .select(
      'id, created_at, updated_at, name, organization_name, role, email, phone_whatsapp, product_id, product_name, product_interested, document_needs, approximate_monthly_documents, message, status, source',
    )
    .order('created_at', { ascending: false })

  if (error) {
    return { ok: false, inquiries: [], error: 'We could not load inquiries right now. Please try again.' }
  }

  return { ok: true, inquiries: data || [], error: '' }
}

// Updates ONLY the status column. The payload is intentionally limited to status
// (updated_at is maintained by the DB trigger). Invalid statuses are rejected
// client-side before any request is made.
export async function updateCustomSetupInquiryStatus(id, status) {
  if (!INQUIRY_STATUSES.includes(status)) {
    return { ok: false, error: 'Invalid status.' }
  }
  if (!isSupabaseConfigured) {
    return { ok: false, error: 'Inquiries are not available in this environment.' }
  }

  const { error } = await supabase.from(TABLE).update({ status }).eq('id', id)

  if (error) {
    return { ok: false, error: 'We could not update the status right now. Please try again.' }
  }

  return { ok: true }
}
