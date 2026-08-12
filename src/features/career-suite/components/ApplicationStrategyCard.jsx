import { CheckCircle2, AlertCircle, Sparkles, TrendingUp } from 'lucide-react'

export function ApplicationStrategyCard({ job, strategy, atsAnalysis }) {
  if (!strategy) return null

  return (
    <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between border-b border-slate-100 pb-5">
        <div>
          <div className="flex items-center gap-2">
            <span className="rounded bg-teal-50 px-2 py-0.5 text-[10px] font-bold text-teal-800 uppercase border border-teal-200">
              Application Strategy
            </span>
            <span className={`rounded border px-2 py-0.5 text-[10px] font-bold uppercase ${strategy.strengthColor}`}>
              {strategy.applicationStrength}
            </span>
          </div>
          <h3 className="mt-1 text-base font-black text-slate-900">{job.title}</h3>
          <p className="text-xs text-slate-500">{job.company} • {job.location || 'Remote'}</p>
        </div>

        <div className="flex items-center gap-3">
          <div className="text-right">
            <span className="text-[11px] font-semibold text-slate-400">ATS Fit</span>
            <p className="text-2xl font-black text-teal-700">{strategy.matchScore}%</p>
          </div>
          <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-teal-600 text-white font-black text-lg shadow-sm">
            {strategy.matchScore}
          </div>
        </div>
      </div>

      <div className="mt-5 grid gap-5 md:grid-cols-2">
        {/* Strongest Points */}
        <div className="rounded-lg border border-emerald-100 bg-emerald-50/40 p-4">
          <span className="text-xs font-bold text-emerald-900 flex items-center gap-1.5">
            <CheckCircle2 size={14} className="text-emerald-600" />
            Verified Match Strengths
          </span>
          <ul className="mt-2 space-y-1.5 text-xs text-slate-700">
            {strategy.strongestPoints?.map((pt, idx) => (
              <li key={idx} className="flex items-start gap-1.5">
                <span className="text-emerald-600 font-bold">•</span>
                <span>{pt}</span>
              </li>
            ))}
          </ul>
        </div>

        {/* Missing / Focus Areas */}
        <div className="rounded-lg border border-amber-100 bg-amber-50/40 p-4">
          <span className="text-xs font-bold text-amber-900 flex items-center gap-1.5">
            <AlertCircle size={14} className="text-amber-600" />
            Strategic Areas to Address
          </span>
          <ul className="mt-2 space-y-1.5 text-xs text-slate-700">
            {strategy.missingRequirements?.map((req, idx) => (
              <li key={idx} className="flex items-start gap-1.5">
                <span className="text-amber-600 font-bold">•</span>
                <span>{req}</span>
              </li>
            ))}
          </ul>
        </div>
      </div>

      {/* Recommended Action Checklist */}
      <div className="mt-4 rounded-lg border border-slate-100 bg-slate-50 p-4">
        <span className="text-xs font-bold text-slate-800">Pre-Application Optimization Checklist:</span>
        <ul className="mt-2 space-y-1.5 text-xs text-slate-700">
          {strategy.recommendedActions?.map((act, idx) => (
            <li key={idx} className="flex items-start gap-2">
              <span className="flex h-4 w-4 shrink-0 items-center justify-center rounded-full bg-teal-600 text-[9px] font-bold text-white mt-0.5">
                {idx + 1}
              </span>
              <span>{act}</span>
            </li>
          ))}
        </ul>
      </div>
    </div>
  )
}
