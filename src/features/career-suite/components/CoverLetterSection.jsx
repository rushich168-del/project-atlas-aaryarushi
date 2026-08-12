import { useState } from 'react'
import { FileText, Copy, Check, RotateCw, Save } from 'lucide-react'

export function CoverLetterSection({
  coverLetterText = '',
  onChangeText,
  onRegenerate,
  onSave,
  isSaving = false,
  status = 'draft',
}) {
  const [copied, setCopied] = useState(false)

  function handleCopy() {
    if (!coverLetterText) return
    navigator.clipboard.writeText(coverLetterText)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  return (
    <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between border-b border-slate-100 pb-4">
        <div>
          <div className="flex items-center gap-2">
            <h4 className="text-sm font-bold text-slate-900">Tailored Cover Letter Draft</h4>
            <span className={`rounded border px-2 py-0.5 text-[10px] font-bold uppercase ${
              status === 'saved'
                ? 'border-emerald-200 bg-emerald-50 text-emerald-700'
                : 'border-amber-200 bg-amber-50 text-amber-700'
            }`}>
              {status === 'saved' ? 'Saved' : 'Draft'}
            </span>
          </div>
          <p className="text-xs text-slate-500">
            Synthesized strictly from your Career Profile identity, verified skills, and actual work achievements.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={onRegenerate}
            className="inline-flex items-center gap-1 rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-xs font-semibold text-slate-700 hover:bg-slate-50 transition"
            title="Regenerate draft from profile"
          >
            <RotateCw size={13} />
            Regenerate Draft
          </button>
          <button
            type="button"
            onClick={handleCopy}
            className="inline-flex items-center gap-1 rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-xs font-semibold text-slate-700 hover:bg-slate-50 transition"
            title="Copy letter to clipboard"
          >
            {copied ? <Check size={13} className="text-emerald-600" /> : <Copy size={13} />}
            {copied ? 'Copied' : 'Copy'}
          </button>
          <button
            type="button"
            onClick={onSave}
            disabled={isSaving}
            className="inline-flex items-center gap-1 rounded-lg bg-teal-600 px-3.5 py-1.5 text-xs font-bold text-white shadow-sm hover:bg-teal-700 transition disabled:opacity-50"
          >
            <Save size={13} />
            {isSaving ? 'Saving...' : 'Save Draft'}
          </button>
        </div>
      </div>

      <div className="mt-4">
        <textarea
          rows={14}
          value={coverLetterText}
          onChange={(e) => onChangeText(e.target.value)}
          placeholder="Cover letter draft text..."
          className="w-full rounded-xl border border-slate-200 bg-slate-50/50 p-4 font-mono text-xs leading-6 text-slate-800 focus:border-teal-500 focus:bg-white focus:outline-hidden focus:ring-1 focus:ring-teal-500"
        />
        <div className="mt-2 flex items-center justify-between text-[11px] text-slate-400">
          <span>Editable text area • Changes are preserved upon clicking "Save Draft"</span>
          <span>{coverLetterText.length} characters</span>
        </div>
      </div>
    </div>
  )
}
