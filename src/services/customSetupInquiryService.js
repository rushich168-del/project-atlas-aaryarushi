import { isSupabaseConfigured, supabase } from '../lib/supabaseClient.js'

// Project Atlas v3.7 — public "Request Custom Setup" lead capture.
//
// Inserts a single row into public.custom_setup_inquiries. Insert-only by design:
// RLS allows anon/authenticated INSERT (status 'new') but no SELECT, so we never
// read leads back on the client — the v3.8 admin UI will read them via the
// service role. No secrets are referenced here beyond the shared browser client.

const TABLE = 'custom_setup_inquiries'

function clean(value) {
  return typeof value === 'string' ? value.trim() : ''
}

// Returns { ok: true } on success, or { ok: false, error } with a friendly message.
export async function createCustomSetupInquiry(payload = {}) {
  if (!isSupabaseConfigured) {
    return {
      ok: false,
      error: 'Setup requests are not available in this environment yet. Please reach out to our team directly.',
    }
  }

  const row = {
    name: clean(payload.name),
    organization_name: clean(payload.organizationName),
    role: clean(payload.role) || null,
    email: clean(payload.email),
    phone_whatsapp: clean(payload.phoneWhatsapp) || null,
    product_id: clean(payload.productId) || null,
    product_name: clean(payload.productName) || null,
    product_interested: clean(payload.productInterested),
    document_needs: clean(payload.documentNeeds),
    approximate_monthly_documents: clean(payload.approximateMonthlyDocuments) || null,
    message: clean(payload.message) || null,
    status: 'new',
    source: clean(payload.source) || 'website',
  }

  // Plain insert with no .select(): the RLS insert policy permits the write, but
  // there is no read policy, so requesting the row back would fail. We only need
  // to know whether the insert itself succeeded.
  const { error } = await supabase.from(TABLE).insert(row)

  if (error) {
    return {
      ok: false,
      error: 'We could not submit your request right now. Please try again in a moment.',
    }
  }

  return { ok: true }
}
