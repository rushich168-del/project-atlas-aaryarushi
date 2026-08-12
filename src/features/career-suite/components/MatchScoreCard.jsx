import { Target, CheckCircle2, AlertCircle, TrendingUp } from 'lucide-react'

export function MatchScoreCard({ analysis }) {
  const { matchScore, skillScore, experienceScore, keywordScore, educationScore, resumeScore = 80 } = analysis

  const scoreLevel = matchScore >= 80
    ? { label: 'Strong Fit', color: 'text-emerald-700 bg-emerald-50 border-emerald-200' }
    : matchScore >= 60
    ? { label: 'Competitive Fit', color: 'text-teal-700 bg-teal-50 border-teal-200' }
    : { label: 'Action Needed', color: 'text-amber-700 bg-amber-50 border-amber-200' }

  return (
    <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
      <div className="flex flex-col gap-6 md:flex-row md:items-center md:justify-between border-b border-slate-100 pb-6">
        <div>
          <div className="flex items-center gap-2">
            <span className="rounded bg-teal-50 px-2 py-0.5 text-[10px] font-bold text-teal-800 uppercase border border-teal-200">
              Deterministic ATS Analysis
            </span>
            <span className={`rounded border px-2 py-0.5 text-[10px] font-bold uppercase ${scoreLevel.color}`}>
              {scoreLevel.label}
            </span>
          </div>
          <h3 className="mt-2 text-lg font-black text-slate-900">Job Fit & ATS Match Score</h3>
          <p className="text-xs text-slate-500">
            Weighted calculation across required skills (35%), experience (25%), keywords (20%), education (10%), and resume completeness (10%).
          </p>
        </div>

        <div className="flex items-center gap-4">
          <div className="text-right">
            <span className="text-xs font-semibold text-slate-400">Overall Match</span>
            <p className="text-3xl font-black text-teal-700">
              {matchScore}<span className="text-sm font-semibold text-slate-400">/100</span>
            </p>
          </div>
          <div className="h-16 w-16 rounded-2xl bg-teal-600 flex items-center justify-center text-white font-black text-xl shadow-md">
            {matchScore}%
          </div>
        </div>
      </div>

      {/* 5 Dimension Breakdown Bars */}
      <div className="mt-5 grid gap-3 sm:grid-cols-2 lg:grid-cols-5">
        <div className="rounded-lg border border-slate-100 bg-slate-50/70 p-3.5">
          <div className="flex items-center justify-between text-xs">
            <span className="font-semibold text-slate-600">Skills (35%)</span>
            <span className="font-bold text-teal-700">{skillScore}%</span>
          </div>
          <div className="mt-2 h-1.5 w-full rounded-full bg-slate-200">
            <div className="h-1.5 rounded-full bg-teal-600" style={{ width: `${skillScore}%` }} />
          </div>
        </div>

        <div className="rounded-lg border border-slate-100 bg-slate-50/70 p-3.5">
          <div className="flex items-center justify-between text-xs">
            <span className="font-semibold text-slate-600">Experience (25%)</span>
            <span className="font-bold text-teal-700">{experienceScore}%</span>
          </div>
          <div className="mt-2 h-1.5 w-full rounded-full bg-slate-200">
            <div className="h-1.5 rounded-full bg-teal-600" style={{ width: `${experienceScore}%` }} />
          </div>
        </div>

        <div className="rounded-lg border border-slate-100 bg-slate-50/70 p-3.5">
          <div className="flex items-center justify-between text-xs">
            <span className="font-semibold text-slate-600">Keywords (20%)</span>
            <span className="font-bold text-teal-700">{keywordScore}%</span>
          </div>
          <div className="mt-2 h-1.5 w-full rounded-full bg-slate-200">
            <div className="h-1.5 rounded-full bg-teal-600" style={{ width: `${keywordScore}%` }} />
          </div>
        </div>

        <div className="rounded-lg border border-slate-100 bg-slate-50/70 p-3.5">
          <div className="flex items-center justify-between text-xs">
            <span className="font-semibold text-slate-600">Education (10%)</span>
            <span className="font-bold text-teal-700">{educationScore}%</span>
          </div>
          <div className="mt-2 h-1.5 w-full rounded-full bg-slate-200">
            <div className="h-1.5 rounded-full bg-teal-600" style={{ width: `${educationScore}%` }} />
          </div>
        </div>

        <div className="rounded-lg border border-slate-100 bg-slate-50/70 p-3.5">
          <div className="flex items-center justify-between text-xs">
            <span className="font-semibold text-slate-600">Resume (10%)</span>
            <span className="font-bold text-teal-700">{resumeScore}%</span>
          </div>
          <div className="mt-2 h-1.5 w-full rounded-full bg-slate-200">
            <div className="h-1.5 rounded-full bg-teal-600" style={{ width: `${resumeScore}%` }} />
          </div>
        </div>
      </div>
    </div>
  )
}
