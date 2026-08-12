import { useState } from 'react'
import { CheckCircle2, AlertCircle, Copy, Check, Sparkles, TrendingUp, HelpCircle } from 'lucide-react'

export function LinkedInOptimizer({ linkedInRecs }) {
  const [copiedHeadlineIdx, setCopiedHeadlineIdx] = useState(null)
  const [copiedAbout, setCopiedAbout] = useState(false)

  function handleCopyHeadline(text, idx) {
    navigator.clipboard.writeText(text)
    setCopiedHeadlineIdx(idx)
    setTimeout(() => setCopiedHeadlineIdx(null), 2000)
  }

  function handleCopyAbout() {
    navigator.clipboard.writeText(linkedInRecs.aboutDraft)
    setCopiedAbout(true)
    setTimeout(() => setCopiedAbout(false), 2000)
  }

  return (
    <div className="space-y-6">
      {/* 1. Profile Strength & Completeness Gauge */}
      <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
        <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between border-b border-slate-100 pb-5">
          <div>
            <div className="flex items-center gap-2">
              <span className="rounded bg-blue-50 px-2 py-0.5 text-[10px] font-bold text-blue-700 uppercase border border-blue-200">
                Blueprint & Optimization
              </span>
              <span className="text-[11px] text-slate-400">Manual Strategy • No Account Access</span>
            </div>
            <h3 className="mt-2 text-base font-bold text-slate-900">LinkedIn Profile Strength & Strategy</h3>
            <p className="text-xs text-slate-500">
              Actionable recommendations to align your LinkedIn presence with your Career Suite identity.
            </p>
          </div>

          <div className="flex items-center gap-4">
            <div className="text-right">
              <span className="text-xs font-semibold text-slate-500">Completeness</span>
              <p className="text-2xl font-extrabold text-teal-700">{linkedInRecs.completenessScore}%</p>
            </div>
            <div className="h-12 w-12 rounded-full border-4 border-teal-500 flex items-center justify-center font-bold text-xs text-teal-800">
              {linkedInRecs.completenessScore}%
            </div>
          </div>
        </div>

        <div className="mt-4 grid gap-3 sm:grid-cols-3">
          {linkedInRecs.checks?.map((c, idx) => (
            <div key={idx} className="flex items-center gap-2 text-xs">
              {c.valid ? (
                <CheckCircle2 size={15} className="text-emerald-600 shrink-0" />
              ) : (
                <AlertCircle size={15} className="text-amber-500 shrink-0" />
              )}
              <span className={c.valid ? 'font-medium text-slate-700' : 'text-slate-500'}>
                {c.label}
              </span>
            </div>
          ))}
        </div>
      </div>

      {/* 2. Headline Blueprint Suggestions */}
      <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
        <h4 className="text-sm font-bold text-slate-900">High-Impact Headline Blueprints</h4>
        <p className="text-xs text-slate-500">Formula: [Target Role] + [Key Tech Stack] + [Business Value / Metric]</p>

        <div className="mt-4 space-y-3">
          {linkedInRecs.headlineSuggestions?.map((headline, idx) => (
            <div
              key={idx}
              className="flex items-center justify-between gap-4 rounded-lg border border-slate-200 bg-slate-50/70 p-3.5 text-xs transition hover:bg-white hover:border-teal-400"
            >
              <span className="font-semibold text-slate-800 leading-5">{headline}</span>
              <button
                type="button"
                onClick={() => handleCopyHeadline(headline, idx)}
                className="inline-flex items-center gap-1 rounded bg-white px-2.5 py-1 text-[11px] font-bold text-teal-700 border border-slate-200 hover:bg-teal-50 shadow-sm shrink-0"
              >
                {copiedHeadlineIdx === idx ? <Check size={12} className="text-emerald-600" /> : <Copy size={12} />}
                {copiedHeadlineIdx === idx ? 'Copied' : 'Copy'}
              </button>
            </div>
          ))}
        </div>
      </div>

      {/* 3. About Section Draft */}
      <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
        <div className="flex items-center justify-between border-b border-slate-100 pb-3">
          <div>
            <h4 className="text-sm font-bold text-slate-900">Structured "About" Section Draft</h4>
            <p className="text-xs text-slate-500">Recruiter-optimized story highlighting leadership, skills, and shipped systems.</p>
          </div>
          <button
            type="button"
            onClick={handleCopyAbout}
            className="inline-flex items-center gap-1.5 rounded-lg border border-slate-200 bg-slate-50 px-3 py-1.5 text-xs font-semibold text-slate-700 hover:bg-slate-100"
          >
            {copiedAbout ? <Check size={13} className="text-emerald-600" /> : <Copy size={13} />}
            {copiedAbout ? 'Copied' : 'Copy About Draft'}
          </button>
        </div>

        <pre className="mt-4 whitespace-pre-wrap rounded-xl bg-slate-50 p-4 font-sans text-xs leading-6 text-slate-800 border border-slate-200">
          {linkedInRecs.aboutDraft}
        </pre>
      </div>

      {/* 4. Experience Bullets Checklist */}
      <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
        <h4 className="text-sm font-bold text-slate-900">Experience Impact Checklist</h4>
        <div className="mt-3 grid gap-3 sm:grid-cols-3">
          {linkedInRecs.experienceChecklist?.map((item, idx) => (
            <div key={idx} className="rounded-lg border border-slate-200 bg-slate-50 p-3 text-xs">
              <div className="flex items-center gap-1.5 font-bold text-slate-900">
                {item.passed ? <CheckCircle2 size={14} className="text-emerald-600" /> : <AlertCircle size={14} className="text-amber-500" />}
                <span>{item.title}</span>
              </div>
              <p className="mt-1 text-[11px] text-slate-600 leading-4">{item.detail}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
