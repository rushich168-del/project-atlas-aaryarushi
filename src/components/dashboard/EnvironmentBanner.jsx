import { AlertCircle } from 'lucide-react'
import { isSupabaseConfigured } from '../../lib/supabaseClient.js'

export default function EnvironmentBanner({ className = 'mb-5' }) {
  if (isSupabaseConfigured) {
    return null
  }

  return (
    <div className={`${className} flex gap-3 rounded-md border border-amber-200 bg-amber-50 px-4 py-3 text-sm font-medium leading-6 text-amber-800`}>
      <AlertCircle size={18} className="mt-0.5 shrink-0" aria-hidden="true" />
      <span>
        Project Atlas needs its Supabase connection before the live dashboard can be used. Add
        {' '}<span className="font-bold">VITE_SUPABASE_URL</span> and
        {' '}<span className="font-bold">VITE_SUPABASE_ANON_KEY</span> in the deployment environment.
      </span>
    </div>
  )
}
