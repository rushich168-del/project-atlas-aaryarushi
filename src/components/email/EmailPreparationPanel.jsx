import { useEffect, useMemo, useState } from 'react'
import { Copy, Download, Mail, Save } from 'lucide-react'
import { prepareEmailPayloadPreview, validateEmailRecipient } from '../../services/emailDeliveryService'
import { getEmailDeliveryDryRunErrorMessage, listEmailDeliveryDryRunJobsForGeneration, prepareBatchEmailDryRun } from '../../services/emailDeliveryDryRunService'
import { useAuth } from '../../context/AuthContext.jsx'

function normalizeKey(key) {
  return String(key || '')
    .trim()
    .replace(/\s+/g, ' ')
    .toLowerCase()
}

function createTemplateContext(row = {}) {
  const context = {}

  Object.keys(row).forEach((rawKey) => {
    const value = String(row[rawKey] ?? '')
    const normalizedKey = normalizeKey(rawKey)
    context[rawKey] = value
    context[normalizedKey] = value
    context[normalizedKey.replace(/\s+/g, '')] = value
  })

  if (row.Email && !context.email) {
    context.email = String(row.Email)
  }

  if (row.Name && !context.name) {
    context.name = String(row.Name)
  }

  return context
}

function renderTemplate(template, row = {}) {
  const context = createTemplateContext(row)

  return String(template || '').replace(/{{\s*([^}]+?)\s*}}/g, (_, rawKey) => {
    const key = normalizeKey(rawKey)
    return context[rawKey] ?? context[key] ?? context[key.replace(/\s+/g, '')] ?? ''
  })
}

function resolveRecipient(row = {}, selectedColumn) {
  const normalized = normalizeKey(selectedColumn)
  const context = createTemplateContext(row)
  return context[selectedColumn] || context[normalized] || context.email || ''
}

function copyText(text, setFeedback) {
  if (!text) {
    setFeedback('Nothing to copy.')
    return
  }

  if (navigator.clipboard && navigator.clipboard.writeText) {
    navigator.clipboard
      .writeText(text)
      .then(() => setFeedback('Copied to clipboard.'))
      .catch(() => setFeedback('Copy failed.'))
  } else {
    const textarea = document.createElement('textarea')
    textarea.value = text
    textarea.style.position = 'fixed'
    textarea.style.left = '-9999px'
    document.body.appendChild(textarea)
    textarea.focus()
    textarea.select()
    try {
      document.execCommand('copy')
      setFeedback('Copied to clipboard.')
    } catch {
      setFeedback('Copy failed.')
    } finally {
      textarea.remove()
    }
  }
}

export default function EmailPreparationPanel({
  rows = [],
  outputs = [],
  columns = [],
  onDownload,
  title = 'Email Delivery',
  helperText = 'Use this to quickly prepare personalized email messages for generated documents.',
  statusText = 'Manual Prep / Auto Send Coming Soon',
  showBatchTable = true,
  generationJobId = null,
}) {
  const [recipientColumn, setRecipientColumn] = useState('Email')
  const [subjectTemplate, setSubjectTemplate] = useState('Your certificate is ready - {{Name}}')
  const [messageTemplate, setMessageTemplate] = useState(
    'Dear {{Name}},\nYour certificate has been generated successfully.\nPlease find the document attached or download it from your workspace.\n\nRegards,\nAaryaRushi Automation Labs',
  )
  const [selectedOutputId, setSelectedOutputId] = useState(outputs[0]?.id || null)
  const [feedback, setFeedback] = useState('')
  const [savingDryRun, setSavingDryRun] = useState(false)
  const [savedDryRunSummary, setSavedDryRunSummary] = useState(null)
  const [savedDryRunError, setSavedDryRunError] = useState('')
  const { session } = useAuth()

  const availableColumns = useMemo(() => {
    const normalized = new Set(['Email', 'Name', 'Course', 'Date'])
    const result = []

    ;['Email', 'Name', 'Course', 'Date', ...columns].forEach((column) => {
      if (!column) {
        return
      }

      if (!result.includes(column)) {
        result.push(column)
      }
    })

    return result
  }, [columns])

  const emailRows = useMemo(() => {
    const generatedOutputs = outputs.length > 0 ? outputs.filter((output) => output.status === 'generated') : []
    const rowsByIndex = (rows || []).reduce((map, row, index) => {
      map[index + 1] = row
      return map
    }, {})

    const defaultRows = generatedOutputs.length === 0 && rows.length > 0
      ? rows.map((row, index) => ({
          output: { id: `row-${index + 1}`, row_index: index + 1, display_name: row.Name || `Row ${index + 1}`, status: 'generated' },
          row,
        }))
      : generatedOutputs.map((output) => ({
          output,
          row: rowsByIndex[output.row_index] || {},
        }))

    return defaultRows
  }, [outputs, rows])

  useEffect(() => {
    if (!selectedOutputId && emailRows.length > 0) {
      setSelectedOutputId(emailRows[0].output.id)
    }
  }, [emailRows, selectedOutputId])

  useEffect(() => {
    let active = true

    async function loadExistingDryRunRecords() {
      if (!generationJobId || !session?.user?.id) {
        return
      }

      try {
        const jobs = await listEmailDeliveryDryRunJobsForGeneration(generationJobId)

        if (!active) {
          return
        }

        const latestJob = jobs.find((job) => job.mode === 'dry_run') || jobs[0] || null

        if (latestJob) {
          setSavedDryRunSummary({
            preparedCount: latestJob.prepared_count ?? latestJob.total_recipients ?? 0,
            mode: latestJob.mode || 'dry_run',
            createdAt: latestJob.created_at,
          })
          setSavedDryRunError('')
        } else {
          setSavedDryRunSummary(null)
          setSavedDryRunError('')
        }
      } catch (error) {
        if (!active) {
          return
        }

        const message = getEmailDeliveryDryRunErrorMessage(error)
        const fallback = message.includes('does not exist') || message.includes('relation') || message.includes('table')
          ? 'Email prep saving requires email delivery tables to be enabled.'
          : message
        setSavedDryRunSummary(null)
        setSavedDryRunError(fallback)
      }
    }

    loadExistingDryRunRecords()

    return () => {
      active = false
    }
  }, [generationJobId, session?.user?.id])

  const selectedRow = emailRows.find((item) => item.output.id === selectedOutputId) || emailRows[0] || null
  const previewSubject = renderTemplate(subjectTemplate, selectedRow?.row)
  const previewMessage = renderTemplate(messageTemplate, selectedRow?.row)
  const previewRecipient = resolveRecipient(selectedRow?.row, recipientColumn)
  const previewPayload = useMemo(
    () => prepareEmailPayloadPreview({ recipient: previewRecipient, subject: previewSubject, message: previewMessage }),
    [previewRecipient, previewSubject, previewMessage],
  )
  const recipientIsValid = validateEmailRecipient(previewRecipient)

  async function handleSaveDryRun() {
    if (!session?.user?.id) {
      setFeedback('Sign in to save email preparation.')
      return
    }

    setSavingDryRun(true)
    setFeedback('')
    setSavedDryRunError('')

    try {
      const previews = emailRows.map((item) => ({
        generation_output_id: item.output?.id || null,
        row_number: item.output?.row_index ?? null,
        recipient_email: resolveRecipient(item.row, recipientColumn),
        subject: renderTemplate(subjectTemplate, item.row),
        message: renderTemplate(messageTemplate, item.row),
      }))

      const result = await prepareBatchEmailDryRun({
        organizationId: null,
        userId: session.user.id,
        generationJobId,
        previews,
      })

      setSavedDryRunSummary({
        preparedCount: result?.outputs?.length || previews.length,
        mode: 'dry_run',
        createdAt: new Date().toISOString(),
      })
      setFeedback('Email preparation saved. No emails were sent.')
    } catch (error) {
      const message = getEmailDeliveryDryRunErrorMessage(error)
      const fallback = message.includes('does not exist') || message.includes('relation') || message.includes('table')
        ? 'Email prep saving requires the email delivery tables to be enabled.'
        : message
      setSavedDryRunSummary(null)
      setFeedback(fallback)
    } finally {
      setSavingDryRun(false)
    }
  }

  return (
    <section className="mt-5 rounded-lg border border-slate-200 bg-white p-5 shadow-sm">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h4 className="text-sm font-semibold text-primary">{title}</h4>
          <p className="mt-1 text-xs font-medium text-slate-500">{helperText}</p>
          <p className="mt-1 text-xs font-semibold text-amber-700">Status: {statusText}</p>
        </div>
        <div className="rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold text-slate-700">Manual prep only</div>
      </div>

      <div className="mt-5 grid gap-4 lg:grid-cols-[1.1fr_1fr]">
        <label className="grid gap-2">
          <span className="text-xs font-semibold uppercase tracking-[0.12em] text-slate-400">Recipient email column</span>
          <select
            value={recipientColumn}
            onChange={(event) => setRecipientColumn(event.target.value)}
            className="min-h-11 rounded-md border border-slate-200 bg-white px-3 text-sm font-semibold text-primary outline-none transition focus:border-accentBlue focus:ring-2 focus:ring-blue-100"
          >
            <option value="Email">Email</option>
            {availableColumns.map((column) => (
              <option key={column} value={column}>{column}</option>
            ))}
          </select>
        </label>
        <label className="grid gap-2">
          <span className="text-xs font-semibold uppercase tracking-[0.12em] text-slate-400">Preview row</span>
          <select
            value={selectedRow?.output.id || ''}
            onChange={(event) => setSelectedOutputId(event.target.value)}
            className="min-h-11 rounded-md border border-slate-200 bg-white px-3 text-sm font-semibold text-primary outline-none transition focus:border-accentBlue focus:ring-2 focus:ring-blue-100"
          >
            {emailRows.map((item) => (
              <option key={item.output.id} value={item.output.id}>
                Row {item.output.row_index} • {item.output.display_name}
              </option>
            ))}
          </select>
        </label>
      </div>

      <div className="mt-4 grid gap-4">
        <label className="grid gap-2">
          <span className="text-xs font-semibold uppercase tracking-[0.12em] text-slate-400">Subject template</span>
          <input
            value={subjectTemplate}
            onChange={(event) => setSubjectTemplate(event.target.value)}
            className="min-h-11 rounded-md border border-slate-200 bg-white px-3 text-sm font-semibold text-primary outline-none transition focus:border-accentBlue focus:ring-2 focus:ring-blue-100"
          />
        </label>
        <label className="grid gap-2">
          <span className="text-xs font-semibold uppercase tracking-[0.12em] text-slate-400">Message template</span>
          <textarea
            value={messageTemplate}
            onChange={(event) => setMessageTemplate(event.target.value)}
            rows={6}
            className="min-h-[160px] rounded-md border border-slate-200 bg-white px-3 py-2 text-sm font-semibold text-primary outline-none transition focus:border-accentBlue focus:ring-2 focus:ring-blue-100"
          />
        </label>
      </div>

      <div className="mt-4 flex flex-wrap items-center gap-3">
        <button
          type="button"
          onClick={() => setFeedback(selectedRow ? `Preview generated for row ${selectedRow.output.row_index}.` : 'No row selected.')}
          className="focus-ring inline-flex min-h-10 items-center justify-center gap-2 rounded-md border border-slate-200 bg-white px-4 text-sm font-semibold text-primary transition hover:border-accentBlue hover:text-accentBlue"
        >
          <Mail size={16} aria-hidden="true" />
          Preview Email
        </button>
        <button
          type="button"
          onClick={() => copyText(previewRecipient, setFeedback)}
          disabled={!previewRecipient}
          className="focus-ring inline-flex min-h-10 items-center justify-center gap-2 rounded-md bg-primary px-4 text-sm font-semibold text-white transition hover:bg-slate-800 disabled:opacity-60"
        >
          <Copy size={16} aria-hidden="true" />
          Copy Recipient
        </button>
        <button
          type="button"
          onClick={() => copyText(previewMessage, setFeedback)}
          disabled={!previewMessage}
          className="focus-ring inline-flex min-h-10 items-center justify-center gap-2 rounded-md border border-slate-200 bg-white px-4 text-sm font-semibold text-primary transition hover:border-accentBlue hover:text-accentBlue disabled:opacity-60"
        >
          <Copy size={16} aria-hidden="true" />
          Copy Message
        </button>
        <button
          type="button"
          onClick={handleSaveDryRun}
          disabled={savingDryRun}
          className="focus-ring inline-flex min-h-10 items-center justify-center gap-2 rounded-md bg-emerald-700 px-4 text-sm font-semibold text-white transition hover:bg-emerald-800 disabled:opacity-60"
        >
          <Save size={16} aria-hidden="true" />
          {savingDryRun ? 'Saving...' : 'Save Email Prep'}
        </button>
        <button
          type="button"
          disabled
          className="focus-ring inline-flex min-h-10 items-center justify-center gap-2 rounded-md border border-slate-200 bg-slate-100 px-4 text-sm font-semibold text-slate-500"
          title="Real sending will be enabled later through a secure server-side email function."
        >
          Auto Send Coming Soon
        </button>
      </div>

      {feedback ? <p className="mt-3 text-sm font-medium text-slate-600">{feedback}</p> : null}
      {savedDryRunSummary ? (
        <div className="mt-3 rounded-lg border border-emerald-200 bg-emerald-50 p-4">
          <div className="flex flex-wrap items-center gap-2">
            <span className="rounded-full bg-emerald-700 px-2.5 py-1 text-[11px] font-semibold uppercase tracking-[0.12em] text-white">Dry Run</span>
            <span className="text-sm font-semibold text-emerald-800">Prepared recipients: {savedDryRunSummary.preparedCount}</span>
          </div>
          <p className="mt-2 text-sm text-emerald-800">Saved {savedDryRunSummary.createdAt ? new Date(savedDryRunSummary.createdAt).toLocaleString() : 'recently'}.</p>
        </div>
      ) : null}
      {savedDryRunError ? <p className="mt-3 text-sm font-semibold text-amber-700">{savedDryRunError}</p> : null}

      <div className="mt-4 rounded-lg border border-amber-200 bg-amber-50 p-4">
        <p className="text-xs font-semibold uppercase tracking-[0.12em] text-amber-700">Future Auto Send Architecture Ready</p>
        <p className="mt-2 text-sm text-amber-800">
          Automatic sending will use a secure server-side email function. Manual prep is available now.
        </p>
      </div>

      <div className="mt-5 rounded-lg border border-slate-200 bg-slate-50 p-4">
        <p className="text-xs uppercase tracking-[0.12em] text-slate-400">Email preview</p>
        <div className="mt-2 text-sm text-slate-700">
          <p className="font-semibold">Recipient</p>
          <p className="mt-1 whitespace-pre-wrap">{previewRecipient || 'Recipient email not available'}</p>
          <p className="mt-3 font-semibold">Subject</p>
          <p className="mt-1 whitespace-pre-wrap">{previewSubject || 'Subject preview will appear here.'}</p>
          <p className="mt-3 font-semibold">Message</p>
          <p className="mt-1 whitespace-pre-wrap">{previewMessage || 'Message preview will appear here.'}</p>
          <p className="mt-3 font-semibold">Safe preview payload</p>
          <p className="mt-1 whitespace-pre-wrap text-xs text-slate-500">
            Recipient valid: {recipientIsValid ? 'Yes' : 'No'}
          </p>
          <pre className="mt-2 overflow-x-auto rounded-md bg-slate-900 p-3 text-xs text-slate-100">
            {JSON.stringify(previewPayload, null, 2)}
          </pre>
        </div>
      </div>

      {showBatchTable && emailRows.length > 0 ? (
        <div className="mt-5 overflow-x-auto rounded-3xl border border-slate-200 bg-white p-3">
          <table className="min-w-full text-left text-sm text-slate-600">
            <thead className="border-b border-slate-200 bg-lightBg text-xs uppercase tracking-[0.12em] text-slate-500">
              <tr>
                <th className="px-3 py-3">Row</th>
                <th className="px-3 py-3">Recipient</th>
                <th className="px-3 py-3">Subject</th>
                <th className="px-3 py-3">Message</th>
                <th className="px-3 py-3 text-right">Actions</th>
              </tr>
            </thead>
            <tbody>
              {emailRows.map((item) => {
                const recipient = resolveRecipient(item.row, recipientColumn)
                const subject = renderTemplate(subjectTemplate, item.row)
                const message = renderTemplate(messageTemplate, item.row)

                return (
                  <tr key={item.output.id} className="border-b border-slate-100 align-top">
                    <td className="px-3 py-3 font-semibold text-primary">{item.output.row_index}</td>
                    <td className="px-3 py-3 break-all">{recipient || 'Missing email'}</td>
                    <td className="px-3 py-3 break-all">{subject}</td>
                    <td className="px-3 py-3 break-all text-xs leading-6">{message}</td>
                    <td className="px-3 py-3 text-right">
                      <div className="grid gap-2 sm:grid-cols-2">
                        <button
                          type="button"
                          onClick={() => {
                            setSelectedOutputId(item.output.id)
                            copyText(recipient, setFeedback)
                          }}
                          disabled={!recipient}
                          className="focus-ring inline-flex min-h-9 items-center justify-center gap-2 rounded-md border border-slate-200 bg-white px-3 text-xs font-semibold text-primary transition hover:border-accentBlue hover:text-accentBlue disabled:opacity-60"
                        >
                          Copy recipient
                        </button>
                        <button
                          type="button"
                          onClick={() => {
                            setSelectedOutputId(item.output.id)
                            copyText(message, setFeedback)
                          }}
                          className="focus-ring inline-flex min-h-9 items-center justify-center gap-2 rounded-md border border-slate-200 bg-white px-3 text-xs font-semibold text-primary transition hover:border-accentBlue hover:text-accentBlue"
                        >
                          Copy message
                        </button>
                        {onDownload ? (
                          <button
                            type="button"
                            onClick={() => onDownload(item.output)}
                            className="focus-ring inline-flex min-h-9 items-center justify-center gap-2 rounded-md bg-emerald-700 px-3 text-xs font-semibold text-white transition hover:bg-emerald-800"
                          >
                            <Download size={14} aria-hidden="true" />
                            Download
                          </button>
                        ) : null}
                      </div>
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      ) : null}
    </section>
  )
}
