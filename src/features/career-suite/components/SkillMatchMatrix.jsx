import { CheckCircle2, AlertCircle, XCircle } from 'lucide-react'

export function SkillMatchMatrix({ matchedSkills = [], developingSkills = [], missingSkills = [] }) {
  return (
    <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
      <h4 className="text-sm font-bold text-slate-900">Required Skills Breakdown</h4>
      <p className="text-xs text-slate-500">Comparison of candidate's verified skills against job requirements.</p>

      <div className="mt-4 grid gap-4 sm:grid-cols-3">
        {/* Strong Skills */}
        <div className="rounded-xl border border-emerald-200 bg-emerald-50/40 p-4">
          <div className="flex items-center gap-1.5 text-xs font-bold text-emerald-800">
            <CheckCircle2 size={14} className="text-emerald-600" />
            <span>Strong Matches ({matchedSkills.length})</span>
          </div>
          <div className="mt-3 flex flex-wrap gap-1.5">
            {matchedSkills.length === 0 ? (
              <span className="text-[11px] text-slate-400 italic">None</span>
            ) : (
              matchedSkills.map((s, idx) => (
                <span
                  key={idx}
                  className="rounded-md border border-emerald-200 bg-white px-2 py-0.5 text-[11px] font-semibold text-emerald-900 shadow-2xs"
                >
                  {s.name}
                </span>
              ))
            )}
          </div>
        </div>

        {/* Developing Skills */}
        <div className="rounded-xl border border-amber-200 bg-amber-50/40 p-4">
          <div className="flex items-center gap-1.5 text-xs font-bold text-amber-800">
            <AlertCircle size={14} className="text-amber-600" />
            <span>Developing ({developingSkills.length})</span>
          </div>
          <div className="mt-3 flex flex-wrap gap-1.5">
            {developingSkills.length === 0 ? (
              <span className="text-[11px] text-slate-400 italic">None</span>
            ) : (
              developingSkills.map((s, idx) => (
                <span
                  key={idx}
                  className="rounded-md border border-amber-200 bg-white px-2 py-0.5 text-[11px] font-semibold text-amber-900 shadow-2xs"
                >
                  {s.name} • <span className="text-slate-500 font-normal">{s.proficiency}</span>
                </span>
              ))
            )}
          </div>
        </div>

        {/* Missing Skills */}
        <div className="rounded-xl border border-red-200 bg-red-50/40 p-4">
          <div className="flex items-center gap-1.5 text-xs font-bold text-red-800">
            <XCircle size={14} className="text-red-600" />
            <span>Missing Skills ({missingSkills.length})</span>
          </div>
          <div className="mt-3 flex flex-wrap gap-1.5">
            {missingSkills.length === 0 ? (
              <span className="text-[11px] text-slate-400 italic">None (Full Coverage!)</span>
            ) : (
              missingSkills.map((s, idx) => (
                <span
                  key={idx}
                  className="rounded-md border border-red-200 bg-white px-2 py-0.5 text-[11px] font-semibold text-red-900 shadow-2xs"
                >
                  {s.name}
                </span>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
