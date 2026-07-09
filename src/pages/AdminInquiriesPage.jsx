import { useEffect, useMemo, useState } from 'react'
import { ChevronDown, ChevronUp, Loader2, ShieldAlert } from 'lucide-react'
import DashboardLayout from '../components/dashboard/DashboardLayout.jsx'
import {
  INQUIRY_STATUSES,
  getIsCurrentUserAdmin,
  listCustomSetupInquiries,
  updateCustomSetupInquiryStatus,
} from '../services/adminInquiriesService.js'

const STATUS_LABELS = {
  new: 'New',
  contacted: 'Contacted',
  setup_started: 'Setup started',
  completed: 'Completed',
}

const STATUS_STYLES = {
  new: 'border-blue-200 bg-blue-50 text-blue-700',
  contacted: 'border-amber-200 bg-amber-50 text-amber-700',
  setup_started: 'border-teal-200 bg-teal-50 text-teal-700',
  completed: 'border-emerald-200 bg-emerald-50 text-emerald-700',
}

function formatDate(value) {
  if (!value) return '—'
  try {
    return new Date(value).toLocaleString()
  } catch {
    return String(value)
  }
}

function DetailRow({ label, value }) {
  return (
    <div>
      <p className="text-[11px] font-semibold uppercase tracking-[0.08em] text-slate-400">{label}</p>
      <p className="mt-0.5 whitespace-pre-wrap text-sm leading-6 text-slate-700">{value || '—'}</p>
    </div>
  )
}

function InquiryRow({ inquiry, onStatusChange }) {
  const [expanded, setExpanded] = useState(false)
  const [saving, setSaving] = useState(false)
  const [rowError, setRowError] = useState('')

  async function handleStatus(nextStatus) {
    setRowError('')
    setSaving(true)
    const result = await onStatusChange(inquiry.id, nextStatus)
    setSaving(false)
    if (!result.ok) {
      setRowError(result.error || 'Could not update status.')
    }
  }

  return (
    <div className="rounded-lg border border-slate-200 bg-white p-4 shadow-sm">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="text-xs font-semibold text-slate-400">{formatDate(inquiry.created_at)}</p>
          <h3 className="mt-0.5 truncate text-base font-semibold text-primary">{inquiry.name}</h3>
          <p className="text-sm font-semibold text-slate-600">{inquiry.organization_name}</p>
          <p className="mt-1 text-sm text-slate-500">
            {inquiry.role ? `${inquiry.role} · ` : ''}
            {inquiry.email}
            {inquiry.phone_whatsapp ? ` · ${inquiry.phone_whatsapp}` : ''}
          </p>
          <div className="mt-2 flex flex-wrap gap-2 text-xs text-slate-600">
            <span className="rounded-md border border-slate-200 bg-lightBg px-2 py-1 font-semibold">
              Product: {inquiry.product_interested || inquiry.product_name || '—'}
            </span>
            {inquiry.approximate_monthly_documents ? (
              <span className="rounded-md border border-slate-200 bg-lightBg px-2 py-1 font-semibold">
                ~{inquiry.approximate_monthly_documents}/month
              </span>
            ) : null}
          </div>
        </div>

        <div className="flex flex-col items-end gap-2">
          <span className={`inline-flex rounded-md border px-2.5 py-1 text-xs font-semibold ${STATUS_STYLES[inquiry.status] || STATUS_STYLES.new}`}>
            {STATUS_LABELS[inquiry.status] || inquiry.status}
          </span>
          <label className="grid gap-1 text-right">
            <span className="text-[11px] font-semibold uppercase tracking-[0.08em] text-slate-400">Update status</span>
            <select
              value={inquiry.status}
              disabled={saving}
              onChange={(event) => handleStatus(event.target.value)}
              className="min-h-9 rounded-md border border-slate-200 bg-white px-2.5 text-sm font-semibold text-primary outline-none focus:border-accentBlue disabled:cursor-not-allowed disabled:opacity-60"
            >
              {INQUIRY_STATUSES.map((status) => (
                <option key={status} value={status}>{STATUS_LABELS[status]}</option>
              ))}
            </select>
          </label>
          {saving ? <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-slate-400"><Loader2 size={12} className="animate-spin" /> Saving…</span> : null}
          {rowError ? <span className="text-[11px] font-semibold text-rose-600">{rowError}</span> : null}
        </div>
      </div>

      <button
        type="button"
        onClick={() => setExpanded((current) => !current)}
        className="focus-ring mt-3 inline-flex items-center gap-1 text-xs font-semibold text-accentBlue"
        aria-expanded={expanded}
      >
        {expanded ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
        {expanded ? 'Hide details' : 'View details'}
      </button>

      {expanded ? (
        <div className="mt-3 grid gap-3 border-t border-slate-200 pt-3 sm:grid-cols-2">
          <DetailRow label="Documents to automate" value={inquiry.document_needs} />
          <DetailRow label="Notes / message" value={inquiry.message} />
          <DetailRow label="Product name" value={inquiry.product_name} />
          <DetailRow label="Product id" value={inquiry.product_id} />
          <DetailRow label="Source" value={inquiry.source} />
          <DetailRow label="Created" value={formatDate(inquiry.created_at)} />
          <DetailRow label="Last updated" value={formatDate(inquiry.updated_at)} />
        </div>
      ) : null}
    </div>
  )
}

export default function AdminInquiriesPage() {
  const [checkingAdmin, setCheckingAdmin] = useState(true)
  const [isAdmin, setIsAdmin] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [inquiries, setInquiries] = useState([])
  const [statusFilter, setStatusFilter] = useState('all')
  const [search, setSearch] = useState('')

  useEffect(() => {
    let active = true

    async function init() {
      const admin = await getIsCurrentUserAdmin()
      if (!active) return
      setIsAdmin(admin)
      setCheckingAdmin(false)

      if (!admin) {
        return
      }

      setLoading(true)
      const result = await listCustomSetupInquiries()
      if (!active) return
      if (result.ok) {
        setInquiries(result.inquiries)
        setError('')
      } else {
        setError(result.error)
      }
      setLoading(false)
    }

    init()
    return () => {
      active = false
    }
  }, [])

  async function handleStatusChange(id, status) {
    const result = await updateCustomSetupInquiryStatus(id, status)
    if (result.ok) {
      setInquiries((current) => current.map((item) => (item.id === id ? { ...item, status } : item)))
    }
    return result
  }

  const filtered = useMemo(() => {
    const term = search.trim().toLowerCase()
    return inquiries.filter((inquiry) => {
      if (statusFilter !== 'all' && inquiry.status !== statusFilter) {
        return false
      }
      if (!term) {
        return true
      }
      const haystack = [
        inquiry.name,
        inquiry.organization_name,
        inquiry.email,
        inquiry.product_interested,
        inquiry.product_name,
      ]
        .filter(Boolean)
        .join(' ')
        .toLowerCase()
      return haystack.includes(term)
    })
  }, [inquiries, statusFilter, search])

  return (
    <DashboardLayout title="Setup Inquiries" eyebrow="Admin" showBack currentView="admin-inquiries">
      <div className="px-4 py-6 sm:px-6 lg:px-8">
        {checkingAdmin ? (
          <div className="flex items-center gap-3 rounded-lg border border-slate-200 bg-white px-5 py-4 shadow-sm">
            <Loader2 size={18} className="animate-spin text-accentBlue" aria-hidden="true" />
            <span className="text-sm font-semibold text-slate-600">Checking admin access…</span>
          </div>
        ) : !isAdmin ? (
          <div className="max-w-xl rounded-lg border border-amber-200 bg-amber-50 p-6 shadow-sm">
            <div className="flex items-start gap-3">
              <ShieldAlert size={20} className="mt-0.5 shrink-0 text-amber-700" aria-hidden="true" />
              <div>
                <h2 className="text-base font-semibold text-amber-900">Admin access required</h2>
                <p className="mt-1 text-sm leading-6 text-amber-800">
                  This area is limited to approved admins. If you believe you should have access, please contact the Project Atlas team.
                </p>
              </div>
            </div>
          </div>
        ) : (
          <>
            <section className="rounded-lg border border-slate-200 bg-white p-4 shadow-sm">
              <div className="grid gap-3 sm:grid-cols-[1fr_220px]">
                <label className="flex min-h-11 items-center gap-3 rounded-md border border-slate-200 bg-lightBg px-3">
                  <input
                    value={search}
                    onChange={(event) => setSearch(event.target.value)}
                    placeholder="Search name, organization, email, or product"
                    className="min-w-0 flex-1 bg-transparent text-sm font-medium text-primary outline-none placeholder:text-slate-400"
                  />
                </label>
                <label className="flex min-h-11 items-center rounded-md border border-slate-200 bg-lightBg px-3">
                  <select
                    value={statusFilter}
                    onChange={(event) => setStatusFilter(event.target.value)}
                    className="min-w-0 flex-1 bg-transparent text-sm font-semibold text-primary outline-none"
                  >
                    <option value="all">All statuses</option>
                    {INQUIRY_STATUSES.map((status) => (
                      <option key={status} value={status}>{STATUS_LABELS[status]}</option>
                    ))}
                  </select>
                </label>
              </div>
              <p className="mt-3 text-sm font-semibold text-slate-500">{filtered.length} of {inquiries.length} inquiries shown</p>
            </section>

            <div className="mt-5">
              {loading ? (
                <div className="flex items-center gap-3 rounded-lg border border-slate-200 bg-white px-5 py-4 shadow-sm">
                  <Loader2 size={18} className="animate-spin text-accentBlue" aria-hidden="true" />
                  <span className="text-sm font-semibold text-slate-600">Loading inquiries…</span>
                </div>
              ) : error ? (
                <div className="rounded-lg border border-rose-200 bg-rose-50 px-5 py-4 shadow-sm">
                  <p className="text-sm font-semibold text-rose-700">{error}</p>
                </div>
              ) : filtered.length === 0 ? (
                <div className="rounded-lg border border-dashed border-slate-300 bg-white px-5 py-10 text-center shadow-sm">
                  <p className="text-sm font-semibold text-slate-500">
                    {inquiries.length === 0 ? 'No setup inquiries yet.' : 'No inquiries match your filters.'}
                  </p>
                </div>
              ) : (
                <div className="grid gap-3">
                  {filtered.map((inquiry) => (
                    <InquiryRow key={inquiry.id} inquiry={inquiry} onStatusChange={handleStatusChange} />
                  ))}
                </div>
              )}
            </div>
          </>
        )}
      </div>
    </DashboardLayout>
  )
}
