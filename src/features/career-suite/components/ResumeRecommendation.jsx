import { FileText, CheckCircle2, ArrowRight, Sparkles } from 'lucide-react'

export function ResumeRecommendation({ recommendedResume, onSelectResume }) {
  if (!recommendedResume) {
    return (
      <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
        <h4 className="text-sm font-bold text-slate-900">Recommended Resume Version</h4>
        <p className="mt-1 text-xs text-slate-500">
          No saved resume found. Create your first resume version in the Resume Builder to optimize job applications.
        </p>
      </div>
    )
  }

  return (
    <div className="rounded-xl border border-teal-200 bg-teal-50/40 p-6 shadow-sm">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between border-b border-teal-200/60 pb-4">
        <div>
          <div className="flex items-center gap-1.5">
            <span className="rounded bg-teal-600 px-2 py-0.5 text-[10px] font-bold text-white uppercase">
              Top Match
            </span>
            <span className="text-xs font-bold text-teal-900">
              {recommendedResume.alignmentScore}% Role Alignment
            </span>
          </div>
          <h4 className="mt-1 text-base font-black text-slate-900">{recommendedResume.title}</h4>
          <p className="text-xs text-slate-500">Template: {recommendedResume.template_id || 'Modern Tech'}</p>
        </div>

        {onSelectResume && (
          <button
            type="button"
            onClick={() => onSelectResume(recommendedResume.id)}
            className="inline-flex items-center gap-1.5 rounded-lg bg-teal-600 px-4 py-2 text-xs font-bold text-white shadow-sm hover:bg-teal-700 transition"
          >
            <FileText size={14} />
            Attach to Application
          </button>
        )}
      </div>

      <div className="mt-4">
        <span className="text-xs font-bold text-slate-700">Why this resume is recommended:</span>
        <ul className="mt-2 space-y-1.5 text-xs text-slate-700">
          {recommendedResume.reasons?.map((reason, idx) => (
            <li key={idx} className="flex items-center gap-2">
              <CheckCircle2 size={13} className="text-teal-600 shrink-0" />
              <span>{reason}</span>
            </li>
          ))}
        </ul>
      </div>
    </div>
  )
}
