import { useEffect, useMemo, useState } from 'react'
import { Copy, Download, Mail, Save, ShieldCheck } from 'lucide-react'
import { prepareEmailPayloadPreview, validateEmailRecipient } from '../../services/emailDeliveryService'
import {
  checkEmailDeliveryDryRunWithEdgeFunction,
  checkEmailDeliverySendGridResendFailedGate,
  checkEmailDeliverySendGridControlledBatchGate,
  getEmailDeliveryControlledBatchErrorMessage,
  getEmailDeliveryDryRunErrorMessage,
  getEmailDeliveryOwnerTestErrorMessage,
  getEmailDeliveryResendFailedErrorMessage,
  getEmailDeliverySandboxErrorMessage,
  listEmailDeliveryOutputs,
  listEmailDeliveryDryRunJobsForGeneration,
  prepareBatchEmailDryRun,
  sendEmailDeliverySendGridOwnerTest,
  validateEmailDeliverySendGridSandbox,
} from '../../services/emailDeliveryDryRunService'
import { useAuth } from '../../context/AuthContext.jsx'

function normalizeKey(key) {
  return String(key || '')
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '')
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

function getOutputRowData(output) {
  const rawRowData = output?.row_data ?? output?.rowData ?? null

  if (!rawRowData) {
    return {}
  }

  if (typeof rawRowData === 'string') {
    try {
      const parsed = JSON.parse(rawRowData)
      return parsed && typeof parsed === 'object' && !Array.isArray(parsed) ? parsed : {}
    } catch {
      return {}
    }
  }

  return typeof rawRowData === 'object' && !Array.isArray(rawRowData) ? rawRowData : {}
}

function resolveRecipient(row = {}, selectedColumn) {
  if (!selectedColumn) {
    return ''
  }

  const directValue = row?.[selectedColumn]
  if (directValue != null && directValue !== '') {
    return String(directValue)
  }

  const normalizedSelected = normalizeKey(selectedColumn)
  const candidateKeys = new Set([normalizedSelected])

  if (normalizedSelected === 'emailaddress') {
    candidateKeys.add('email')
  }

  if (normalizedSelected === 'email') {
    candidateKeys.add('emailaddress')
  }

  if (normalizedSelected.endsWith('address')) {
    candidateKeys.add(normalizedSelected.replace(/address$/, ''))
  }

  for (const [key, value] of Object.entries(row || {})) {
    if (candidateKeys.has(normalizeKey(key)) && value != null && value !== '') {
      return String(value)
    }
  }

  const context = createTemplateContext(row)
  return context[selectedColumn] || context[normalizedSelected] || context.email || ''
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

function getEmailPanelStorageKey(generationJobId, panelName) {
  return `project-atlas:history-email:${generationJobId || 'unsaved'}:${panelName}`
}

function getStoredEmailPanelOpen(generationJobId, panelName) {
  try {
    return window.sessionStorage.getItem(getEmailPanelStorageKey(generationJobId, panelName)) === 'open'
  } catch {
    return false
  }
}

function setStoredEmailPanelOpen(generationJobId, panelName, open) {
  try {
    window.sessionStorage.setItem(getEmailPanelStorageKey(generationJobId, panelName), open ? 'open' : 'closed')
  } catch {
    // UI-only session state is best effort.
  }
}

function getSandboxErrorSummary(summary) {
  const firstError = summary?.firstError || (summary?.rowResults || []).find((result) => result?.errorMessage)

  if (!firstError?.errorMessage) {
    return ''
  }

  if (firstError.errorCode === 'missing_sendgrid_secret') {
    return firstError.errorMessage
  }

  if (String(firstError.status || '').includes('sandbox_failed')) {
    return `SendGrid rejected request: ${firstError.errorMessage}`
  }

  return firstError.errorMessage
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
  const [checkingReadiness, setCheckingReadiness] = useState(false)
  const [savedDryRunSummary, setSavedDryRunSummary] = useState(null)
  const [savedDryRunError, setSavedDryRunError] = useState('')
  const [savedEmailDeliveryOutputs, setSavedEmailDeliveryOutputs] = useState([])
  const [edgeFunctionSummary, setEdgeFunctionSummary] = useState(null)
  const [validatingSandbox, setValidatingSandbox] = useState(false)
  const [sandboxSummary, setSandboxSummary] = useState(null)
  const [sendingOwnerTest, setSendingOwnerTest] = useState(false)
  const [ownerTestSummary, setOwnerTestSummary] = useState(null)
  const [controlledBatchPhrase, setControlledBatchPhrase] = useState('')
  const [checkingControlledBatch, setCheckingControlledBatch] = useState(false)
  const [controlledBatchSummary, setControlledBatchSummary] = useState(null)
  const [resendFailedPhrase, setResendFailedPhrase] = useState('')
  const [checkingResendFailed, setCheckingResendFailed] = useState(false)
  const [resendFailedSummary, setResendFailedSummary] = useState(null)
  const [emailPreviewOpen, setEmailPreviewOpen] = useState(() => getStoredEmailPanelOpen(generationJobId, 'preview'))
  const [preparedRowsOpen, setPreparedRowsOpen] = useState(() => getStoredEmailPanelOpen(generationJobId, 'prepared-rows'))
  const { session } = useAuth()

  const availableColumns = useMemo(() => {
    const result = []

    ;['Email', 'Name', 'Course', 'Date', ...columns].forEach((column) => {
      if (!column) {
        return
      }

      if (!result.some((existing) => normalizeKey(existing) === normalizeKey(column))) {
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
      : generatedOutputs.map((output) => {
          const rowData = getOutputRowData(output)
          const sourceRow = rowsByIndex[output.row_index] || {}

          if (import.meta.env.DEV) {
            console.debug('[Project Atlas] email prep row_data', {
              outputId: output.id,
              rowIndex: output.row_index,
              keys: Object.keys(rowData),
              email: rowData.Email || rowData.email || '',
            })
          }

          return {
            output,
            row: { ...sourceRow, ...rowData },
          }
        })

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
          const latestOutputs = await listEmailDeliveryOutputs(latestJob.id).catch(() => [])

          if (!active) {
            return
          }

          setSavedDryRunSummary({
            jobId: latestJob.id || null,
            preparedCount: latestJob.prepared_count ?? latestJob.total_recipients ?? 0,
            mode: latestJob.mode || 'dry_run',
            createdAt: latestJob.created_at,
          })
          setSavedEmailDeliveryOutputs(latestOutputs)
          setSavedDryRunError('')
        } else {
          setSavedDryRunSummary(null)
          setSavedEmailDeliveryOutputs([])
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
        setSavedEmailDeliveryOutputs([])
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
      const validRecipientCount = previews.filter((preview) => validateEmailRecipient(preview.recipient_email)).length

      const result = await prepareBatchEmailDryRun({
        organizationId: null,
        userId: session.user.id,
        generationJobId,
        previews,
      })

      setSavedDryRunSummary({
        jobId: result?.job?.id || null,
        preparedCount: result?.job?.prepared_count ?? validRecipientCount,
        mode: 'dry_run',
        createdAt: new Date().toISOString(),
      })
      setSavedEmailDeliveryOutputs(result?.job?.id ? await listEmailDeliveryOutputs(result.job.id).catch(() => []) : [])
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

  async function handleCheckSendReadiness() {
    if (!savedDryRunSummary?.jobId) {
      setEdgeFunctionSummary(null)
      setFeedback('Save Email Prep first to check send readiness.')
      return
    }

    setCheckingReadiness(true)
    setFeedback('')

    try {
      const result = await checkEmailDeliveryDryRunWithEdgeFunction(savedDryRunSummary.jobId)
      const latestOutputs = await listEmailDeliveryOutputs(savedDryRunSummary.jobId).catch(() => [])
      setEdgeFunctionSummary(result)
      setSavedEmailDeliveryOutputs(latestOutputs)
      setSandboxSummary(null)
      setOwnerTestSummary(null)
      setControlledBatchSummary(null)
      setResendFailedSummary(null)
      setFeedback(result?.message || 'Dry-run checked successfully. No emails were sent.')
    } catch (error) {
      const message = getEmailDeliveryDryRunErrorMessage(error)
      const canUseSavedDryRunFallback = savedDryRunSummary?.preparedCount > 0 && /failed to send|not deployed|function|network|fetch/i.test(message)

      if (canUseSavedDryRunFallback) {
        const savedOutputs = await listEmailDeliveryOutputs(savedDryRunSummary.jobId).catch(() => [])
        const validSavedRecipients = savedOutputs.filter((output) => validateEmailRecipient(output.recipient_email)).length || savedDryRunSummary.preparedCount
        const fallbackSummary = {
          ok: true,
          mode: 'dry_run',
          message: 'Dry-run readiness checked from saved email prep. No emails were sent.',
          emailDeliveryJobId: savedDryRunSummary.jobId,
          totalRecipients: savedOutputs.length || savedDryRunSummary.preparedCount,
          preparedCount: validSavedRecipients,
          sendReady: validSavedRecipients > 0,
          fallback: true,
        }

        setEdgeFunctionSummary(fallbackSummary)
        setSavedEmailDeliveryOutputs(savedOutputs)
        setSandboxSummary(null)
        setOwnerTestSummary(null)
        setControlledBatchSummary(null)
        setResendFailedSummary(null)
        setFeedback(fallbackSummary.message)
        return
      }

      const fallback = message.includes('not deployed') || message.includes('function') || message.includes('network') || message.includes('fetch')
        ? 'Send readiness check is not deployed yet. Email prep is saved, and no emails were sent.'
        : message
      setEdgeFunctionSummary(null)
      setSandboxSummary(null)
      setOwnerTestSummary(null)
      setControlledBatchSummary(null)
      setResendFailedSummary(null)
      setFeedback(fallback)
    } finally {
      setCheckingReadiness(false)
    }
  }

  async function handleValidateSandboxSend() {
    if (!edgeFunctionSummary?.sendReady || !savedDryRunSummary?.jobId || !generationJobId) {
      setFeedback('Check Send Readiness first. No real emails were delivered.')
      return
    }

    setValidatingSandbox(true)
    setFeedback('')

    try {
      const result = await validateEmailDeliverySendGridSandbox(savedDryRunSummary.jobId)
      const latestOutputs = await listEmailDeliveryOutputs(savedDryRunSummary.jobId).catch(() => [])
      setSandboxSummary(result)
      setSavedEmailDeliveryOutputs(latestOutputs)
      setOwnerTestSummary(null)
      setControlledBatchSummary(null)
      setResendFailedSummary(null)
      setFeedback(result?.message || 'SendGrid sandbox validation finished. No real emails were delivered.')
    } catch (error) {
      setSandboxSummary(null)
      setFeedback(getEmailDeliverySandboxErrorMessage(error))
    } finally {
      setValidatingSandbox(false)
    }
  }

  const sandboxValidationAvailable = Boolean(edgeFunctionSummary?.sendReady && generationJobId)
  const preparedRecipientCount = Number(
    sandboxSummary?.preparedRecipients
    ?? edgeFunctionSummary?.preparedCount
    ?? savedDryRunSummary?.preparedCount
    ?? savedEmailDeliveryOutputs.length
    ?? 0,
  )
  const sandboxValidatedCount = Number(
    sandboxSummary?.sandboxValidated
    ?? savedEmailDeliveryOutputs.filter((output) => output.status === 'sandbox_validated').length
    ?? 0,
  )
  const sandboxFailedCount = Number(
    sandboxSummary?.sandboxFailed
    ?? savedEmailDeliveryOutputs.filter((output) => output.status === 'sandbox_failed').length
    ?? 0,
  )
  const sandboxBlockedCount = Number(
    sandboxSummary?.blocked
    ?? savedEmailDeliveryOutputs.filter((output) => output.status === 'blocked').length
    ?? 0,
  )
  const sandboxAllPreparedRowsValidated = preparedRecipientCount > 0
    && sandboxValidatedCount === preparedRecipientCount
    && sandboxFailedCount === 0
    && sandboxBlockedCount === 0
  const ownerTestSent = ownerTestSummary?.status === 'owner_test_sent'
    || savedEmailDeliveryOutputs.some((output) => output.owner_test_status === 'owner_test_sent')
  const ownerTestAvailable = Boolean(
    savedDryRunSummary?.jobId
    && sandboxAllPreparedRowsValidated
    && !ownerTestSent,
  )

  function openEmailPreview() {
    setEmailPreviewOpen(true)
    setPreparedRowsOpen(false)
    setStoredEmailPanelOpen(generationJobId, 'preview', true)
    setStoredEmailPanelOpen(generationJobId, 'prepared-rows', false)
  }

  function openPreparedRows() {
    setPreparedRowsOpen(true)
    setEmailPreviewOpen(false)
    setStoredEmailPanelOpen(generationJobId, 'prepared-rows', true)
    setStoredEmailPanelOpen(generationJobId, 'preview', false)
  }

  function closeEmailOverlay() {
    setEmailPreviewOpen(false)
    setPreparedRowsOpen(false)
    setStoredEmailPanelOpen(generationJobId, 'preview', false)
    setStoredEmailPanelOpen(generationJobId, 'prepared-rows', false)
  }

  async function handleSendOwnerTestEmail() {
    if (!ownerTestAvailable) {
      setFeedback('Validate Sandbox Send first. No owner test email was sent.')
      return
    }

    const confirmed = window.confirm('Send 1 real test email to the configured owner/test email?')

    if (!confirmed) {
      setFeedback('Owner test email cancelled. No owner test email was sent.')
      return
    }

    setSendingOwnerTest(true)
    setFeedback('')

    try {
      const result = await sendEmailDeliverySendGridOwnerTest(savedDryRunSummary.jobId)
      const latestOutputs = await listEmailDeliveryOutputs(savedDryRunSummary.jobId).catch(() => [])
      setOwnerTestSummary(result)
      setSavedEmailDeliveryOutputs(latestOutputs)
      setControlledBatchSummary(null)
      setResendFailedSummary(null)
      setFeedback(result?.message || result?.errorMessage || 'Owner test email finished.')
    } catch (error) {
      setOwnerTestSummary(null)
      setFeedback(getEmailDeliveryOwnerTestErrorMessage(error))
    } finally {
      setSendingOwnerTest(false)
    }
  }

  const controlledBatchGateAvailable = Boolean(
    edgeFunctionSummary?.sendReady
    && sandboxAllPreparedRowsValidated
    && ownerTestSent,
  )
  const failedBatchRowsCount = savedEmailDeliveryOutputs.filter((output) => output.batch_send_status === 'batch_failed').length
  const emailPrepOutputsLoaded = Boolean(savedDryRunSummary?.jobId && savedEmailDeliveryOutputs.length > 0)
  const failedRowResendGateAvailable = emailPrepOutputsLoaded

  async function handleCheckControlledBatchGate() {
    if (!controlledBatchGateAvailable || !savedDryRunSummary?.jobId) {
      setFeedback('Complete readiness, sandbox validation, and owner test first. No row-recipient emails were sent.')
      return
    }

    const normalizedPhrase = controlledBatchPhrase.trim()

    if (normalizedPhrase === 'SEND 5 TEST EMAILS') {
      const confirmed = window.confirm(`This will send real emails to ${preparedRecipientCount} row recipients. Continue?`)

      if (!confirmed) {
        setFeedback('Controlled batch send cancelled. No row-recipient emails were sent.')
        return
      }
    }

    setCheckingControlledBatch(true)
    setFeedback('')

    try {
      const result = await checkEmailDeliverySendGridControlledBatchGate({
        emailDeliveryJobId: savedDryRunSummary.jobId,
        confirmationPhrase: controlledBatchPhrase,
      })
      const latestOutputs = await listEmailDeliveryOutputs(savedDryRunSummary.jobId).catch(() => [])
      setControlledBatchSummary(result)
      setSavedEmailDeliveryOutputs(latestOutputs)
      setResendFailedSummary(null)
      setFeedback(result?.firstErrorMessage || result?.message || 'Controlled batch gate checked. No row-recipient emails were sent.')
    } catch (error) {
      setControlledBatchSummary(null)
      setFeedback(getEmailDeliveryControlledBatchErrorMessage(error))
    } finally {
      setCheckingControlledBatch(false)
    }
  }

  async function handleCheckResendFailedGate() {
    if (!failedRowResendGateAvailable || !savedDryRunSummary?.jobId) {
      setFeedback('Save Email Prep first. No row-recipient emails were sent.')
      return
    }

    setCheckingResendFailed(true)
    setFeedback('')

    try {
      const result = await checkEmailDeliverySendGridResendFailedGate({
        emailDeliveryJobId: savedDryRunSummary.jobId,
        confirmationPhrase: resendFailedPhrase,
      })
      const latestOutputs = await listEmailDeliveryOutputs(savedDryRunSummary.jobId).catch(() => [])
      setResendFailedSummary(result)
      setSavedEmailDeliveryOutputs(latestOutputs)
      setFeedback(result?.firstErrorMessage || result?.message || 'Failed row resend gate checked. No row-recipient emails were sent.')
    } catch (error) {
      setResendFailedSummary(null)
      setFeedback(getEmailDeliveryResendFailedErrorMessage(error))
    } finally {
      setCheckingResendFailed(false)
    }
  }

  return (
    <section className="mt-3 rounded-lg border border-slate-200 bg-white p-3 shadow-sm">
      <div className="flex flex-wrap items-start justify-between gap-2">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.08em] text-slate-400">Email delivery</p>
          <h4 className="mt-0.5 text-base font-semibold text-primary">{title}</h4>
          <p className="mt-0.5 text-xs leading-5 text-slate-600">{helperText}</p>
        </div>
        <div className="flex flex-wrap gap-2">
          <span className="rounded-md border border-amber-200 bg-amber-50 px-2 py-1 text-xs font-semibold text-amber-800">{statusText}</span>
          <span className="rounded-md border border-slate-200 bg-slate-50 px-2 py-1 text-xs font-semibold uppercase tracking-[0.08em] text-slate-600">Manual prep</span>
        </div>
      </div>

      <div className="mt-3 grid gap-2 text-xs text-slate-700 sm:grid-cols-2 lg:grid-cols-4">
        <p className="rounded-md border border-slate-200 bg-slate-50 px-2 py-1.5"><span className="font-semibold">Provider:</span> SendGrid</p>
        <p className="rounded-md border border-blue-100 bg-blue-50 px-2 py-1.5"><span className="font-semibold">Sandbox:</span> Safe test</p>
        <p className="rounded-md border border-emerald-100 bg-emerald-50 px-2 py-1.5"><span className="font-semibold">Owner test:</span> Available after checks</p>
        <p className="rounded-md border border-amber-100 bg-amber-50 px-2 py-1.5"><span className="font-semibold">Real batch:</span> Locked</p>
      </div>

      <details className="mt-2 rounded-lg border border-slate-200 bg-white p-2.5">
        <summary className="cursor-pointer text-xs font-semibold uppercase tracking-[0.08em] text-slate-500">Safety lock status</summary>
        <div className="mt-2 grid gap-1.5 text-xs text-slate-700 sm:grid-cols-2 lg:grid-cols-4">
          <p><span className="font-semibold">Provider:</span> SendGrid</p>
          <p><span className="font-semibold">Sandbox validation:</span> Available</p>
          <p><span className="font-semibold">Owner test send:</span> Available</p>
          <p><span className="font-semibold">Controlled batch send:</span> Locked by backend safety flag</p>
          <p><span className="font-semibold">Failed row resend:</span> Locked by backend safety flag</p>
          <p><span className="font-semibold">ZIP email attachment:</span> Disabled</p>
          <p><span className="font-semibold">PDF email attachment:</span> Disabled</p>
          <p><span className="font-semibold">Gmail/Outlook OAuth:</span> Not enabled</p>
          <p className="sm:col-span-2 lg:col-span-4"><span className="font-semibold">Secrets:</span> Stored in Supabase Edge Function secrets</p>
        </div>
      </details>

      <div className="mt-3 grid gap-3 lg:grid-cols-[1.1fr_1fr]">
        <label className="grid gap-1.5">
          <span className="text-xs font-semibold uppercase tracking-[0.12em] text-slate-400">Recipient email column</span>
          <select
            value={recipientColumn}
            onChange={(event) => setRecipientColumn(event.target.value)}
            className="min-h-9 rounded-md border border-slate-200 bg-white px-2.5 text-sm font-semibold text-primary outline-none transition focus:border-accentBlue focus:ring-2 focus:ring-blue-100"
          >
            {availableColumns.map((column) => (
              <option key={column} value={column}>{column}</option>
            ))}
          </select>
        </label>
        <label className="grid gap-1.5">
          <span className="text-xs font-semibold uppercase tracking-[0.12em] text-slate-400">Preview row</span>
          <select
            value={selectedRow?.output.id || ''}
            onChange={(event) => setSelectedOutputId(event.target.value)}
            className="min-h-9 rounded-md border border-slate-200 bg-white px-2.5 text-sm font-semibold text-primary outline-none transition focus:border-accentBlue focus:ring-2 focus:ring-blue-100"
          >
            {emailRows.map((item) => (
              <option key={item.output.id} value={item.output.id}>
                Row {item.output.row_index} - {item.output.display_name}
              </option>
            ))}
          </select>
        </label>
      </div>

      <div className="mt-3 grid gap-3">
        <label className="grid gap-1.5">
          <span className="text-xs font-semibold uppercase tracking-[0.12em] text-slate-400">Subject template</span>
          <input
            value={subjectTemplate}
            onChange={(event) => setSubjectTemplate(event.target.value)}
            className="min-h-9 rounded-md border border-slate-200 bg-white px-2.5 text-sm font-semibold text-primary outline-none transition focus:border-accentBlue focus:ring-2 focus:ring-blue-100"
          />
        </label>
        <label className="grid gap-1.5">
          <span className="text-xs font-semibold uppercase tracking-[0.12em] text-slate-400">Message template</span>
          <textarea
            value={messageTemplate}
            onChange={(event) => setMessageTemplate(event.target.value)}
            rows={3}
            className="min-h-[96px] rounded-md border border-slate-200 bg-white px-2.5 py-2 text-sm font-semibold text-primary outline-none transition focus:border-accentBlue focus:ring-2 focus:ring-blue-100"
          />
        </label>
      </div>

      <div className="mt-3 flex flex-wrap items-center gap-2">
        <button
          type="button"
          onClick={() => setFeedback(selectedRow ? `Preview generated for row ${selectedRow.output.row_index}.` : 'No row selected.')}
          className="focus-ring inline-flex min-h-9 items-center justify-center gap-1.5 rounded-md border border-slate-200 bg-white px-3 text-xs font-semibold text-primary transition hover:border-accentBlue hover:text-accentBlue"
        >
          <Mail size={16} aria-hidden="true" />
          Preview Email
        </button>
        <button
          type="button"
          onClick={() => copyText(previewRecipient, setFeedback)}
          disabled={!previewRecipient}
          className="focus-ring inline-flex min-h-9 items-center justify-center gap-1.5 rounded-md bg-accentTeal px-3 text-xs font-semibold text-white transition hover:bg-teal-800 disabled:cursor-not-allowed disabled:bg-slate-100 disabled:text-slate-400 disabled:opacity-60"
        >
          <Copy size={16} aria-hidden="true" />
          Copy Recipient
        </button>
        <button
          type="button"
          onClick={() => copyText(previewMessage, setFeedback)}
          disabled={!previewMessage}
          className="focus-ring inline-flex min-h-9 items-center justify-center gap-1.5 rounded-md border border-slate-200 bg-white px-3 text-xs font-semibold text-primary transition hover:border-accentBlue hover:text-accentBlue disabled:opacity-60"
        >
          <Copy size={16} aria-hidden="true" />
          Copy Message
        </button>
        <button
          type="button"
          onClick={handleSaveDryRun}
          disabled={savingDryRun}
          className="focus-ring inline-flex min-h-9 items-center justify-center gap-1.5 rounded-md bg-accentTeal px-3 text-xs font-semibold text-white transition hover:bg-teal-800 disabled:cursor-not-allowed disabled:bg-slate-100 disabled:text-slate-400 disabled:opacity-60"
        >
          <Save size={16} aria-hidden="true" />
          {savingDryRun ? 'Saving...' : 'Save Email Prep'}
        </button>
        {savedDryRunSummary?.jobId ? (
          <button
            type="button"
            onClick={handleCheckSendReadiness}
            disabled={checkingReadiness}
            className="focus-ring inline-flex min-h-9 items-center justify-center gap-1.5 rounded-md bg-accentTeal px-3 text-xs font-semibold text-white transition hover:bg-teal-800 disabled:cursor-not-allowed disabled:bg-slate-100 disabled:text-slate-400 disabled:opacity-60"
          >
            <ShieldCheck size={16} aria-hidden="true" />
            {checkingReadiness ? 'Checking...' : 'Check Send Readiness'}
          </button>
        ) : null}
        {sandboxValidationAvailable ? (
          <button
            type="button"
            onClick={handleValidateSandboxSend}
            disabled={validatingSandbox}
            className="focus-ring inline-flex min-h-9 items-center justify-center gap-1.5 rounded-md bg-accentTeal px-3 text-xs font-semibold text-white transition hover:bg-teal-800 disabled:cursor-not-allowed disabled:bg-slate-100 disabled:text-slate-400 disabled:opacity-60"
          >
            <ShieldCheck size={16} aria-hidden="true" />
            {validatingSandbox ? 'Validating...' : 'Validate Sandbox Send'}
          </button>
        ) : null}
        {ownerTestAvailable ? (
          <button
            type="button"
            onClick={handleSendOwnerTestEmail}
            disabled={sendingOwnerTest}
            className="focus-ring inline-flex min-h-9 items-center justify-center gap-1.5 rounded-md bg-accentTeal px-3 text-xs font-semibold text-white transition hover:bg-teal-800 disabled:cursor-not-allowed disabled:bg-slate-100 disabled:text-slate-400 disabled:opacity-60"
          >
            <Mail size={16} aria-hidden="true" />
            {sendingOwnerTest ? 'Sending...' : 'Send Owner Test Email'}
          </button>
        ) : null}
        <button
          type="button"
          disabled
          className="focus-ring inline-flex min-h-9 items-center justify-center gap-1.5 rounded-md border border-slate-200 bg-slate-100 px-3 text-xs font-semibold text-slate-500"
          title="Real sending will be enabled later through a secure server-side email function."
        >
          Auto Send Coming Soon
        </button>
      </div>

      {feedback ? <p className="mt-2 text-xs font-medium text-slate-600">{feedback}</p> : null}
      {savedDryRunSummary ? (
        <div className="mt-2 rounded-md border border-emerald-200 bg-emerald-50 px-3 py-2">
          <div className="flex flex-wrap items-center gap-2">
            <span className="rounded-full bg-emerald-700 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-[0.12em] text-white">Dry Run</span>
            <span className="text-xs font-semibold text-emerald-800">Prepared recipients: {savedDryRunSummary.preparedCount}</span>
            <span className="text-xs text-emerald-800">Saved {savedDryRunSummary.createdAt ? new Date(savedDryRunSummary.createdAt).toLocaleString() : 'recently'}.</span>
          </div>
        </div>
      ) : null}
      {savedDryRunError ? <p className="mt-2 text-xs font-semibold text-amber-700">{savedDryRunError}</p> : null}
      {edgeFunctionSummary ? (
        <div className="mt-2 rounded-md border border-slate-200 bg-slate-50 px-3 py-2">
          <p className="text-xs font-semibold uppercase tracking-[0.08em] text-slate-400">Readiness check result</p>
          <p className="mt-1 text-xs font-semibold text-slate-700">{edgeFunctionSummary.message || 'This batch is ready for safe email checks. No emails were sent.'}</p>
          <div className="mt-1 flex flex-wrap items-center gap-2 text-xs text-slate-600">
            <span>Mode: {edgeFunctionSummary.mode || 'dry_run'}</span>
            <span>Recipients: {edgeFunctionSummary.totalRecipients ?? 0}</span>
            <span>Prepared: {edgeFunctionSummary.preparedCount ?? 0}</span>
            <span>Ready: {edgeFunctionSummary.sendReady ? 'yes' : 'no'}</span>
            <span>No emails were sent</span>
          </div>
        </div>
      ) : null}
      {sandboxValidationAvailable ? (
        <p className="mt-2 rounded-md border border-amber-200 bg-amber-50 px-2.5 py-1.5 text-xs font-semibold text-amber-800">
          Sandbox validation checks SendGrid safely. No real emails will be delivered.
        </p>
      ) : null}
      {ownerTestAvailable ? (
        <p className="mt-2 rounded-md border border-emerald-200 bg-emerald-50 px-2.5 py-1.5 text-xs font-semibold text-emerald-800">
          This sends one real email only to the configured owner/test email. It will not send to row recipients.
        </p>
      ) : null}
      {sandboxSummary ? (
        <div className="mt-2 rounded-md border border-blue-100 bg-blue-50 p-3">
          <p className="text-xs font-semibold uppercase tracking-[0.08em] text-blue-700">Sandbox validation result</p>
          <p className="mt-1 text-xs font-semibold text-slate-700">{sandboxSummary.message || 'Sandbox validation finished. No real emails were delivered.'}</p>
          {getSandboxErrorSummary(sandboxSummary) ? (
            <p className="mt-2 rounded-md border border-amber-200 bg-amber-50 px-2.5 py-1.5 text-xs font-semibold text-amber-800">
              {getSandboxErrorSummary(sandboxSummary)}
            </p>
          ) : null}
          <div className="mt-2 flex flex-wrap items-center gap-2 text-xs text-slate-700">
            <p><span className="font-semibold">Prepared recipients:</span> {sandboxSummary.preparedRecipients ?? 0}</p>
            <p><span className="font-semibold">Sandbox validated:</span> {sandboxSummary.sandboxValidated ?? 0}</p>
            <p><span className="font-semibold">Sandbox failed:</span> {sandboxSummary.sandboxFailed ?? 0}</p>
            <p><span className="font-semibold">Blocked:</span> {sandboxSummary.blocked ?? 0}</p>
          </div>
          {Array.isArray(sandboxSummary.rowResults) && sandboxSummary.rowResults.some((result) => result?.errorMessage) ? (
            <details className="mt-2 rounded-md border border-blue-100 bg-white p-2">
              <summary className="cursor-pointer text-xs font-semibold uppercase tracking-[0.12em] text-slate-400">Row error details</summary>
              <div className="mt-2 grid gap-2 text-xs text-slate-600">
                {sandboxSummary.rowResults
                  .filter((result) => result?.errorMessage)
                  .slice(0, 5)
                  .map((result) => (
                    <p key={result.rowId || `${result.rowNumber}-${result.errorCode}`}>
                      Row {result.rowNumber || '-'}: <span className="font-semibold">{result.errorCode || 'sandbox_error'}</span> - {result.errorMessage}
                    </p>
                  ))}
              </div>
            </details>
          ) : null}
          <p className="mt-1 text-xs font-semibold text-blue-800">Real emails delivered: {sandboxSummary.realEmailsDelivered ?? 0}</p>
        </div>
      ) : null}
      {ownerTestSummary ? (
        <div className="mt-2 rounded-md border border-emerald-200 bg-emerald-50 p-3">
          <p className="text-xs font-semibold uppercase tracking-[0.08em] text-emerald-700">Owner/test email result</p>
          <div className="mt-2 grid gap-1.5 text-xs text-slate-700 sm:grid-cols-2">
            <p><span className="font-semibold">Owner test email target:</span> {ownerTestSummary.ownerTestEmailTarget || 'Not available'}</p>
            <p><span className="font-semibold">Original row recipient preview:</span> {ownerTestSummary.originalRowRecipientPreview || 'Not available'}</p>
            <p><span className="font-semibold">Attachment filename:</span> {ownerTestSummary.attachmentFileName || 'Not available'}</p>
            <p><span className="font-semibold">Status:</span> {String(ownerTestSummary.status || '').replace('owner_test_', '') || 'unknown'}</p>
          </div>
          {ownerTestSummary.errorMessage ? (
            <p className="mt-2 rounded-md border border-amber-200 bg-amber-50 px-2.5 py-1.5 text-xs font-semibold text-amber-800">
              {ownerTestSummary.errorMessage}
            </p>
          ) : null}
        </div>
      ) : null}

      {controlledBatchGateAvailable ? (
        <div className="mt-3 rounded-md border border-slate-200 bg-slate-50 p-3">
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.08em] text-slate-500">Controlled Batch Send</p>
              <p className="mt-1 text-xs font-semibold text-slate-700">
                Real batch sending is locked for safety. This gate check is blocked unless the backend safety flag is enabled.
              </p>
              <p className="mt-1 text-xs font-semibold text-red-700">
                If unlocked by the backend flag, this can deliver to row recipients.
              </p>
              <div className="mt-2 flex flex-wrap items-center gap-2 text-xs text-slate-600">
                <p><span className="font-semibold">Provider:</span> SendGrid</p>
                <p><span className="font-semibold">Mode:</span> Controlled real batch</p>
                <p><span className="font-semibold">Limit:</span> Max 5 recipients</p>
                <p><span className="font-semibold">Attachment:</span> DOCX only</p>
              </div>
            </div>
            <div className="grid w-full gap-2 sm:w-auto sm:min-w-[260px]">
              <label className="grid gap-1.5">
                <span className="text-xs font-semibold uppercase tracking-[0.12em] text-slate-400">Confirmation phrase</span>
                <input
                  value={controlledBatchPhrase}
                  onChange={(event) => setControlledBatchPhrase(event.target.value)}
                  placeholder="SEND 5 TEST EMAILS"
                  className="min-h-9 rounded-md border border-slate-200 bg-white px-2.5 text-xs font-semibold text-primary outline-none transition focus:border-accentBlue focus:ring-2 focus:ring-blue-100"
                />
              </label>
              <button
                type="button"
                onClick={handleCheckControlledBatchGate}
                disabled={checkingControlledBatch}
                className="focus-ring inline-flex min-h-9 items-center justify-center gap-1.5 rounded-md border border-slate-200 bg-white px-3 text-xs font-semibold text-primary transition hover:border-accentBlue hover:text-accentBlue disabled:opacity-60"
                title="Checks the backend safety gate. Default configuration blocks row-recipient delivery."
              >
                <ShieldCheck size={16} aria-hidden="true" />
                {checkingControlledBatch ? 'Checking...' : 'Check Controlled Batch Send Gate'}
              </button>
            </div>
          </div>
          <p className="mt-2 rounded-md border border-amber-200 bg-amber-50 px-2.5 py-1.5 text-xs font-semibold text-amber-800">
            Real batch sending is expected to be blocked by safety flag. Row recipients should receive 0 real emails.
          </p>
          {controlledBatchSummary ? (
            <div className="mt-2 rounded-md border border-slate-200 bg-white p-2.5">
              <p className="text-xs font-semibold uppercase tracking-[0.12em] text-slate-500">Controlled Batch Gate Result</p>
              {controlledBatchSummary.firstErrorMessage ? (
                <p className="mt-2 rounded-md border border-amber-200 bg-amber-50 px-2.5 py-1.5 text-xs font-semibold text-amber-800">
                  {controlledBatchSummary.firstErrorMessage}
                </p>
              ) : null}
              <div className="mt-2 flex flex-wrap items-center gap-2 text-xs text-slate-700">
                <p><span className="font-semibold">Planned recipients:</span> {controlledBatchSummary.plannedRecipients ?? 0}</p>
                <p><span className="font-semibold">Sent:</span> {controlledBatchSummary.sent ?? 0}</p>
                <p><span className="font-semibold">Failed:</span> {controlledBatchSummary.failed ?? 0}</p>
                <p><span className="font-semibold">Blocked:</span> {controlledBatchSummary.blocked ?? 0}</p>
                <p><span className="font-semibold">Skipped:</span> {controlledBatchSummary.skipped ?? 0}</p>
                <p><span className="font-semibold">Safety flag:</span> {controlledBatchSummary.safetyFlagStatus || 'unknown'}</p>
              </div>
            </div>
          ) : null}
        </div>
      ) : null}

      {failedRowResendGateAvailable ? (
        <div className="mt-3 rounded-md border border-slate-200 bg-slate-50 p-3">
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.08em] text-slate-500">Failed Row Resend</p>
              <p className="mt-1 text-xs font-semibold text-slate-700">
                Failed row resend is blocked by default. Only rows marked as failed in controlled batch logs can be checked.
              </p>
              {failedBatchRowsCount === 0 ? (
                <p className="mt-2 rounded-md border border-slate-200 bg-white px-2.5 py-1.5 text-xs font-semibold text-slate-700">
                  No failed rows available for resend.
                </p>
              ) : null}
              <div className="mt-2 flex flex-wrap items-center gap-2 text-xs text-slate-600">
                <p><span className="font-semibold">Failed rows:</span> {failedBatchRowsCount}</p>
                <p><span className="font-semibold">Limit:</span> Max 5 rows</p>
                <p><span className="font-semibold">Attachment:</span> DOCX only</p>
                <p><span className="font-semibold">Successful rows:</span> Never resent</p>
              </div>
            </div>
            <div className="grid w-full gap-2 sm:w-auto sm:min-w-[260px]">
              <label className="grid gap-1.5">
                <span className="text-xs font-semibold uppercase tracking-[0.12em] text-slate-400">Confirmation phrase</span>
                <input
                  value={resendFailedPhrase}
                  onChange={(event) => setResendFailedPhrase(event.target.value)}
                  placeholder="RESEND FAILED ROWS"
                  className="min-h-9 rounded-md border border-slate-200 bg-white px-2.5 text-xs font-semibold text-primary outline-none transition focus:border-accentBlue focus:ring-2 focus:ring-blue-100"
                />
              </label>
              <button
                type="button"
                onClick={handleCheckResendFailedGate}
                disabled={checkingResendFailed}
                className="focus-ring inline-flex min-h-9 items-center justify-center gap-1.5 rounded-md border border-slate-200 bg-white px-3 text-xs font-semibold text-primary transition hover:border-accentBlue hover:text-accentBlue disabled:opacity-60"
                title="Checks the failed-row resend backend gate. Default configuration blocks resend delivery."
              >
                <ShieldCheck size={16} aria-hidden="true" />
                {checkingResendFailed ? 'Checking...' : 'Check Failed Row Resend Gate'}
              </button>
            </div>
          </div>
          <p className="mt-2 rounded-md border border-amber-200 bg-amber-50 px-2.5 py-1.5 text-xs font-semibold text-amber-800">
            Failed row resend is expected to be blocked by safety flag. No row-recipient emails should be sent.
          </p>
          {resendFailedSummary ? (
            <div className="mt-2 rounded-md border border-slate-200 bg-white p-2.5">
              <p className="text-xs font-semibold uppercase tracking-[0.12em] text-slate-500">Failed Row Resend Gate Result</p>
              {resendFailedSummary.firstErrorMessage ? (
                <p className="mt-2 rounded-md border border-amber-200 bg-amber-50 px-2.5 py-1.5 text-xs font-semibold text-amber-800">
                  {resendFailedSummary.firstErrorMessage}
                </p>
              ) : null}
              <div className="mt-2 flex flex-wrap items-center gap-2 text-xs text-slate-700">
                <p><span className="font-semibold">Planned rows:</span> {resendFailedSummary.plannedRows ?? 0}</p>
                <p><span className="font-semibold">Sent:</span> {resendFailedSummary.sent ?? 0}</p>
                <p><span className="font-semibold">Failed:</span> {resendFailedSummary.failed ?? 0}</p>
                <p><span className="font-semibold">Blocked:</span> {resendFailedSummary.blocked ?? 0}</p>
                <p><span className="font-semibold">Skipped:</span> {resendFailedSummary.skipped ?? 0}</p>
                <p><span className="font-semibold">Safety flag:</span> {resendFailedSummary.safetyFlagStatus || 'unknown'}</p>
              </div>
            </div>
          ) : null}
        </div>
      ) : null}

      <div className="mt-3 rounded-md border border-amber-200 bg-amber-50 px-3 py-2">
        <p className="text-xs font-semibold uppercase tracking-[0.08em] text-amber-700">Email delivery roadmap</p>
        <p className="mt-1 text-xs text-amber-800">
          Test email sending is available. Real batch sending and failed-row resend remain locked by backend safety flags.
        </p>
      </div>

      <div className="mt-3 flex flex-wrap items-center gap-2 rounded-md border border-slate-200 bg-slate-50 p-2">
        <button
          type="button"
          onClick={openEmailPreview}
          className="focus-ring inline-flex min-h-8 items-center justify-center rounded-md border border-slate-200 bg-white px-2.5 text-xs font-semibold text-primary transition hover:border-accentBlue hover:text-accentBlue"
        >
          Email Preview
        </button>
        {showBatchTable && emailRows.length > 0 ? (
          <button
            type="button"
            onClick={openPreparedRows}
            className="focus-ring inline-flex min-h-8 items-center justify-center rounded-md border border-slate-200 bg-white px-2.5 text-xs font-semibold text-primary transition hover:border-accentBlue hover:text-accentBlue"
          >
            Prepared Rows ({emailRows.length})
          </button>
        ) : null}
      </div>

      {emailPreviewOpen || preparedRowsOpen ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/50 px-4 py-6">
          <div className="flex max-h-[82vh] w-full max-w-4xl min-w-0 flex-col overflow-hidden rounded-lg border border-slate-200 bg-white shadow-xl">
            <div className="flex items-center justify-between gap-3 border-b border-slate-200 px-4 py-3">
              <p className="min-w-0 truncate text-sm font-bold text-primary">
                {emailPreviewOpen ? 'Email Preview' : `Prepared Rows (${emailRows.length})`}
              </p>
              <button
                type="button"
                onClick={closeEmailOverlay}
                className="focus-ring inline-flex min-h-8 items-center justify-center rounded-md border border-slate-200 bg-white px-2.5 text-xs font-semibold text-primary transition hover:border-accentBlue hover:text-accentBlue"
              >
                Close
              </button>
            </div>

            {emailPreviewOpen ? (
              <div className="max-h-[68vh] min-w-0 overflow-y-auto overflow-x-hidden p-3 text-xs text-slate-700">
                <p className="font-semibold">Recipient</p>
                <p className="mt-1 max-w-full break-words">{previewRecipient || 'Recipient email not available'}</p>
                <p className="mt-2 font-semibold">Subject</p>
                <p className="mt-1 max-w-full whitespace-pre-wrap break-words">{previewSubject || 'Subject preview will appear here.'}</p>
                <p className="mt-2 font-semibold">Message</p>
                <p className="mt-1 max-w-full whitespace-pre-wrap break-words leading-5">{previewMessage || 'Message preview will appear here.'}</p>
                <p className="mt-2 font-semibold">Safe preview payload</p>
                <p className="mt-1 whitespace-pre-wrap text-xs text-slate-500">
                  Recipient valid: {recipientIsValid ? 'Yes' : 'No'}
                </p>
                <pre className="mt-2 max-h-48 max-w-full overflow-auto whitespace-pre-wrap break-words rounded-md bg-slate-900 p-2 text-xs text-slate-100">
                  {JSON.stringify(previewPayload, null, 2)}
                </pre>
              </div>
            ) : null}

            {preparedRowsOpen ? (
              <div className="max-h-[68vh] min-w-0 overflow-auto p-3">
                <table className="min-w-[760px] text-left text-xs text-slate-600">
                  <thead className="border-b border-slate-200 bg-slate-50 text-xs uppercase tracking-[0.08em] text-slate-500">
                    <tr>
                      <th className="px-2 py-2">Row</th>
                      <th className="px-2 py-2">Recipient</th>
                      <th className="px-2 py-2">Subject</th>
                      <th className="px-2 py-2">Message</th>
                      <th className="px-2 py-2 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {emailRows.map((item) => {
                      const recipient = resolveRecipient(item.row, recipientColumn)
                      const subject = renderTemplate(subjectTemplate, item.row)
                      const message = renderTemplate(messageTemplate, item.row)

                      return (
                        <tr key={item.output.id} className="border-b border-slate-100 align-top transition hover:bg-slate-50">
                          <td className="px-2 py-2 font-semibold text-primary">{item.output.row_index}</td>
                          <td className="px-2 py-2 break-all">{recipient || 'Missing email'}</td>
                          <td className="px-2 py-2 break-all">{subject}</td>
                          <td className="px-2 py-2 break-all leading-5">{message}</td>
                          <td className="px-2 py-2 text-right">
                            <div className="flex flex-wrap items-center justify-end gap-1.5">
                              <button
                                type="button"
                                onClick={() => {
                                  setSelectedOutputId(item.output.id)
                                  copyText(recipient, setFeedback)
                                }}
                                disabled={!recipient}
                                className="focus-ring inline-flex min-h-8 items-center justify-center gap-1 rounded-md border border-slate-200 bg-white px-2 text-[11px] font-semibold text-primary transition hover:border-accentBlue hover:text-accentBlue disabled:opacity-60"
                              >
                                Copy recipient
                              </button>
                              <button
                                type="button"
                                onClick={() => {
                                  setSelectedOutputId(item.output.id)
                                  copyText(message, setFeedback)
                                }}
                                className="focus-ring inline-flex min-h-8 items-center justify-center gap-1 rounded-md border border-slate-200 bg-white px-2 text-[11px] font-semibold text-primary transition hover:border-accentBlue hover:text-accentBlue"
                              >
                                Copy message
                              </button>
                              {onDownload ? (
                                <button
                                  type="button"
                                  onClick={() => onDownload(item.output)}
                                  className="focus-ring inline-flex min-h-8 items-center justify-center gap-1 rounded-md bg-emerald-700 px-2 text-[11px] font-semibold text-white transition hover:bg-emerald-800"
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
          </div>
        </div>
      ) : null}
    </section>
  )
}
