import { useEffect, useMemo, useState } from 'react'
import { AlertCircle, CalendarDays, Download, FileClock, FileText, Loader2, RefreshCw, Search, X } from 'lucide-react'
import DashboardLayout from '../components/dashboard/DashboardLayout.jsx'
import EnvironmentBanner from '../components/dashboard/EnvironmentBanner.jsx'
import { useWorkspace } from '../hooks/useWorkspace.js'
import { downloadGeneratedCertificateDocx } from '../features/certificate/services/certificateOutputsService.js'
import { getGeneratedDocumentsHistory } from '../services/generatedDocumentsService.js'
import { getDownloadError, getFriendlyError } from '../utils/errorMessages.js'
import { navigateTo } from '../utils/routes.js'

const statusOptions = [
  { value: 'all', label: 'All statuses' },
  { value: 'ready', label: 'Ready' },
  { value: 'failed', label: 'Failed' },
]

const dateOptions = [
  { value: 'all', label: 'All dates' },
  { value: 'today', label: 'Today' },
  { value: '7', label: 'Last 7 days' },
  { value: '30', label: 'Last 30 days' },
]

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
    <span className={`inline-flex min-h-7 items-center rounded-md px-2.5 text-xs font-bold uppercase tracking-[0.08em] ${ready ? 'bg-emerald-50 text-emerald-700' : 'bg-amber-50 text-amber-700'}`}>
      {ready ? 'Ready' : 'Failed'}
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
    <section className="rounded-lg border border-slate-200 bg-white p-8 shadow-sm">
      <div className="mx-auto flex max-w-xl flex-col items-center text-center">
        <span className="flex h-12 w-12 items-center justify-center rounded-md bg-blue-50 text-accentBlue">
          <FileClock size={24} aria-hidden="true" />
        </span>
        <h2 className="mt-5 text-2xl font-semibold text-primary">{filtered ? 'No matching documents' : 'No generated documents yet'}</h2>
        <p className="mt-3 leading-7 text-slate-600">
          {filtered ? 'Adjust the search or filters to see more generated DOCX records.' : 'Generate a DOCX from AR-CERT-PRO and it will appear here.'}
        </p>
        {filtered ? (
          <button type="button" onClick={onClear} className="focus-ring mt-5 inline-flex min-h-11 items-center gap-2 rounded-md bg-primary px-4 text-sm font-bold text-white">
            <X size={17} aria-hidden="true" />
            Clear filters
          </button>
        ) : (
          <button type="button" onClick={() => navigateTo('/dashboard/products/ar-cert-pro/workspace')} className="focus-ring mt-5 inline-flex min-h-11 items-center gap-2 rounded-md bg-primary px-4 text-sm font-bold text-white">
            <FileText size={17} aria-hidden="true" />
            Open AR-CERT-PRO workspace
          </button>
        )}
      </div>
    </section>
  )
}

function HistoryRow({ document, downloading, downloadError, onDownload }) {
  const rowError = typeof downloadError === 'string' ? downloadError : downloadError?.message
  const technicalDetail = typeof downloadError === 'string' ? '' : downloadError?.technicalDetail

  return (
    <tr className="border-t border-slate-100 align-top">
      <td className="px-4 py-4">
        <p className="max-w-[260px] truncate text-sm font-bold text-primary">{document.file_name}</p>
        <p className="mt-1 text-xs font-semibold text-slate-500">DOCX · {formatFileSize(document.file_size)}</p>
        {rowError ? <p className="mt-2 text-xs font-semibold text-red-600">{rowError}</p> : null}
        {technicalDetail ? <p className="mt-1 text-xs font-medium text-red-500">Detail: {technicalDetail}</p> : null}
      </td>
      <td className="px-4 py-4">
        <p className="text-sm font-semibold text-primary">{document.productName}</p>
        <p className="mt-1 text-xs font-semibold text-slate-500">{document.productCode || 'No product code'}</p>
      </td>
      <td className="px-4 py-4">
        <p className="max-w-[220px] truncate text-sm font-semibold text-primary">{document.templateLabel}</p>
        <p className="mt-1 max-w-[220px] truncate text-xs font-semibold text-slate-500">{document.templateFileName || 'Template file unavailable'}</p>
      </td>
      <td className="px-4 py-4">
        <p className="max-w-[220px] truncate text-sm font-semibold text-primary">{document.uploadLabel}</p>
        <p className="mt-1 text-xs font-semibold text-slate-500">{document.uploadRowCount === null ? 'Rows unavailable' : `${document.uploadRowCount} rows`}</p>
      </td>
      <td className="px-4 py-4 text-sm font-semibold text-slate-600">{document.preview_row_index ?? 'None'}</td>
      <td className="px-4 py-4">
        <StatusBadge status={document.status} />
      </td>
      <td className="px-4 py-4 text-sm font-semibold text-slate-600">{formatDate(document.created_at)}</td>
      <td className="px-4 py-4 text-right">
        <button
          type="button"
          onClick={() => onDownload(document)}
          disabled={downloading}
          className="focus-ring inline-flex min-h-10 items-center gap-2 rounded-md border border-slate-200 bg-white px-3 text-sm font-bold text-primary transition hover:border-accentBlue hover:text-accentBlue disabled:cursor-not-allowed disabled:opacity-60"
        >
          {downloading ? <Loader2 size={16} className="animate-spin" aria-hidden="true" /> : <Download size={16} aria-hidden="true" />}
          Download
        </button>
      </td>
    </tr>
  )
}

function HistoryCard({ document, downloading, downloadError, onDownload }) {
  const rowError = typeof downloadError === 'string' ? downloadError : downloadError?.message
  const technicalDetail = typeof downloadError === 'string' ? '' : downloadError?.technicalDetail

  return (
    <article className="rounded-lg border border-slate-200 bg-white p-4 shadow-sm">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="truncate text-sm font-bold text-primary">{document.file_name}</p>
          <p className="mt-1 text-xs font-semibold text-slate-500">DOCX · {formatFileSize(document.file_size)}</p>
        </div>
        <StatusBadge status={document.status} />
      </div>
      <dl className="mt-4 grid gap-3 text-sm">
        <div>
          <dt className="text-xs font-semibold uppercase tracking-[0.12em] text-slate-400">Product</dt>
          <dd className="mt-1 font-semibold text-primary">{document.productLabel}</dd>
        </div>
        <div>
          <dt className="text-xs font-semibold uppercase tracking-[0.12em] text-slate-400">Template</dt>
          <dd className="mt-1 font-semibold text-primary">{document.templateLabel}</dd>
        </div>
        <div>
          <dt className="text-xs font-semibold uppercase tracking-[0.12em] text-slate-400">Upload</dt>
          <dd className="mt-1 font-semibold text-primary">{document.uploadLabel}</dd>
          <dd className="mt-1 text-xs font-semibold text-slate-500">{document.uploadRowCount === null ? 'Rows unavailable' : `${document.uploadRowCount} rows`}</dd>
        </div>
        <div className="grid grid-cols-2 gap-3">
          <div>
            <dt className="text-xs font-semibold uppercase tracking-[0.12em] text-slate-400">Preview row</dt>
            <dd className="mt-1 font-semibold text-primary">{document.preview_row_index ?? 'None'}</dd>
          </div>
          <div>
            <dt className="text-xs font-semibold uppercase tracking-[0.12em] text-slate-400">Generated</dt>
            <dd className="mt-1 font-semibold text-primary">{formatDate(document.created_at)}</dd>
          </div>
        </div>
      </dl>
      {rowError ? <p className="mt-3 text-xs font-semibold text-red-600">{rowError}</p> : null}
      {technicalDetail ? <p className="mt-1 text-xs font-medium text-red-500">Detail: {technicalDetail}</p> : null}
      <button
        type="button"
        onClick={() => onDownload(document)}
        disabled={downloading}
        className="focus-ring mt-4 inline-flex min-h-10 w-full items-center justify-center gap-2 rounded-md border border-slate-200 bg-white px-3 text-sm font-bold text-primary transition hover:border-accentBlue hover:text-accentBlue disabled:cursor-not-allowed disabled:opacity-60"
      >
        {downloading ? <Loader2 size={16} className="animate-spin" aria-hidden="true" /> : <Download size={16} aria-hidden="true" />}
        Download DOCX
      </button>
    </article>
  )
}

export default function HistoryPage() {
  const { currentOrganization, currentOrganizationId, loading: workspaceLoading, error: workspaceError, source } = useWorkspace()
  const [documents, setDocuments] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [metadataWarning, setMetadataWarning] = useState('')
  const [searchTerm, setSearchTerm] = useState('')
  const [productFilter, setProductFilter] = useState('all')
  const [statusFilter, setStatusFilter] = useState('all')
  const [dateFilter, setDateFilter] = useState('all')
  const [downloadingId, setDownloadingId] = useState('')
  const [downloadErrors, setDownloadErrors] = useState({})

  async function loadHistory() {
    if (workspaceLoading) {
      return
    }

    setLoading(true)
    setError('')
    setMetadataWarning('')

    try {
      const result = await getGeneratedDocumentsHistory(currentOrganizationId)
      setDocuments(result.documents)
      setMetadataWarning(result.metadataWarning)
    } catch (loadError) {
      setDocuments([])
      setError(getFriendlyError(loadError, 'Generated document history could not be loaded. Check the workspace connection and try again.'))
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadHistory()
  }, [currentOrganizationId, workspaceLoading])

  const productOptions = useMemo(() => {
    const options = new Map()

    documents.forEach((document) => {
      if (document.product_id && !options.has(document.product_id)) {
        options.set(document.product_id, document.productLabel)
      }
    })

    return [...options.entries()].map(([id, label]) => ({ id, label }))
  }, [documents])

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

  const hasActiveFilters = Boolean(searchTerm || productFilter !== 'all' || statusFilter !== 'all' || dateFilter !== 'all')

  function clearFilters() {
    setSearchTerm('')
    setProductFilter('all')
    setStatusFilter('all')
    setDateFilter('all')
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

  const latestDocument = documents[0] || null

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

        <section className="rounded-lg border border-slate-200 bg-white p-6 shadow-sm">
          <div className="grid gap-5 lg:grid-cols-[1fr_auto] lg:items-center">
            <div>
              <p className="text-sm font-semibold text-accentTeal">{currentOrganization?.name || 'Current workspace'}</p>
              <h2 className="mt-2 text-2xl font-semibold text-primary">Stored DOCX outputs</h2>
              <p className="mt-2 max-w-3xl leading-7 text-slate-600">Review the latest single-document generations and download the privately stored DOCX again.</p>
            </div>
            <div className="grid gap-3 sm:grid-cols-2 lg:min-w-[360px]">
              <div className="rounded-md border border-slate-200 bg-lightBg p-4">
                <p className="text-xs font-semibold uppercase tracking-[0.12em] text-slate-400">DOCX records</p>
                <p className="mt-2 text-2xl font-bold text-primary">{documents.length}</p>
              </div>
              <div className="rounded-md border border-slate-200 bg-lightBg p-4">
                <p className="text-xs font-semibold uppercase tracking-[0.12em] text-slate-400">Latest</p>
                <p className="mt-2 text-sm font-bold text-primary">{latestDocument ? formatDate(latestDocument.created_at) : 'None yet'}</p>
              </div>
            </div>
          </div>
        </section>

        <section className="mt-5 rounded-lg border border-slate-200 bg-white p-4 shadow-sm">
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
            <div className="flex items-center justify-center gap-3 text-sm font-bold text-slate-600">
              <Loader2 size={20} className="animate-spin text-accentBlue" aria-hidden="true" />
              Loading generated document history
            </div>
          </section>
        ) : error ? (
          <section className="mt-5 rounded-lg border border-red-200 bg-red-50 p-6">
            <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
              <div className="flex gap-3 text-sm font-semibold leading-6 text-red-700">
                <AlertCircle size={19} className="mt-0.5 shrink-0" aria-hidden="true" />
                <span>{error}</span>
              </div>
              <button type="button" onClick={loadHistory} className="focus-ring inline-flex min-h-10 items-center justify-center gap-2 rounded-md bg-primary px-4 text-sm font-bold text-white">
                <RefreshCw size={16} aria-hidden="true" />
                Retry
              </button>
            </div>
          </section>
        ) : filteredDocuments.length === 0 ? (
          <div className="mt-5">
            <EmptyState filtered={documents.length > 0 && hasActiveFilters} onClear={clearFilters} />
          </div>
        ) : (
          <section className="mt-5">
            <div className="mb-3 flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
              <div className="flex items-center gap-2 text-sm font-semibold text-slate-600">
                <CalendarDays size={17} className="text-accentBlue" aria-hidden="true" />
                {filteredDocuments.length} of {documents.length} records shown
              </div>
            </div>

            <div className="hidden overflow-hidden rounded-lg border border-slate-200 bg-white shadow-sm md:block">
              <div className="overflow-x-auto">
                <table className="min-w-[1120px] w-full text-left">
                  <thead className="bg-lightBg text-xs font-bold uppercase tracking-[0.1em] text-slate-500">
                    <tr>
                      <th className="px-4 py-3">File</th>
                      <th className="px-4 py-3">Product</th>
                      <th className="px-4 py-3">Template</th>
                      <th className="px-4 py-3">Upload</th>
                      <th className="px-4 py-3">Preview row</th>
                      <th className="px-4 py-3">Status</th>
                      <th className="px-4 py-3">Generated</th>
                      <th className="px-4 py-3 text-right">Action</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredDocuments.map((document) => (
                      <HistoryRow
                        key={document.id}
                        document={document}
                        downloading={downloadingId === document.id}
                        downloadError={downloadErrors[document.id]}
                        onDownload={handleDownload}
                      />
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            <div className="grid gap-4 md:hidden">
              {filteredDocuments.map((document) => (
                <HistoryCard
                  key={document.id}
                  document={document}
                  downloading={downloadingId === document.id}
                  downloadError={downloadErrors[document.id]}
                  onDownload={handleDownload}
                />
              ))}
            </div>
          </section>
        )}
      </div>
    </DashboardLayout>
  )
}
