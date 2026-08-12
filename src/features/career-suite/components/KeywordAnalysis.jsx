import { Tag, Check, AlertTriangle } from 'lucide-react'

export function KeywordAnalysis({ matchedKeywords = [], missingKeywords = [] }) {
  return (
    <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
      <div className="flex items-center justify-between border-b border-slate-100 pb-3">
        <div>
          <h4 className="text-sm font-bold text-slate-900">ATS Keyword Frequency & Optimization</h4>
          <p className="text-xs text-slate-500">Domain keywords extracted from job posting vs candidate profile evidence.</p>
        </div>
        <div className="flex items-center gap-2 text-xs font-semibold">
          <span className="text-emerald-700">{matchedKeywords.length} Matched</span>
          <span className="text-slate-300">•</span>
          <span className="text-amber-700">{missingKeywords.length} Missing</span>
        </div>
      </div>

      <div className="mt-4 grid gap-4 sm:grid-cols-2">
        {/* Matched Keywords */}
        <div>
          <span className="text-xs font-bold text-slate-700">Matched in Candidate Profile</span>
          <div className="mt-2 flex flex-wrap gap-1.5">
            {matchedKeywords.length === 0 ? (
              <span className="text-[11px] text-slate-400 italic">None</span>
            ) : (
              matchedKeywords.map((kw, idx) => (
                <span
                  key={idx}
                  className="inline-flex items-center gap-1 rounded-md border border-emerald-200 bg-emerald-50 px-2 py-0.5 text-[11px] font-semibold text-emerald-800"
                >
                  <Check size={11} className="text-emerald-600" />
                  {kw}
                </span>
              ))
            )}
          </div>
        </div>

        {/* Missing Keywords */}
        <div>
          <span className="text-xs font-bold text-slate-700">Recommended Keywords to Include</span>
          <div className="mt-2 flex flex-wrap gap-1.5">
            {missingKeywords.length === 0 ? (
              <span className="text-[11px] text-emerald-600 font-semibold">All target keywords covered!</span>
            ) : (
              missingKeywords.map((kw, idx) => (
                <span
                  key={idx}
                  className="inline-flex items-center gap-1 rounded-md border border-amber-200 bg-amber-50 px-2 py-0.5 text-[11px] font-semibold text-amber-900"
                >
                  <AlertTriangle size={11} className="text-amber-600" />
                  {kw}
                </span>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
