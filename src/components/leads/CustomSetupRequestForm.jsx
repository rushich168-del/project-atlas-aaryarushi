import { useState } from 'react'
import { Loader2, X } from 'lucide-react'
import { createCustomSetupInquiry } from '../../services/customSetupInquiryService.js'

// Project Atlas v3.7 — "Request Custom Setup" lead form (modal).
// Presentational + client-side validation only. Submits one inquiry row through
// customSetupInquiryService. No pricing, plans, payment, free, or demo wording.

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

const inputClass =
  'min-h-9 w-full rounded-md border border-slate-200 bg-white px-2.5 text-sm text-primary outline-none focus:border-accentBlue'
const areaClass =
  'w-full rounded-md border border-slate-200 bg-white px-2.5 py-1.5 text-sm text-primary outline-none focus:border-accentBlue'
const labelClass = 'text-[12px] font-semibold text-slate-600'
const errorClass = 'text-[11px] font-semibold text-rose-600'

function buildInitial(product) {
  return {
    name: '',
    organizationName: '',
    role: '',
    email: '',
    phoneWhatsapp: '',
    productInterested: product?.name || product?.productCode || '',
    documentNeeds: '',
    approximateMonthlyDocuments: '',
    message: '',
  }
}

export default function CustomSetupRequestForm({ product = null, source = 'website', onClose }) {
  const [values, setValues] = useState(() => buildInitial(product))
  const [errors, setErrors] = useState({})
  const [submitting, setSubmitting] = useState(false)
  const [submitError, setSubmitError] = useState('')
  const [done, setDone] = useState(false)

  function update(field, value) {
    setValues((prev) => ({ ...prev, [field]: value }))
  }

  function validate() {
    const next = {}
    if (!values.name.trim()) next.name = 'Please enter your name.'
    if (!values.organizationName.trim()) next.organizationName = 'Please enter your organization name.'
    if (!values.email.trim()) next.email = 'Please enter your email.'
    else if (!EMAIL_PATTERN.test(values.email.trim())) next.email = 'Please enter a valid email address.'
    if (!values.productInterested.trim()) next.productInterested = 'Please tell us which product you are interested in.'
    if (!values.documentNeeds.trim()) next.documentNeeds = 'Please tell us what you want to automate.'
    setErrors(next)
    return Object.keys(next).length === 0
  }

  async function handleSubmit(event) {
    event.preventDefault()
    setSubmitError('')
    if (!validate()) {
      return
    }

    setSubmitting(true)
    const result = await createCustomSetupInquiry({
      ...values,
      productId: product?.id || product?.slug || '',
      productName: product?.name || '',
      source,
    })
    setSubmitting(false)

    if (result.ok) {
      setDone(true)
    } else {
      setSubmitError(result.error || 'We could not submit your request right now. Please try again.')
    }
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-start justify-center overflow-y-auto bg-slate-900/50 p-4 sm:items-center"
      role="dialog"
      aria-modal="true"
      aria-label="Request custom setup"
    >
      <div className="my-8 w-full max-w-lg rounded-lg border border-slate-200 bg-white shadow-xl">
        <div className="flex items-start justify-between gap-4 border-b border-slate-200 p-5">
          <div>
            <h2 className="text-lg font-semibold text-primary">Request Custom Setup</h2>
            <p className="mt-1 text-sm leading-5 text-slate-500">
              Tell us what you want to automate. Our team will help prepare your organization workspace.
            </p>
            {product?.name || product?.productCode ? (
              <span className="mt-2 inline-flex items-center gap-1 rounded-md border border-teal-200 bg-teal-50 px-2 py-1 text-xs font-semibold text-teal-800">
                Custom setup for: {product.name || product.productCode}
              </span>
            ) : null}
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close"
            className="focus-ring inline-flex h-8 w-8 shrink-0 items-center justify-center rounded-md border border-slate-200 text-slate-500 transition hover:border-slate-300 hover:text-slate-700"
          >
            <X size={16} aria-hidden="true" />
          </button>
        </div>

        {done ? (
          <div className="p-6">
            <div className="rounded-md border border-teal-200 bg-teal-50 p-4">
              <p className="text-sm font-semibold leading-6 text-teal-800">
                Your setup request has been received. Our team will review it and contact you for the next steps.
              </p>
            </div>
            <button
              type="button"
              onClick={onClose}
              className="focus-ring mt-5 inline-flex min-h-10 w-full items-center justify-center rounded-md bg-accentTeal px-4 text-sm font-semibold text-white transition hover:bg-teal-800"
            >
              Close
            </button>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="grid gap-3 p-5" noValidate>
            <label className="grid gap-1">
              <span className={labelClass}>Name *</span>
              <input className={inputClass} value={values.name} onChange={(e) => update('name', e.target.value)} placeholder="Your full name" />
              {errors.name ? <span className={errorClass}>{errors.name}</span> : null}
            </label>

            <label className="grid gap-1">
              <span className={labelClass}>Organization name *</span>
              <input className={inputClass} value={values.organizationName} onChange={(e) => update('organizationName', e.target.value)} placeholder="School, college, office, or business name" />
              {errors.organizationName ? <span className={errorClass}>{errors.organizationName}</span> : null}
            </label>

            <div className="grid gap-3 sm:grid-cols-2">
              <label className="grid gap-1">
                <span className={labelClass}>Role</span>
                <input className={inputClass} value={values.role} onChange={(e) => update('role', e.target.value)} placeholder="e.g. Principal, HR, Admin" />
              </label>
              <label className="grid gap-1">
                <span className={labelClass}>Phone / WhatsApp</span>
                <input className={inputClass} value={values.phoneWhatsapp} onChange={(e) => update('phoneWhatsapp', e.target.value)} placeholder="Optional" />
              </label>
            </div>

            <label className="grid gap-1">
              <span className={labelClass}>Email *</span>
              <input className={inputClass} type="email" value={values.email} onChange={(e) => update('email', e.target.value)} placeholder="you@organization.com" />
              {errors.email ? <span className={errorClass}>{errors.email}</span> : null}
            </label>

            <label className="grid gap-1">
              <span className={labelClass}>Product interested in *</span>
              <input className={inputClass} value={values.productInterested} onChange={(e) => update('productInterested', e.target.value)} placeholder="e.g. AR-CERT-PRO or a custom document workflow" />
              {errors.productInterested ? <span className={errorClass}>{errors.productInterested}</span> : null}
            </label>

            <label className="grid gap-1">
              <span className={labelClass}>What documents do you want to automate? *</span>
              <textarea rows={2} className={areaClass} value={values.documentNeeds} onChange={(e) => update('documentNeeds', e.target.value)} placeholder="e.g. Certificates, marksheets, invoices, ID cards, fee receipts" />
              {errors.documentNeeds ? <span className={errorClass}>{errors.documentNeeds}</span> : null}
            </label>

            <label className="grid gap-1">
              <span className={labelClass}>Approximate documents per month</span>
              <input className={inputClass} value={values.approximateMonthlyDocuments} onChange={(e) => update('approximateMonthlyDocuments', e.target.value)} placeholder="e.g. 200 per month" />
            </label>

            <label className="grid gap-1">
              <span className={labelClass}>Notes / message</span>
              <textarea rows={2} className={areaClass} value={values.message} onChange={(e) => update('message', e.target.value)} placeholder="Anything else that helps us prepare your workspace" />
            </label>

            {submitError ? (
              <p className="rounded-md border border-rose-200 bg-rose-50 px-3 py-2 text-sm font-semibold text-rose-700">{submitError}</p>
            ) : null}

            <div className="mt-1 flex items-center justify-end gap-2">
              <button
                type="button"
                onClick={onClose}
                className="focus-ring inline-flex min-h-10 items-center justify-center rounded-md border border-slate-200 bg-white px-4 text-sm font-semibold text-slate-600 transition hover:border-slate-300"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={submitting}
                className={`focus-ring inline-flex min-h-10 items-center justify-center gap-2 rounded-md px-4 text-sm font-semibold text-white transition ${
                  submitting ? 'cursor-not-allowed bg-slate-400' : 'bg-accentTeal hover:bg-teal-800'
                }`}
              >
                {submitting ? <><Loader2 size={16} className="animate-spin" aria-hidden="true" /> Sending…</> : 'Send request'}
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  )
}
