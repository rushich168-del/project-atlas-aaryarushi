import { AlertCircle, Database, Loader2 } from 'lucide-react'

export default function DataStateBanner({ loading, error, source, status, organization }) {
  if (loading) {
    return (
      <div className="mb-5 flex items-center gap-3 rounded-md border border-slate-200 bg-white px-4 py-3 text-sm font-semibold text-slate-600 shadow-sm">
        <Loader2 size={18} className="animate-spin text-accentBlue" aria-hidden="true" />
        Loading catalog data
      </div>
    )
  }

  if (error) {
    return (
      <div className="mb-5 flex gap-3 rounded-md border border-amber-200 bg-amber-50 px-4 py-3 text-sm font-medium leading-6 text-amber-800">
        <AlertCircle size={18} className="mt-0.5 shrink-0" aria-hidden="true" />
        <span>{error}</span>
      </div>
    )
  }

  if (source === 'supabase' && status === 'connected') {
    return (
      <div className="mb-5 flex items-center gap-3 rounded-md border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm font-semibold text-emerald-700">
        <Database size={18} aria-hidden="true" />
        Supabase catalog connected{organization?.name ? `: ${organization.name}` : ''}
      </div>
    )
  }

  return null
}
