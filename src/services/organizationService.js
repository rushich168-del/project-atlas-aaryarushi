import { isSupabaseConfigured, supabase } from '../lib/supabaseClient.js'

export async function getOrganizations() {
  if (!isSupabaseConfigured) {
    return []
  }

  const { data, error } = await supabase
    .from('organizations')
    .select('id, name, slug, created_by, created_at, updated_at')
    .order('created_at', { ascending: true })

  if (error) {
    throw error
  }

  return data || []
}
