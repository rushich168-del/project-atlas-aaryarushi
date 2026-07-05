import { useEffect, useLayoutEffect, useMemo, useRef, useState } from 'react'
import { AlertCircle, CalendarDays, Download, FileClock, FileText, Loader2, RefreshCw, Search, X } from 'lucide-react'
import DashboardLayout from '../components/dashboard/DashboardLayout.jsx'
import EnvironmentBanner from '../components/dashboard/EnvironmentBanner.jsx'
import { useWorkspace } from '../hooks/useWorkspace.js'
import { createBatchDocxZip, downloadGeneratedCertificateDocx } from '../features/certificate/services/certificateOutputsService.js'
import { deleteGeneratedDocument, deleteGenerationJob, deleteGenerationOutput, getGeneratedDocumentsHistory, getGenerationJobsHistory } from '../services/generatedDocumentsService.js'
import { getDownloadError, getFriendlyError } from '../utils/errorMessages.js'
import { navigateTo, restoreScrollForPath, saveHistoryScrollPosition } from '../utils/routes.js'
import EmailPreparationPanel from '../components/email/EmailPreparationPanel.jsx'
import { getEmailDeliveryDryRunErrorMessage, listEmailDeliveryDryRunJobsForGeneration } from '../services/emailDeliveryDryRunService.js'

const statusOptions = [
  { value: 'all', label: 'All statuses' },
  { value: 'ready', label: 'Ready' },
  { value: 'failed', label: 'Failed' },
  { value: 'completed', label: 'Completed' },
  { value: 'completed_with_errors', label: 'Completed with errors' },
  { value: 'running', label: 'Running' },
]

const dateOptions = [
  { value: 'all', label: 'All dates' },
  { value: 'today', label: 'Today' },
  { value: '7', label: 'Last 7 days' },
  { value: '30', label: 'Last 30 days' },
]

const historyPath = '/dashboard/history'
const historyExpandedJobsKey = 'project-atlas:history:expanded-jobs'
const historyEmailPrepKey = 'project-atlas:history:email-prep-open'

function getSessionObject(key) {
  try {
    const value = window.sessionStorage.getItem(key)
    const parsedValue = value ? JSON.parse(value) : {}
    return parsedValue && typeof parsedValue === 'object' && !Array.isArray(parsedValue) ? parsedValue : {}
  } catch {
    return {}
  }
}

function setSessionObject(key, value) {
  try {
    window.sessionStorage.setItem(key, JSON.stringify(value))
  } catch {
    // UI-only session state is best effort.
  }
}

function formatFileSize(size) {
  const bytes = Number(size || 0)

  if (!bytes) {
    return '0 KB'
  }

  if (bytes < 1024 * 1024) {
    return `${Math.max(1, Math.round(bytes / 1024))} KB`
  }

  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`
}

function formatDate(value) {
  if (!value) {
    return 'Unknown date'
  }

  return new Intl.DateTimeFormat(undefined, {
    dateStyle: 'medium',
    timeStyle: 'short',
  }).format(new Date(value))
}

function getDateCutoff(dateFilter) {
  if (dateFilter === 'today') {
    const today = new Date()
    today.setHours(0, 0, 0, 0)
    return today
  }

  if (dateFilter === '7' || dateFilter === '30') {
    const cutoff = new Date()
    cutoff.setDate(cutoff.getDate() - Number(dateFilter))
    return cutoff
  }

  return null
}

function matchesDateFilter(document, dateFilter) {
  const cutoff = getDateCutoff(dateFilter)

  if (!cutoff) {
    return true
  }

  const createdAt = new Date(document.created_at)
  return !Number.isNaN(createdAt.getTime()) && createdAt >= cutoff
}

function StatusBadge({ status }) {
  const ready = status === 'ready'

  return (
    <span className={`inline-flex min-h-7 items-center rounded-md border px-2.5 text-xs font-bold uppercase tracking-[0.08em] ${ready ? 'border-emerald-200 bg-emerald-50 text-emerald-700' : 'border-amber-200 bg-amber-50 text-amber-700'}`}>
      {ready ? 'Ready' : 'Failed'}
    </span>
  )
}

function BatchStatusBadge({ status }) {
  const completed = status === 'completed'
  const running = status === 'running'
  const label = status === 'completed_with_errors' ? 'Completed with errors' : status

  return (
    <span className={`inline-flex min-h-7 items-center rounded-md border px-2.5 text-xs font-bold uppercase tracking-[0.08em] ${
      completed ? 'border-emerald-200 bg-emerald-50 text-emerald-700' : running ? 'border-blue-200 bg-blue-50 text-blue-700' : 'border-amber-200 bg-amber-50 text-amber-700'
    }`}>
      {label}
    </span>
  )
}

function OutputStatusBadge({ status }) {
  const generated = status === 'generated'

  return (
    <span className={`inline-flex min-h-7 items-center rounded-md border px-2.5 text-xs font-bold uppercase tracking-[0.08em] ${generated ? 'border-emerald-200 bg-emerald-50 text-emerald-700' : 'border-amber-200 bg-amber-50 text-amber-700'}`}>
      {status}
    </span>
  )
}

function FilterSelect({ label, value, onChange, children }) {
  return (
    <label className="grid gap-2">
      <span className="text-xs font-semibold uppercase tracking-[0.12em] text-slate-400">{label}</span>
      <select
        value={value}
        onChange={(event) => onChange(event.target.value)}
        className="min-h-11 rounded-md border border-slate-200 bg-white px-3 text-sm font-semibold text-primary outline-none transition focus:border-accentBlue focus:ring-2 focus:ring-blue-100"
      >
        {children}
      </select>
    </label>
  )
}

function EmptyState({ filtered, onClear }) {
  return (
    <section className="rounded-lg border border-dashed border-slate-300 bg-white p-8 shadow-sm">
      <div className="mx-auto flex max-w-xl flex-col items-center text-center">
        <span className="flex h-12 w-12 items-center justify-center rounded-md bg-blue-50 text-accentBlue">
          <FileClock size={24} aria-hidden="true" />
        </span>
        <h2 className="mt-5 text-2xl font-semibold text-primary">{filtered ? 'No matching records' : 'No generated documents yet'}</h2>
        <p className="mt-3 leading-7 text-slate-600">
          {filtered ? 'Adjust the search or filters to see more generated DOCX records.' : 'Generate a DOCX from AR-CERT-PRO and it will appear here.'}
        </p>
        {filtered ? (
          <button type="button" onClick={onClear} className="focus-ring mt-5 inline-flex min-h-10 items-center gap-2 rounded-md bg-accentTeal px-3.5 text-sm font-bold text-white transition hover:bg-teal-800">
            <X size={17} aria-hidden="true" />
            Clear filters
          </button>
        ) : (
          <button type="button" onClick={() => navigateTo('/dashboard/products/ar-cert-pro/workspace')} className="focus-ring mt-5 inline-flex min-h-10 items-center gap-2 rounded-md bg-accentTeal px-3.5 text-sm font-bold text-white transition hover:bg-teal-800">
            <FileText size={17} aria-hidden="true" />
            Open AR-CERT-PRO workspace
          </button>
        )}
      </div>
    </section>
  )
}

function restoreScrollAfterListUpdate(scrollY) {
  window.requestAnimationFrame(() => {
    window.requestAnimationFrame(() => {
      const maxScrollY = Math.max(0, window.document.documentElement.scrollHeight - window.innerHeight)
      window.scrollTo({ top: Math.min(scrollY, maxScrollY), behavior: 'auto' })
    })
  })
}

function HistoryRow({ document, selected, onSelect, downloading, deletingId, downloadError, deleteError, onDownload, onDelete }) {
  const rowError = typeof downloadError === 'string' ? downloadError : downloadError?.message
  const technicalDetail = typeof downloadError === 'string' ? '' : downloadError?.technicalDetail
  const rowDeleteError = typeof deleteError === 'string' ? deleteError : deleteError?.message

  return (
    <tr className="border-t border-slate-100 align-top transition hover:bg-slate-50">
      <td className="px-2 py-2">
        <input
          type="checkbox"
          checked={selected}
          onChange={(event) => onSelect(event.target.checked)}
          className="h-4 w-4 rounded border-slate-300 text-primary focus:ring-primary"
          aria-label={`Select ${document.file_name}`}
        />
      </td>
      <td className="px-2 py-2">
        <p className="max-w-[260px] truncate text-sm font-bold text-primary">{document.file_name}</p>
        <p className="mt-0.5 text-xs font-semibold text-slate-500">DOCX / {formatFileSize(document.file_size)}</p>
        {rowError ? <p className="mt-2 text-xs font-semibold text-red-600">{rowError}</p> : null}
        {technicalDetail ? <p className="mt-1 text-xs font-medium text-red-500">Detail: {technicalDetail}</p> : null}
        {rowDeleteError ? <p className="mt-2 text-xs font-semibold text-red-600">{rowDeleteError}</p> : null}
      </td>
      <td className="px-2 py-2">
        <p className="text-sm font-semibold text-primary">{document.productName}</p>
        <p className="mt-0.5 text-xs font-semibold text-slate-500">{document.productCode || 'No product code'}</p>
      </td>
      <td className="px-2 py-2 text-sm font-semibold text-slate-600">{formatDate(document.created_at)}</td>
      <td className="px-2 py-2">
        <StatusBadge status={document.status} />
      </td>
      <td className="px-2 py-2 text-right">
        <div className="flex justify-end gap-2">
          <button
            type="button"
            onClick={() => onDownload(document)}
            disabled={downloading}
            className="focus-ring inline-flex min-h-8 items-center justify-center gap-1.5 rounded-md border border-slate-200 bg-white px-2.5 text-xs font-bold text-primary transition hover:border-accentBlue hover:text-accentBlue disabled:cursor-not-allowed disabled:opacity-60"
          >
            {downloading ? <Loader2 size={16} className="animate-spin" aria-hidden="true" /> : <Download size={16} aria-hidden="true" />}
            Download
          </button>
          <button
            type="button"
            onClick={() => onDelete(document)}
            disabled={deletingId === document.id}
            className="focus-ring inline-flex min-h-8 items-center justify-center gap-1.5 rounded-md border border-red-200 bg-white px-2.5 text-xs font-bold text-red-700 transition hover:bg-red-50 disabled:cursor-not-allowed disabled:opacity-60"
          >
            Delete
          </button>
        </div>
      </td>
    </tr>
  )
}

function HistoryCard({ document, selected, onSelect, downloading, deletingId, downloadError, deleteError, onDownload, onDelete }) {
  const rowError = typeof downloadError === 'string' ? downloadError : downloadError?.message
  const technicalDetail = typeof downloadError === 'string' ? '' : downloadError?.technicalDetail
  const rowDeleteError = typeof deleteError === 'string' ? deleteError : deleteError?.message

  return (
    <article className="rounded-lg border border-slate-200 bg-white p-2.5 shadow-sm">
      <div className="flex items-start justify-between gap-2">
        <div className="flex min-w-0 items-start gap-2">
          <input
            type="checkbox"
            checked={selected}
            onChange={(event) => onSelect(event.target.checked)}
            className="mt-1 h-4 w-4 rounded border-slate-300 text-primary focus:ring-primary"
            aria-label={`Select ${document.file_name}`}
          />
          <div className="min-w-0">
            <p className="truncate text-sm font-bold text-primary">{document.file_name}</p>
            <p className="mt-0.5 text-xs font-semibold text-slate-500">DOCX / {formatFileSize(document.file_size)}</p>
            <p className="mt-0.5 text-xs font-semibold text-slate-500">{formatDate(document.created_at)}</p>
          </div>
        </div>
        <StatusBadge status={document.status} />
      </div>
      <p className="mt-2 text-sm font-semibold text-primary">{document.productName}</p>
      {rowError ? <p className="mt-3 text-xs font-semibold text-red-600">{rowError}</p> : null}
      {technicalDetail ? <p className="mt-1 text-xs font-medium text-red-500">Detail: {technicalDetail}</p> : null}
      {rowDeleteError ? <p className="mt-2 text-xs font-semibold text-red-600">{rowDeleteError}</p> : null}
      <div className="mt-2 grid gap-2 sm:grid-cols-2">
        <button
          type="button"
          onClick={() => onDownload(document)}
          disabled={downloading}
          className="focus-ring inline-flex min-h-9 w-full items-center justify-center gap-2 rounded-md border border-slate-200 bg-white px-3 text-sm font-bold text-primary transition hover:border-accentBlue hover:text-accentBlue disabled:cursor-not-allowed disabled:opacity-60"
        >
          {downloading ? <Loader2 size={16} className="animate-spin" aria-hidden="true" /> : <Download size={16} aria-hidden="true" />}
          Download DOCX
        </button>
        <button
          type="button"
          onClick={() => onDelete(document)}
          disabled={deletingId === document.id}
          className="focus-ring inline-flex min-h-9 w-full items-center justify-center gap-2 rounded-md border border-red-200 bg-white px-3 text-sm font-bold text-red-700 transition hover:bg-red-50 disabled:cursor-not-allowed disabled:opacity-60"
        >
          {deletingId === document.id ? 'Deleting...' : 'Delete'}
        </button>
      </div>
    </article>
  )
}

function BatchJobCard({ job, expanded, selected, onSelect, onToggle, emailPrepOpen, onEmailPrepToggle, onDownload, onDownloadZip, batchZipState, deletingId, onDeleteJob, onDeleteOutput, downloadingId, downloadErrors, deleteErrors }) {
  const generatedCount = (job.outputs || []).filter((output) => output.status === 'generated').length
  const canDownloadZip = generatedCount > 1
  const zipState = batchZipState?.[job.id] || {}
  const jobDeleteError = typeof deleteErrors[job.id] === 'string' ? deleteErrors[job.id] : deleteErrors[job.id]?.message
  const [emailPrepSummary, setEmailPrepSummary] = useState(null)
  const [emailPrepLoading, setEmailPrepLoading] = useState(false)
  const [emailPrepError, setEmailPrepError] = useState('')

  const rowExample = job.outputs?.[0] || null
  const exampleRow = rowExample ? { row_index: rowExample.row_index, display_name: rowExample.display_name } : null

  useEffect(() => {
    let active = true

    async function loadEmailPrepStatus() {
      if (!job?.id) {
        return
      }

      setEmailPrepLoading(true)
      setEmailPrepError('')

      try {
        const jobs = await listEmailDeliveryDryRunJobsForGeneration(job.id)

        if (!active) {
          return
        }

        const latestJob = jobs.find((entry) => entry.mode === 'dry_run') || jobs[0] || null
        setEmailPrepSummary(latestJob ? {
          status: latestJob.status || 'prepared',
          mode: latestJob.mode || 'dry_run',
          preparedCount: latestJob.prepared_count ?? latestJob.total_recipients ?? 0,
          createdAt: latestJob.created_at,
        } : null)
      } catch (error) {
        if (!active) {
          return
        }

        const message = getEmailDeliveryDryRunErrorMessage(error)
        const fallback = message.includes('does not exist') || message.includes('relation') || message.includes('table')
          ? 'Email prep saving requires email delivery tables to be enabled.'
          : message
        setEmailPrepSummary(null)
        setEmailPrepError(fallback)
      } finally {
        if (active) {
          setEmailPrepLoading(false)
        }
      }
    }

    loadEmailPrepStatus()

    return () => {
      active = false
    }
  }, [job?.id])

  return (
    <article className="rounded-lg border border-slate-200 bg-white p-2.5 shadow-sm">
      <div className="grid gap-2 lg:grid-cols-[1fr_auto] lg:items-center">
        <div className="flex min-w-0 items-start gap-2">
          <input
            type="checkbox"
            checked={selected}
            onChange={(event) => onSelect(event.target.checked)}
            className="mt-1 h-4 w-4 rounded border-slate-300 text-primary focus:ring-primary"
            aria-label={`Select batch ${job.id}`}
          />
          <div className="min-w-0">
          <div className="flex flex-wrap items-center gap-2">
            <h3 className="text-sm font-bold text-primary">{job.productName || 'Unknown product'}</h3>
            <BatchStatusBadge status={job.status} />
          </div>
          <p className="mt-0.5 text-xs font-semibold text-slate-600">{formatDate(job.created_at)}</p>
          <p className="mt-0.5 text-xs font-semibold text-slate-500">
            {job.success_count} generated, {job.failure_count} failed/skipped, {job.total_rows} total rows
          </p>
          </div>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <button
            type="button"
            onClick={() => onToggle(job.id)}
            className="focus-ring inline-flex min-h-8 items-center justify-center rounded-md border border-slate-200 bg-white px-2.5 text-xs font-bold text-primary transition hover:border-accentBlue hover:text-accentBlue"
          >
            {expanded ? 'Hide details' : 'View details'}
          </button>
          {expanded ? (
            <button
              type="button"
              onClick={() => onDeleteJob(job)}
              disabled={deletingId === job.id}
              className="focus-ring inline-flex min-h-8 items-center justify-center rounded-md border border-red-200 bg-white px-2.5 text-xs font-bold text-red-700 transition hover:bg-red-50 disabled:opacity-60"
            >
              {deletingId === job.id ? 'Deleting...' : 'Delete'}
            </button>
          ) : null}
        </div>
      </div>
      {expanded ? (
        <div className="mt-2 space-y-2 border-t border-slate-100 pt-2">
          {jobDeleteError ? <p className="rounded-md border border-red-200 bg-red-50 px-3 py-2 text-sm font-semibold text-red-700">{jobDeleteError}</p> : null}
          <div className="flex flex-wrap items-center justify-between gap-2">
            <div className="flex flex-wrap items-center gap-2">
              <p className="text-sm font-bold text-primary">Batch details</p>
              <span className="rounded-md border border-emerald-200 bg-emerald-50 px-2 py-1 text-xs font-semibold text-emerald-700">{job.success_count} generated</span>
              <span className="rounded-md border border-amber-200 bg-amber-50 px-2 py-1 text-xs font-semibold text-amber-700">{job.failure_count} failed/skipped</span>
              <span className="rounded-md border border-slate-200 bg-slate-50 px-2 py-1 text-xs font-semibold text-slate-600">{job.total_rows} total</span>
            </div>
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => onDownloadZip(job)}
                disabled={!canDownloadZip || zipState.preparing}
                className="focus-ring inline-flex min-h-8 items-center justify-center gap-2 rounded-md bg-accentTeal px-2.5 text-xs font-semibold text-white transition hover:bg-teal-800 disabled:cursor-not-allowed disabled:bg-slate-100 disabled:text-slate-400 disabled:opacity-60"
              >
                {zipState.preparing ? <Loader2 size={16} className="animate-spin" aria-hidden="true" /> : <Download size={16} aria-hidden="true" />}
                {zipState.preparing ? 'Preparing ZIP...' : 'Download Batch ZIP'}
              </button>
            </div>
          </div>
          {zipState.progressMessage ? <p className="text-sm font-medium text-slate-600">{zipState.progressMessage}</p> : null}
          {zipState.warningMessage ? <p className="text-sm font-semibold text-amber-700">{zipState.warningMessage}</p> : null}
          {zipState.errorMessage ? <p className="text-sm font-semibold text-red-600">{zipState.errorMessage}</p> : null}
          <div className="overflow-x-auto rounded-lg border border-slate-200 bg-white">
          <table className="min-w-[620px] w-full text-left">
            <thead className="border-b border-slate-200 bg-slate-50 text-xs font-bold uppercase tracking-[0.08em] text-slate-500">
              <tr>
                <th className="px-2 py-2">File</th>
                <th className="px-2 py-2">Status</th>
                <th className="px-2 py-2">Generated</th>
                <th className="px-2 py-2 text-right">Actions</th>
              </tr>
            </thead>
            <tbody>
              {job.outputs.map((output) => (
                <tr key={output.id} className="border-t border-slate-100 transition hover:bg-slate-50">
                  <td className="px-2 py-2">
                    <p className="text-sm font-semibold text-primary">Row {output.row_index} / {output.display_name || 'Unnamed row'}</p>
                    {output.error_message ? <p className="mt-0.5 text-xs font-medium text-amber-700">{output.error_message}</p> : null}
                  </td>
                  <td className="px-2 py-2"><OutputStatusBadge status={output.status} /></td>
                  <td className="px-2 py-2 text-xs font-semibold text-slate-600">{formatDate(output.created_at)}</td>
                  <td className="px-2 py-2 text-right">
                    <div className="flex flex-wrap items-center justify-end gap-2 whitespace-nowrap">
                      {output.status === 'generated' ? (
                        <button
                          type="button"
                          onClick={() => onDownload(output)}
                          disabled={downloadingId === output.id}
                          className="focus-ring inline-flex min-h-8 items-center gap-1.5 rounded-md border border-slate-200 bg-white px-2.5 text-xs font-bold text-primary transition hover:border-accentBlue hover:text-accentBlue disabled:opacity-60"
                        >
                          {downloadingId === output.id ? <Loader2 size={14} className="animate-spin" aria-hidden="true" /> : <Download size={14} aria-hidden="true" />}
                          Download
                        </button>
                      ) : (
                        <span className="text-xs font-semibold text-slate-400">No file</span>
                      )}
                      <button
                        type="button"
                        onClick={() => onDeleteOutput(output)}
                        disabled={deletingId === output.id}
                        className="focus-ring inline-flex min-h-8 items-center justify-center rounded-md border border-red-200 bg-white px-2.5 text-xs font-bold text-red-700 transition hover:bg-red-50 disabled:opacity-60"
                      >
                        Delete
                      </button>
                    </div>
                    {deleteErrors[output.id] ? <p className="mt-1 text-xs font-semibold text-red-600">{deleteErrors[output.id].message || deleteErrors[output.id]}</p> : null}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <details
          open={emailPrepOpen}
          onToggle={(event) => onEmailPrepToggle(job.id, event.currentTarget.open)}
          className="rounded-lg border border-slate-200 bg-slate-50 p-2.5"
        >
          <summary className="cursor-pointer text-xs font-semibold uppercase tracking-[0.08em] text-slate-500">
            Email preparation{emailPrepSummary ? ` / saved ${emailPrepSummary.preparedCount || 0}` : ''}
          </summary>
          <div className="mt-2">
          <div className="mb-3 rounded-lg border border-slate-200 bg-slate-50 p-3">
            <p className="text-xs font-semibold uppercase tracking-[0.12em] text-slate-400">Email Preparation</p>
            {emailPrepLoading ? (
              <p className="mt-2 text-sm text-slate-600">Checking saved email prep…</p>
            ) : emailPrepSummary ? (
              <div className="mt-2 space-y-1 text-sm text-slate-700">
                <p><span className="font-semibold">Status:</span> Saved</p>
                <p><span className="font-semibold">Mode:</span> {emailPrepSummary.mode === 'dry_run' ? 'Dry Run' : emailPrepSummary.mode}</p>
                <p><span className="font-semibold">Prepared recipients:</span> {emailPrepSummary.preparedCount}</p>
                <p><span className="font-semibold">No emails sent</span></p>
              </div>
            ) : (
              <div className="mt-2 space-y-1 text-sm text-slate-700">
                <p><span className="font-semibold">Status:</span> Not saved</p>
                <p><span className="font-semibold">Mode:</span> Dry Run</p>
                <p><span className="font-semibold">No emails sent</span></p>
              </div>
            )}
            {emailPrepError ? <p className="mt-2 text-sm font-semibold text-amber-700">{emailPrepError}</p> : null}
          </div>
          <EmailPreparationPanel
            rows={[]}
            outputs={job.outputs || []}
            columns={[]}
            onDownload={onDownload}
            generationJobId={job.id}
            title="Batch email preparation"
            helperText="Prepare manual email copy for batch outputs using saved row data when available."
            statusText="Manual Prep / Auto Send Coming Soon"
          />
          <p className="mt-3 text-xs leading-5 text-slate-500">
            Email preview uses saved row data when available. Older batch history records may not include recipient or row-level values.
          </p>
          </div>
        </details>
      </div>
      ) : null}
    </article>
  )
}

export default function HistoryPage() {
  const { currentOrganization, currentOrganizationId, loading: workspaceLoading, error: workspaceError, source } = useWorkspace()
  const [documents, setDocuments] = useState([])
  const [jobs, setJobs] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [metadataWarning, setMetadataWarning] = useState('')
  const [searchTerm, setSearchTerm] = useState('')
  const [productFilter, setProductFilter] = useState('all')
  const [statusFilter, setStatusFilter] = useState('all')
  const [dateFilter, setDateFilter] = useState('all')
  const [downloadingId, setDownloadingId] = useState('')
  const [deletingId, setDeletingId] = useState('')
  const [downloadErrors, setDownloadErrors] = useState({})
  const [deleteErrors, setDeleteErrors] = useState({})
  const [batchZipProgress, setBatchZipProgress] = useState({})
  const [expandedJobs, setExpandedJobs] = useState(() => getSessionObject(historyExpandedJobsKey))
  const [emailPrepOpenJobs, setEmailPrepOpenJobs] = useState(() => getSessionObject(historyEmailPrepKey))
  const [selectedRecords, setSelectedRecords] = useState({})

  async function loadHistory() {
    if (workspaceLoading) {
      return
    }

    setLoading(true)
    setError('')
    setMetadataWarning('')

    try {
      const [documentsResult, jobsResult] = await Promise.all([
        getGeneratedDocumentsHistory(currentOrganizationId),
        getGenerationJobsHistory(currentOrganizationId),
      ])
      setDocuments(documentsResult.documents)
      setJobs(jobsResult.jobs)
      setMetadataWarning([jobsResult.metadataWarning, documentsResult.metadataWarning].filter(Boolean).join(' '))
    } catch (loadError) {
      setDocuments([])
      setJobs([])
      setError(getFriendlyError(loadError, 'Generated document history could not be loaded. Check the workspace connection and try again.'))
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadHistory()
  }, [currentOrganizationId, workspaceLoading])

  // Track whether History is mid-(re)load. While busy the document temporarily
  // shrinks (loader replaces the list) and the browser clamps scrollTop to 0, so
  // the continuous saver below must NOT persist that transient 0. useLayoutEffect
  // keeps the ref current synchronously, before the clamp's scroll event fires.
  const isBusy = loading || workspaceLoading
  const isBusyRef = useRef(isBusy)
  useLayoutEffect(() => {
    isBusyRef.current = isBusy
  }, [isBusy])

  // Continuously remember the History scroll position so it can be restored no
  // matter HOW the page is left — internal nav, browser back/forward, tab/window
  // switch, or unmount/remount. This is what makes browser-level returns work:
  // the value is always current by the time the page is left, and it is never
  // overwritten with the clamped-to-top value that appears during a reload.
  useEffect(() => {
    let frame = 0

    const saveIfIdle = () => {
      if (!isBusyRef.current) {
        saveHistoryScrollPosition()
      }
    }

    const handleScroll = () => {
      if (frame) {
        return
      }

      frame = window.requestAnimationFrame(() => {
        frame = 0
        saveIfIdle()
      })
    }

    const handleVisibilityChange = () => {
      if (window.document.visibilityState === 'hidden') {
        saveIfIdle()
      }
    }

    window.addEventListener('scroll', handleScroll, { passive: true })
    window.document.addEventListener('visibilitychange', handleVisibilityChange)
    window.addEventListener('pagehide', saveIfIdle)

    return () => {
      if (frame) {
        window.cancelAnimationFrame(frame)
      }

      saveIfIdle()
      window.removeEventListener('scroll', handleScroll)
      window.document.removeEventListener('visibilitychange', handleVisibilityChange)
      window.removeEventListener('pagehide', saveIfIdle)
    }
  }, [])

  // Once data is loaded and the list is rendered, the document is finally tall
  // enough to hold the saved scroll — request one authoritative restore here.
  // Runs on initial mount, browser back/forward remounts, and after every reload.
  useEffect(() => {
    if (loading || workspaceLoading) {
      return
    }

    restoreScrollForPath(historyPath)
  }, [loading, workspaceLoading])

  useEffect(() => {
    setSessionObject(historyExpandedJobsKey, expandedJobs)
  }, [expandedJobs])

  useEffect(() => {
    setSessionObject(historyEmailPrepKey, emailPrepOpenJobs)
  }, [emailPrepOpenJobs])

  const productOptions = useMemo(() => {
    const options = new Map()

    ;[...jobs, ...documents].forEach((item) => {
      if (item.product_id && !options.has(item.product_id)) {
        options.set(item.product_id, item.productLabel)
      }
    })

    return [...options.entries()].map(([id, label]) => ({ id, label }))
  }, [documents, jobs])

  const filteredDocuments = useMemo(() => {
    const search = searchTerm.trim().toLowerCase()

    return documents.filter((document) => {
      const searchText = [
        document.file_name,
        document.productName,
        document.productCode,
        document.templateLabel,
        document.templateFileName,
        document.uploadLabel,
      ]
        .filter(Boolean)
        .join(' ')
        .toLowerCase()

      return (
        (!search || searchText.includes(search)) &&
        (productFilter === 'all' || document.product_id === productFilter) &&
        (statusFilter === 'all' || document.status === statusFilter) &&
        matchesDateFilter(document, dateFilter)
      )
    })
  }, [dateFilter, documents, productFilter, searchTerm, statusFilter])

  const filteredJobs = useMemo(() => {
    const search = searchTerm.trim().toLowerCase()

    return jobs.filter((job) => {
      const searchText = [
        job.productName,
        job.productCode,
        job.templateLabel,
        job.uploadLabel,
        ...job.outputs.map((output) => output.display_name),
      ]
        .filter(Boolean)
        .join(' ')
        .toLowerCase()

      return (
        (!search || searchText.includes(search)) &&
        (productFilter === 'all' || job.product_id === productFilter) &&
        (statusFilter === 'all' || job.status === statusFilter) &&
        matchesDateFilter(job, dateFilter)
      )
    })
  }, [dateFilter, jobs, productFilter, searchTerm, statusFilter])

  const hasActiveFilters = Boolean(searchTerm || productFilter !== 'all' || statusFilter !== 'all' || dateFilter !== 'all')
  const visibleRecords = useMemo(
    () => [
      ...filteredJobs.map((job) => ({ type: 'job', id: job.id, key: `job:${job.id}`, record: job })),
      ...filteredDocuments.map((document) => ({ type: 'document', id: document.id, key: `document:${document.id}`, record: document })),
    ],
    [filteredDocuments, filteredJobs],
  )
  const selectedRecordList = visibleRecords.filter((item) => selectedRecords[item.key])
  const selectedCount = selectedRecordList.length
  const allVisibleSelected = visibleRecords.length > 0 && selectedCount === visibleRecords.length

  function clearFilters() {
    setSearchTerm('')
    setProductFilter('all')
    setStatusFilter('all')
    setDateFilter('all')
  }

  function toggleExpandedJob(jobId) {
    const isExpanded = Boolean(expandedJobs[jobId])

    setExpandedJobs((current) => {
      const next = { ...current, [jobId]: !current[jobId] }

      if (!next[jobId]) {
        delete next[jobId]
      }

      return next
    })

    if (isExpanded) {
      setEmailPrepOpenJobs((current) => {
        const next = { ...current }
        delete next[jobId]
        return next
      })
    }
  }

  function setEmailPrepOpen(jobId, open) {
    setEmailPrepOpenJobs((current) => {
      const next = { ...current }

      if (open) {
        next[jobId] = true
      } else {
        delete next[jobId]
      }

      return next
    })
  }

  function setRecordSelected(key, selected) {
    setSelectedRecords((current) => {
      const next = { ...current }

      if (selected) {
        next[key] = true
      } else {
        delete next[key]
      }

      return next
    })
  }

  function toggleSelectAllVisible(selected) {
    setSelectedRecords((current) => {
      const next = { ...current }

      visibleRecords.forEach((item) => {
        if (selected) {
          next[item.key] = true
        } else {
          delete next[item.key]
        }
      })

      return next
    })
  }

  async function deleteDocumentDirect(document) {
    await deleteGeneratedDocument({
      organizationId: currentOrganizationId,
      documentId: document.id,
      storageBucket: document.storage_bucket,
      storagePath: document.storage_path,
    })
  }

  async function deleteJobDirect(job) {
    await deleteGenerationJob({
      organizationId: currentOrganizationId,
      jobId: job.id,
      outputs: job.outputs || [],
    })
  }

  async function handleDownload(document) {
    setDownloadingId(document.id)
    setDownloadErrors((current) => ({ ...current, [document.id]: '' }))

    try {
      const blob = await downloadGeneratedCertificateDocx(document)
      const url = URL.createObjectURL(blob)
      const link = window.document.createElement('a')

      link.href = url
      link.download = document.file_name || 'generated-document.docx'
      window.document.body.appendChild(link)
      link.click()
      link.remove()
      URL.revokeObjectURL(url)
    } catch (downloadError) {
      setDownloadErrors((current) => ({
        ...current,
        [document.id]: getDownloadError(downloadError),
      }))
    } finally {
      setDownloadingId('')
    }
  }

  async function handleDeleteDocument(document) {
    if (!window.confirm('Delete this generated DOCX file from storage and history?')) {
      return
    }

    const previousScrollY = window.scrollY || 0
    setDeletingId(document.id)
    setDeleteErrors((current) => ({ ...current, [document.id]: '' }))

    try {
      await deleteDocumentDirect(document)
      setRecordSelected(`document:${document.id}`, false)
      await loadHistory()
    } catch (deleteError) {
      setDeleteErrors((current) => ({
        ...current,
        [document.id]: deleteError.message || 'Delete permission is not enabled yet.',
      }))
    } finally {
      setDeletingId('')
      restoreScrollAfterListUpdate(previousScrollY)
    }
  }

  async function handleDeleteOutput(output) {
    if (!window.confirm('Delete this generated output row from storage and history?')) {
      return
    }

    const previousScrollY = window.scrollY || 0
    setDeletingId(output.id)
    setDeleteErrors((current) => ({ ...current, [output.id]: '' }))

    try {
      await deleteGenerationOutput({
        organizationId: currentOrganizationId,
        outputId: output.id,
        storageBucket: output.storage_bucket,
        storagePath: output.storage_path,
      })
      await loadHistory()
    } catch (deleteError) {
      setDeleteErrors((current) => ({
        ...current,
        [output.id]: deleteError.message || 'Delete permission is not enabled yet.',
      }))
    } finally {
      setDeletingId('')
      restoreScrollAfterListUpdate(previousScrollY)
    }
  }

  async function handleDeleteJob(job) {
    if (!window.confirm('Delete this batch record and its generated DOCX files from storage and history?')) {
      return
    }

    const previousScrollY = window.scrollY || 0
    setDeletingId(job.id)
    setDeleteErrors((current) => ({ ...current, [job.id]: '' }))

    try {
      await deleteJobDirect(job)
      setRecordSelected(`job:${job.id}`, false)
      await loadHistory()
      setExpandedJobs((current) => {
        const next = { ...current }
        delete next[job.id]
        return next
      })
      setEmailPrepOpenJobs((current) => {
        const next = { ...current }
        delete next[job.id]
        return next
      })
    } catch (deleteError) {
      setDeleteErrors((current) => ({
        ...current,
        [job.id]: deleteError.message || 'Batch delete permission is not enabled yet.',
      }))
    } finally {
      setDeletingId('')
      restoreScrollAfterListUpdate(previousScrollY)
    }
  }

  async function handleDeleteSelected() {
    if (selectedRecordList.length === 0) {
      return
    }

    if (!window.confirm(`Delete ${selectedRecordList.length} selected history record${selectedRecordList.length === 1 ? '' : 's'} from storage and history?`)) {
      return
    }

    const previousScrollY = window.scrollY || 0
    setDeletingId('bulk')
    setDeleteErrors({})

    try {
      for (const item of selectedRecordList) {
        if (item.type === 'job') {
          await deleteJobDirect(item.record)
        } else {
          await deleteDocumentDirect(item.record)
        }
      }

      setSelectedRecords({})
      setExpandedJobs((current) => {
        const next = { ...current }
        selectedRecordList
          .filter((item) => item.type === 'job')
          .forEach((item) => {
            delete next[item.id]
          })
        return next
      })
      setEmailPrepOpenJobs((current) => {
        const next = { ...current }
        selectedRecordList
          .filter((item) => item.type === 'job')
          .forEach((item) => {
            delete next[item.id]
          })
        return next
      })
      await loadHistory()
    } catch (deleteError) {
      setDeleteErrors((current) => ({
        ...current,
        bulk: deleteError.message || 'Selected records could not be deleted.',
      }))
    } finally {
      setDeletingId('')
      restoreScrollAfterListUpdate(previousScrollY)
    }
  }

  async function handleDownloadBatchZip(job) {
    const outputs = Array.isArray(job.outputs) ? job.outputs : []
    const generatedOutputs = outputs.filter((output) => output.status === 'generated')

    if (generatedOutputs.length === 0) {
      return
    }

    setBatchZipProgress((current) => ({
      ...current,
      [job.id]: {
        preparing: true,
        progressMessage: 'Preparing ZIP...',
        warningMessage: '',
        errorMessage: '',
      },
    }))

    try {
      const productTag = String(job.productCode || '').replace(/[^A-Za-z0-9-]+/g, '-').replace(/^-+|-+$/g, '')
      const fileName = productTag ? `${productTag}-batch-${job.id}.zip` : `batch-${job.id}.zip`
      const { zipBlob, warnings } = await createBatchDocxZip(generatedOutputs, fileName, ({ message }) => {
        setBatchZipProgress((current) => ({
          ...current,
          [job.id]: {
            ...current[job.id],
            progressMessage: message,
          },
        }))
      })

      const url = URL.createObjectURL(zipBlob)
      const link = window.document.createElement('a')
      link.href = url
      link.download = fileName
      window.document.body.appendChild(link)
      link.click()
      link.remove()
      URL.revokeObjectURL(url)

      setBatchZipProgress((current) => ({
        ...current,
        [job.id]: {
          preparing: false,
          progressMessage: 'ZIP ready. Download started.',
          warningMessage: warnings.length ? 'Some files could not be added to ZIP.' : '',
          errorMessage: '',
        },
      }))
    } catch (error) {
      setBatchZipProgress((current) => ({
        ...current,
        [job.id]: {
          preparing: false,
          progressMessage: '',
          warningMessage: '',
          errorMessage: 'Could not prepare ZIP. Please try individual downloads.',
        },
      }))
    }
  }

  const latestDocument = documents[0] || null
  const latestJob = jobs[0] || null

  return (
    <DashboardLayout title="History" eyebrow="Project Atlas MVP" currentView="history" workspaceStatus={source}>
      <div className="px-4 py-6 sm:px-6 lg:px-8">
        <EnvironmentBanner />
        {workspaceError ? (
          <div className="mb-5 flex gap-3 rounded-md border border-amber-200 bg-amber-50 px-4 py-3 text-sm font-medium leading-6 text-amber-800">
            <AlertCircle size={18} className="mt-0.5 shrink-0" aria-hidden="true" />
            <span>{workspaceError}</span>
          </div>
        ) : null}

        <section className="rounded-lg border border-slate-200 bg-white p-4 shadow-sm">
          <div className="grid gap-5 lg:grid-cols-[1fr_auto] lg:items-center">
            <div>
              <p className="text-sm font-semibold text-accentTeal">{currentOrganization?.name || 'Current workspace'}</p>
              <h2 className="mt-1 text-2xl font-semibold text-primary">Generated DOCX history</h2>
              <p className="mt-1 max-w-3xl text-sm leading-6 text-slate-600">Review batches, DOCX outputs, downloads, and deletes.</p>
            </div>
            <div className="grid gap-3 sm:grid-cols-2 lg:min-w-[360px]">
              <div className="rounded-lg border border-slate-200 bg-slate-50 p-3">
                <p className="text-xs font-semibold uppercase tracking-[0.12em] text-slate-400">Total records</p>
                <p className="mt-2 text-2xl font-bold text-primary">{jobs.length + documents.length}</p>
              </div>
              <div className="rounded-lg border border-slate-200 bg-slate-50 p-3">
                <p className="text-xs font-semibold uppercase tracking-[0.12em] text-slate-400">Last generated</p>
                <p className="mt-2 text-sm font-bold text-primary">{latestJob || latestDocument ? formatDate((latestJob || latestDocument).created_at) : 'No records yet'}</p>
              </div>
            </div>
          </div>
        </section>

        <section className="mt-4 rounded-lg border border-slate-200 bg-white p-3 shadow-sm">
          <div className="grid gap-4 xl:grid-cols-[1.2fr_0.8fr_0.7fr_0.7fr_auto] xl:items-end">
            <label className="grid gap-2">
              <span className="text-xs font-semibold uppercase tracking-[0.12em] text-slate-400">Search</span>
              <span className="flex min-h-11 items-center gap-2 rounded-md border border-slate-200 bg-white px-3 transition focus-within:border-accentBlue focus-within:ring-2 focus-within:ring-blue-100">
                <Search size={17} className="text-slate-400" aria-hidden="true" />
                <input
                  value={searchTerm}
                  onChange={(event) => setSearchTerm(event.target.value)}
                  placeholder="Search file, product, template, upload"
                  className="min-w-0 flex-1 bg-transparent text-sm font-semibold text-primary outline-none placeholder:text-slate-400"
                />
              </span>
            </label>
            <FilterSelect label="Product" value={productFilter} onChange={setProductFilter}>
              <option value="all">All products</option>
              {productOptions.map((option) => (
                <option key={option.id} value={option.id}>
                  {option.label}
                </option>
              ))}
            </FilterSelect>
            <FilterSelect label="Status" value={statusFilter} onChange={setStatusFilter}>
              {statusOptions.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </FilterSelect>
            <FilterSelect label="Date" value={dateFilter} onChange={setDateFilter}>
              {dateOptions.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </FilterSelect>
            <button
              type="button"
              onClick={clearFilters}
              disabled={!hasActiveFilters}
              className="focus-ring inline-flex min-h-11 items-center justify-center gap-2 rounded-md border border-slate-200 bg-white px-4 text-sm font-bold text-primary transition hover:border-accentBlue hover:text-accentBlue disabled:cursor-not-allowed disabled:opacity-50"
            >
              <X size={17} aria-hidden="true" />
              Clear
            </button>
          </div>
        </section>

        {metadataWarning ? (
          <div className="mt-5 flex gap-3 rounded-md border border-amber-200 bg-amber-50 px-4 py-3 text-sm font-medium leading-6 text-amber-800">
            <AlertCircle size={18} className="mt-0.5 shrink-0" aria-hidden="true" />
            <span>{metadataWarning}</span>
          </div>
        ) : null}

        {loading || workspaceLoading ? (
          <section className="mt-5 rounded-lg border border-slate-200 bg-white p-8 shadow-sm">
            <div className="mx-auto flex max-w-sm flex-col items-center justify-center text-center">
              <Loader2 size={24} className="animate-spin text-accentBlue" aria-hidden="true" />
              <p className="mt-3 text-sm font-bold text-primary">Loading generated document history</p>
              <p className="mt-1 text-sm text-slate-500">Fetching batches, DOCX outputs, and saved history metadata.</p>
            </div>
          </section>
        ) : error ? (
          <section className="mt-5 rounded-lg border border-red-200 bg-red-50 p-6">
            <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
              <div className="flex gap-3 text-sm font-semibold leading-6 text-red-700">
                <AlertCircle size={19} className="mt-0.5 shrink-0" aria-hidden="true" />
                <span>{error}</span>
              </div>
              <button type="button" onClick={loadHistory} className="focus-ring inline-flex min-h-9 items-center justify-center gap-2 rounded-md bg-accentTeal px-3 text-sm font-bold text-white transition hover:bg-teal-800">
                <RefreshCw size={16} aria-hidden="true" />
                Retry
              </button>
            </div>
          </section>
        ) : filteredJobs.length === 0 && filteredDocuments.length === 0 ? (
          <div className="mt-5">
            <EmptyState filtered={(documents.length > 0 || jobs.length > 0) && hasActiveFilters} onClear={clearFilters} />
          </div>
        ) : (
          <section className="mt-5">
            <div className="mb-3 flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
              <div className="flex items-center gap-2 text-sm font-semibold text-slate-600">
                <CalendarDays size={17} className="text-accentBlue" aria-hidden="true" />
                {filteredJobs.length + filteredDocuments.length} of {jobs.length + documents.length} records shown
              </div>
              <div className="flex flex-wrap items-center gap-2">
                {hasActiveFilters ? (
                  <span className="inline-flex w-fit rounded-md border border-blue-200 bg-blue-50 px-2.5 py-1 text-xs font-semibold uppercase tracking-[0.08em] text-blue-700">
                    Filtered view
                  </span>
                ) : null}
                <label className="inline-flex min-h-9 items-center gap-2 rounded-md border border-slate-200 bg-white px-3 text-xs font-bold text-primary">
                  <input
                    type="checkbox"
                    checked={allVisibleSelected}
                    onChange={(event) => toggleSelectAllVisible(event.target.checked)}
                    className="h-4 w-4 rounded border-slate-300 text-primary focus:ring-primary"
                  />
                  Select all visible
                </label>
                <button
                  type="button"
                  onClick={handleDeleteSelected}
                  disabled={selectedCount === 0 || deletingId === 'bulk'}
                  className="focus-ring inline-flex min-h-9 items-center justify-center rounded-md border border-red-200 bg-white px-3 text-xs font-bold text-red-700 transition hover:bg-red-50 disabled:cursor-not-allowed disabled:opacity-50"
                >
                  {deletingId === 'bulk' ? 'Deleting...' : `Delete selected (${selectedCount})`}
                </button>
              </div>
            </div>
            {deleteErrors.bulk ? (
              <p className="mb-3 rounded-md border border-red-200 bg-red-50 px-3 py-2 text-sm font-semibold text-red-700">{deleteErrors.bulk}</p>
            ) : null}

            {filteredJobs.length > 0 ? (
              <div className="mb-4 grid gap-2">
                {filteredJobs.map((job) => (
                  <BatchJobCard
                    key={job.id}
                    job={job}
                    expanded={Boolean(expandedJobs[job.id])}
                    selected={Boolean(selectedRecords[`job:${job.id}`])}
                    onSelect={(selected) => setRecordSelected(`job:${job.id}`, selected)}
                    onToggle={toggleExpandedJob}
                    emailPrepOpen={Boolean(emailPrepOpenJobs[job.id])}
                    onEmailPrepToggle={setEmailPrepOpen}
                    onDownload={handleDownload}
                    onDownloadZip={handleDownloadBatchZip}
                    batchZipState={batchZipProgress}
                    onDeleteJob={handleDeleteJob}
                    onDeleteOutput={handleDeleteOutput}
                    deletingId={deletingId}
                    downloadingId={downloadingId}
                    downloadErrors={downloadErrors}
                    deleteErrors={deleteErrors}
                  />
                ))}
              </div>
            ) : null}

            {filteredDocuments.length > 0 ? (
              <>
                <div className="hidden overflow-hidden rounded-lg border border-slate-200 bg-white shadow-sm md:block">
                  <div className="overflow-x-auto">
                    <table className="min-w-[780px] w-full text-left">
                      <thead className="border-b border-slate-200 bg-slate-50 text-xs font-bold uppercase tracking-[0.1em] text-slate-500">
                        <tr>
                          <th className="px-3 py-2">Select</th>
                          <th className="px-3 py-2">File</th>
                          <th className="px-3 py-2">Product</th>
                          <th className="px-3 py-2">Generated</th>
                          <th className="px-3 py-2">Status</th>
                          <th className="px-3 py-2 text-right">Action</th>
                        </tr>
                      </thead>
                      <tbody>
                        {filteredDocuments.map((document) => (
                          <HistoryRow
                            key={document.id}
                            document={document}
                            selected={Boolean(selectedRecords[`document:${document.id}`])}
                            onSelect={(selected) => setRecordSelected(`document:${document.id}`, selected)}
                            downloading={downloadingId === document.id}
                            deletingId={deletingId}
                            downloadError={downloadErrors[document.id]}
                            deleteError={deleteErrors[document.id]}
                            onDownload={handleDownload}
                            onDelete={handleDeleteDocument}
                          />
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>

                <div className="grid gap-2 md:hidden">
                  {filteredDocuments.map((document) => (
                    <HistoryCard
                      key={document.id}
                      document={document}
                      selected={Boolean(selectedRecords[`document:${document.id}`])}
                      onSelect={(selected) => setRecordSelected(`document:${document.id}`, selected)}
                      downloading={downloadingId === document.id}
                      deletingId={deletingId}
                      downloadError={downloadErrors[document.id]}
                      deleteError={deleteErrors[document.id]}
                      onDownload={handleDownload}
                      onDelete={handleDeleteDocument}
                    />
                  ))}
                </div>
              </>
            ) : null}
          </section>
        )}
      </div>
    </DashboardLayout>
  )
}
