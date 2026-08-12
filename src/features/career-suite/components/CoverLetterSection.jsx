import { useState } from 'react'
import { FileText, Copy, Check, RotateCw, Save, Download, Printer, ShieldCheck, Sparkles } from 'lucide-react'
import { COVER_LETTER_TONES, COVER_LETTER_TEMPLATES } from '../../../services/applicationAssistantService.js'

export function CoverLetterSection({
  coverLetterText = '',
  onChangeText,
  tone = 'Executive',
  onChangeTone,
  template = 'Standard',
  onChangeTemplate,
  onRegenerate,
  onSave,
  onExportPDF,
  isSaving = false,
  status = 'draft',
  wordCount = 0,
  characterCount = 0,
  verifiedFactsCount = 0,
  atsScore = 0,
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
      {/* Top Header */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between border-b border-slate-100 pb-4">
        <div>
          <div className="flex items-center gap-2">
            <h4 className="text-sm font-bold text-slate-900">Customized Cover Letter Workspace</h4>
            <span className={`rounded border px-2 py-0.5 text-[10px] font-bold uppercase ${
              status === 'saved'
                ? 'border-emerald-200 bg-emerald-50 text-emerald-700'
                : 'border-amber-200 bg-amber-50 text-amber-700'
            }`}>
              {status === 'saved' ? 'Saved' : 'Draft'}
            </span>
          </div>
          <p className="text-xs text-slate-500">
            Generated from your verified Career Profile, Resume and Job data. Never fabricates unverified achievements.
          </p>
        </div>

        {/* Action Controls */}
        <div className="flex flex-wrap items-center gap-2">
          <button
            type="button"
            onClick={onRegenerate}
            className="inline-flex items-center gap-1 rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-xs font-semibold text-slate-700 hover:bg-slate-50 transition"
            title="Regenerate draft from profile"
          >
            <RotateCw size={13} />
            Regenerate
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
            onClick={onExportPDF}
            className="inline-flex items-center gap-1 rounded-lg border border-teal-200 bg-teal-50 px-3 py-1.5 text-xs font-bold text-teal-800 hover:bg-teal-100 transition shadow-2xs"
            title="Export or print PDF with latest edits"
          >
            <Printer size={13} className="text-teal-600" />
            Export PDF
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

      {/* Tone & Template Selection Bar */}
      <div className="mt-4 grid gap-4 sm:grid-cols-2 rounded-xl border border-slate-100 bg-slate-50/70 p-3.5">
        {/* Tone Options */}
        <div>
          <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500 block mb-1.5">
            Tone of Voice:
          </span>
          <div className="flex flex-wrap gap-1.5">
            {COVER_LETTER_TONES.map((t) => (
              <button
                key={t}
                type="button"
                onClick={() => onChangeTone(t)}
                className={`rounded-lg px-2.5 py-1 text-xs font-semibold transition ${
                  tone === t
                    ? 'bg-teal-600 text-white shadow-xs'
                    : 'bg-white border border-slate-200 text-slate-700 hover:bg-slate-100'
                }`}
              >
                {t}
              </button>
            ))}
          </div>
        </div>

        {/* Template Options */}
        <div>
          <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500 block mb-1.5">
            Letter Template:
          </span>
          <div className="flex flex-wrap gap-1.5">
            {COVER_LETTER_TEMPLATES.map((tmpl) => (
              <button
                key={tmpl}
                type="button"
                onClick={() => onChangeTemplate(tmpl)}
                className={`rounded-lg px-2.5 py-1 text-xs font-semibold transition ${
                  template === tmpl
                    ? 'bg-slate-800 text-white shadow-xs'
                    : 'bg-white border border-slate-200 text-slate-700 hover:bg-slate-100'
                }`}
              >
                {tmpl}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Live Quality Metadata Strip */}
      <div className="mt-3 flex flex-wrap items-center gap-4 text-xs font-semibold text-slate-600 border-b border-slate-100 pb-3">
        <span className="inline-flex items-center gap-1 text-teal-700">
          <ShieldCheck size={13} className="text-teal-600" />
          ATS Alignment: {atsScore}%
        </span>
        <span className="text-slate-300">•</span>
        <span className="text-slate-700">
          Verified Facts: <span className="font-bold text-slate-900">{verifiedFactsCount}</span>
        </span>
        <span className="text-slate-300">•</span>
        <span className="text-slate-700">
          Words: <span className="font-bold text-slate-900">{wordCount}</span>
        </span>
        <span className="text-slate-300">•</span>
        <span className="text-slate-700">
          Characters: <span className="font-bold text-slate-900">{characterCount}</span>
        </span>
      </div>

      {/* Text Area */}
      <div className="mt-4">
        <textarea
          rows={14}
          value={coverLetterText}
          onChange={(e) => onChangeText(e.target.value)}
          placeholder="Cover letter draft text..."
          className="w-full rounded-xl border border-slate-200 bg-slate-50/50 p-4 font-mono text-xs leading-6 text-slate-800 focus:border-teal-500 focus:bg-white focus:outline-hidden focus:ring-1 focus:ring-teal-500"
        />
        <div className="mt-2 flex items-center justify-between text-[11px] text-slate-400">
          <span>Editable text area • Exported PDF and Saved Drafts immediately reflect manual adjustments</span>
          <span>{characterCount} chars</span>
        </div>
      </div>
    </div>
  )
}
