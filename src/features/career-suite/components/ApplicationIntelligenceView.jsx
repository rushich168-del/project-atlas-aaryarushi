import { useState } from 'react'
import {
  TrendingUp,
  BarChart3,
  Briefcase,
  Clock,
  CheckCircle2,
  AlertCircle,
  FileText,
  Target,
  Sparkles,
  Layers,
  ArrowRight,
  ShieldCheck,
  Zap,
  Info,
  Calendar,
  Building,
  Globe,
  Star,
  Award,
} from 'lucide-react'

export function ApplicationIntelligenceView({ analytics, onNavigateToTrack = () => {} }) {
  if (!analytics || !analytics.overview.hasData) {
    return (
      <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-slate-200 bg-white p-12 text-center shadow-xs">
        <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-teal-50 text-teal-700">
          <TrendingUp size={28} />
        </div>
        <h3 className="mt-4 text-base font-extrabold text-slate-900">
          Application Intelligence Not Enough Data
        </h3>
        <p className="mt-2 max-w-md text-xs text-slate-500">
          Track opportunities and log stage progression (Applied, Screening, Interview, Offer) to unlock deterministic conversion rates, ATS correlations, and skill demand insights.
        </p>
        <button
          type="button"
          onClick={onNavigateToTrack}
          className="mt-5 inline-flex items-center gap-1.5 rounded-lg bg-teal-600 px-4 py-2 text-xs font-bold text-white shadow-xs hover:bg-teal-700 transition"
        >
          <Briefcase size={14} />
          Track Your First Opportunity
        </button>
      </div>
    )
  }

  const {
    overview,
    conversion,
    funnel,
    time,
    atsOutcome,
    resumePerformance,
    sourcePerformance,
    workTypePerformance,
    skillOpportunity,
    recommendations,
  } = analytics

  return (
    <div className="space-y-6">
      {/* 1. Overview KPIs */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
        <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold uppercase tracking-wider text-slate-500">Tracked Roles</span>
            <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-slate-100 text-slate-700">
              <Briefcase size={14} />
            </span>
          </div>
          <p className="mt-2 text-2xl font-black text-slate-900">{overview.trackedJobs}</p>
          <p className="mt-1 text-[11px] text-slate-400">Total job records</p>
        </div>

        <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold uppercase tracking-wider text-slate-500">Applications</span>
            <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-blue-50 text-blue-700">
              <Clock size={14} />
            </span>
          </div>
          <p className="mt-2 text-2xl font-black text-blue-700">{overview.totalApplications}</p>
          <p className="mt-1 text-[11px] text-slate-400">Active pipeline apps</p>
        </div>

        <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold uppercase tracking-wider text-slate-500">Interviews</span>
            <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-amber-50 text-amber-700">
              <CheckCircle2 size={14} />
            </span>
          </div>
          <p className="mt-2 text-2xl font-black text-amber-700">{overview.interviewCount}</p>
          <p className="mt-1 text-[11px] text-slate-400">Interview rounds</p>
        </div>

        <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold uppercase tracking-wider text-slate-500">Offers</span>
            <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-emerald-50 text-emerald-700">
              <Award size={14} />
            </span>
          </div>
          <p className="mt-2 text-2xl font-black text-emerald-700">{overview.offerCount}</p>
          <p className="mt-1 text-[11px] text-slate-400">Secured offers</p>
        </div>

        <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold uppercase tracking-wider text-slate-500">Interview Rate</span>
            <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-teal-50 text-teal-700">
              <Zap size={14} />
            </span>
          </div>
          <p className="mt-2 text-2xl font-black text-teal-700">
            {conversion.hasConversionData ? `${conversion.interviewRate}%` : 'N/A'}
          </p>
          <p className="mt-1 text-[11px] text-slate-400">App to interview</p>
        </div>
      </div>

      {/* 2. Conversion Flow & Visual Funnel */}
      <div className="grid gap-6 lg:grid-cols-3">
        {/* Visual Pipeline Funnel (2 Cols) */}
        <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-xs lg:col-span-2">
          <div className="flex items-center justify-between border-b border-slate-100 pb-4">
            <div>
              <h4 className="text-sm font-bold text-slate-900">Application Pipeline Funnel</h4>
              <p className="text-xs text-slate-500">
                Conversion dropoff from saved opportunities through offer stage.
              </p>
            </div>
            <div className="flex items-center gap-3 text-xs text-slate-500">
              <span className="inline-flex items-center gap-1 text-red-600 font-semibold">
                Rejected: {funnel.rejectedCount}
              </span>
              <span className="inline-flex items-center gap-1 text-slate-500 font-semibold">
                Withdrawn: {funnel.withdrawnCount}
              </span>
            </div>
          </div>

          <div className="mt-6 space-y-4">
            {funnel.stages.map((stg, idx) => (
              <div key={stg.id} className="space-y-1.5">
                <div className="flex items-center justify-between text-xs">
                  <span className="font-bold text-slate-800">{stg.name}</span>
                  <div className="flex items-center gap-2">
                    <span className="font-extrabold text-slate-900">{stg.count}</span>
                    <span className="text-[11px] font-semibold text-slate-400">
                      ({idx === 0 ? '100%' : `${stg.rate}% from prev`})
                    </span>
                  </div>
                </div>
                <div className="h-3 w-full overflow-hidden rounded-full bg-slate-100">
                  <div
                    className={`h-full rounded-full transition-all duration-500 ${stg.color}`}
                    style={{ width: `${Math.max(4, stg.rate)}%` }}
                  />
                </div>
              </div>
            ))}
          </div>

          {time.hasTimeData && (
            <div className="mt-5 flex items-center gap-2 rounded-lg bg-slate-50 px-3.5 py-2.5 text-xs text-slate-600 border border-slate-100">
              <Calendar size={14} className="text-teal-600" />
              <span>
                Average time in pipeline:{' '}
                <strong className="text-slate-900">{time.averageDaysInPipeline} days</strong> (across {time.sampleCount} recorded application dates).
              </span>
            </div>
          )}
        </div>

        {/* Step-by-Step Conversion Rates (1 Col) */}
        <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-xs flex flex-col justify-between">
          <div>
            <h4 className="text-sm font-bold text-slate-900">Conversion Milestones</h4>
            <p className="text-xs text-slate-500">Stage-to-stage transition rates.</p>

            <div className="mt-4 space-y-3">
              <div className="rounded-lg border border-slate-100 bg-slate-50/70 p-3">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-semibold text-slate-600">Application → Screening</span>
                  <span className="text-xs font-extrabold text-slate-900">
                    {conversion.hasConversionData ? `${conversion.screeningRate}%` : 'N/A'}
                  </span>
                </div>
              </div>

              <div className="rounded-lg border border-slate-100 bg-slate-50/70 p-3">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-semibold text-slate-600">Screening → Interview</span>
                  <span className="text-xs font-extrabold text-amber-700">
                    {conversion.hasConversionData ? `${conversion.screeningToInterviewRate}%` : 'N/A'}
                  </span>
                </div>
              </div>

              <div className="rounded-lg border border-slate-100 bg-slate-50/70 p-3">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-semibold text-slate-600">Interview → Offer</span>
                  <span className="text-xs font-extrabold text-emerald-700">
                    {conversion.hasConversionData ? `${conversion.interviewToOfferRate}%` : 'N/A'}
                  </span>
                </div>
              </div>

              <div className="rounded-lg border border-teal-100 bg-teal-50/60 p-3">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-teal-900">Total Application → Offer</span>
                  <span className="text-xs font-black text-teal-800">
                    {conversion.hasConversionData ? `${conversion.offerRate}%` : 'N/A'}
                  </span>
                </div>
              </div>
            </div>
          </div>

          <div className="mt-4 rounded-lg bg-slate-50 p-3 text-[11px] text-slate-500">
            <span className="font-semibold text-slate-700">Note:</span> Computed deterministically from your authenticated pipeline history.
          </div>
        </div>
      </div>

      {/* 3. ATS Match Correlation Matrix */}
      <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-xs">
        <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between border-b border-slate-100 pb-4">
          <div>
            <div className="flex items-center gap-2">
              <h4 className="text-sm font-bold text-slate-900">ATS Match Score vs Observed Outcomes</h4>
              <span className="rounded bg-teal-100 px-2 py-0.5 text-[10px] font-bold text-teal-800 uppercase">
                Observational
              </span>
            </div>
            <p className="text-xs text-slate-500">
              Correlates ATS match scores with interview invitations and offers across your tracked applications.
            </p>
          </div>

          {atsOutcome.hasAtsData && (
            <div className="flex items-center gap-2 rounded-lg bg-teal-50 px-3 py-1.5 text-xs font-bold text-teal-800 border border-teal-100">
              <ShieldCheck size={14} className="text-teal-600" />
              <span>Avg ATS Score: {atsOutcome.averageAtsScore}%</span>
            </div>
          )}
        </div>

        <div className="mt-4 overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="border-b border-slate-200 text-slate-500 font-bold uppercase tracking-wider text-[10px]">
                <th className="pb-2">ATS Score Band</th>
                <th className="pb-2">Applications</th>
                <th className="pb-2">Interviews</th>
                <th className="pb-2">Offers</th>
                <th className="pb-2">Rejected</th>
                <th className="pb-2 text-right">Interview Rate</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {atsOutcome.scoreBands.map((band) => (
                <tr key={band.name} className="hover:bg-slate-50/60">
                  <td className="py-2.5 font-bold text-slate-800">{band.name}</td>
                  <td className="py-2.5 text-slate-600">{band.total}</td>
                  <td className="py-2.5 font-semibold text-amber-700">{band.interviews}</td>
                  <td className="py-2.5 font-semibold text-emerald-700">{band.offers}</td>
                  <td className="py-2.5 text-red-600">{band.rejected}</td>
                  <td className="py-2.5 text-right font-extrabold text-slate-900">
                    {band.total > 0 ? `${band.interviewRate}%` : 'N/A'}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <div className="mt-3 flex items-center gap-1.5 text-[11px] text-slate-400">
          <Info size={12} />
          <span>
            Observational correlation based on your current records. ATS match does not guarantee recruiter decisions.
          </span>
        </div>
      </div>

      {/* 4. Resume & Source Performance */}
      <div className="grid gap-6 lg:grid-cols-2">
        {/* Resume Version Performance */}
        <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-xs">
          <div className="border-b border-slate-100 pb-3">
            <h4 className="text-sm font-bold text-slate-900">Performance by Resume Version</h4>
            <p className="text-xs text-slate-500">Track which resume styles generate more interview conversions.</p>
          </div>

          <div className="mt-4 overflow-x-auto">
            {resumePerformance.hasResumeData ? (
              <table className="w-full text-left text-xs">
                <thead>
                  <tr className="border-b border-slate-200 text-slate-500 font-bold uppercase tracking-wider text-[10px]">
                    <th className="pb-2">Resume</th>
                    <th className="pb-2">Apps</th>
                    <th className="pb-2">Interviews</th>
                    <th className="pb-2">Offers</th>
                    <th className="pb-2 text-right">Interview %</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {resumePerformance.resumes.map((r) => (
                    <tr key={r.resumeId} className="hover:bg-slate-50/60">
                      <td className="py-2.5 font-bold text-slate-800">{r.title}</td>
                      <td className="py-2.5 text-slate-600">{r.applicationCount}</td>
                      <td className="py-2.5 text-amber-700 font-semibold">{r.interviewCount}</td>
                      <td className="py-2.5 text-emerald-700 font-semibold">{r.offerCount}</td>
                      <td className="py-2.5 text-right font-extrabold text-slate-900">{r.interviewRate}%</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            ) : (
              <p className="py-6 text-center text-xs text-slate-400">No applications linked to resumes yet.</p>
            )}
          </div>
        </div>

        {/* Job Source Performance */}
        <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-xs">
          <div className="border-b border-slate-100 pb-3">
            <h4 className="text-sm font-bold text-slate-900">Performance by Job Source</h4>
            <p className="text-xs text-slate-500">Effectiveness across job boards, portals, and referral channels.</p>
          </div>

          <div className="mt-4 overflow-x-auto">
            {sourcePerformance.hasSourceData ? (
              <table className="w-full text-left text-xs">
                <thead>
                  <tr className="border-b border-slate-200 text-slate-500 font-bold uppercase tracking-wider text-[10px]">
                    <th className="pb-2">Source</th>
                    <th className="pb-2">Apps</th>
                    <th className="pb-2">Interviews</th>
                    <th className="pb-2">Offers</th>
                    <th className="pb-2 text-right">Conversion %</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {sourcePerformance.sources.map((s) => (
                    <tr key={s.source} className="hover:bg-slate-50/60">
                      <td className="py-2.5 font-bold text-slate-800">{s.source}</td>
                      <td className="py-2.5 text-slate-600">{s.applicationCount}</td>
                      <td className="py-2.5 text-amber-700 font-semibold">{s.interviewCount}</td>
                      <td className="py-2.5 text-emerald-700 font-semibold">{s.offerCount}</td>
                      <td className="py-2.5 text-right font-extrabold text-slate-900">{s.interviewRate}%</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            ) : (
              <p className="py-6 text-center text-xs text-slate-400">No job source data recorded.</p>
            )}
          </div>
        </div>
      </div>

      {/* 5. Skill Opportunity Analysis */}
      <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-xs">
        <div className="border-b border-slate-100 pb-3">
          <div className="flex items-center gap-2">
            <h4 className="text-sm font-bold text-slate-900">Skill Opportunity Matrix</h4>
            <span className="rounded bg-slate-100 px-2 py-0.5 text-[10px] font-bold text-slate-700">
              {skillOpportunity.totalTargetSkills} total competencies analyzed
            </span>
          </div>
          <p className="text-xs text-slate-500">
            Compares skills demanded across your tracked jobs against your verified Career Profile skills.
          </p>
        </div>

        <div className="mt-4 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {/* Frequently Requested */}
          <div className="rounded-lg border border-slate-200 bg-slate-50/70 p-3.5">
            <span className="text-[11px] font-bold uppercase tracking-wider text-slate-600 block mb-2">
              Most Requested
            </span>
            <div className="space-y-2">
              {skillOpportunity.frequentlyRequested.slice(0, 5).map((s) => (
                <div key={s.name} className="flex items-center justify-between text-xs">
                  <span className="font-semibold text-slate-800 truncate max-w-[130px]">{s.name}</span>
                  <span className="rounded bg-white px-2 py-0.5 text-[10px] font-bold text-slate-700 border border-slate-200">
                    {s.jobCount} roles
                  </span>
                </div>
              ))}
            </div>
          </div>

          {/* Strong Matches */}
          <div className="rounded-lg border border-emerald-200 bg-emerald-50/50 p-3.5">
            <span className="text-[11px] font-bold uppercase tracking-wider text-emerald-800 block mb-2">
              Verified Strengths
            </span>
            <div className="space-y-2">
              {skillOpportunity.strongSkills.length > 0 ? (
                skillOpportunity.strongSkills.slice(0, 5).map((s) => (
                  <div key={s.name} className="flex items-center justify-between text-xs">
                    <span className="font-semibold text-emerald-900 truncate max-w-[130px]">{s.name}</span>
                    <span className="text-[10px] font-bold text-emerald-700">{s.proficiency}</span>
                  </div>
                ))
              ) : (
                <p className="text-[11px] text-slate-400">Add advanced skills to profile.</p>
              )}
            </div>
          </div>

          {/* Developing Skills */}
          <div className="rounded-lg border border-amber-200 bg-amber-50/50 p-3.5">
            <span className="text-[11px] font-bold uppercase tracking-wider text-amber-800 block mb-2">
              Developing in Demand
            </span>
            <div className="space-y-2">
              {skillOpportunity.developingSkills.length > 0 ? (
                skillOpportunity.developingSkills.slice(0, 5).map((s) => (
                  <div key={s.name} className="flex items-center justify-between text-xs">
                    <span className="font-semibold text-amber-900 truncate max-w-[130px]">{s.name}</span>
                    <span className="text-[10px] font-bold text-amber-700">{s.jobCount} roles</span>
                  </div>
                ))
              ) : (
                <p className="text-[11px] text-slate-400">No developing skill gaps.</p>
              )}
            </div>
          </div>

          {/* Missing Skills */}
          <div className="rounded-lg border border-red-200 bg-red-50/50 p-3.5">
            <span className="text-[11px] font-bold uppercase tracking-wider text-red-800 block mb-2">
              Missing Target Skills
            </span>
            <div className="space-y-2">
              {skillOpportunity.missingSkills.length > 0 ? (
                skillOpportunity.missingSkills.slice(0, 5).map((s) => (
                  <div key={s.name} className="flex items-center justify-between text-xs">
                    <span className="font-semibold text-red-900 truncate max-w-[130px]">{s.name}</span>
                    <span className="text-[10px] font-bold text-red-700">{s.jobCount} roles</span>
                  </div>
                ))
              ) : (
                <p className="text-[11px] text-slate-400">Profile covers all target skills!</p>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* 6. Actionable Career Recommendations */}
      <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-xs">
        <div className="flex items-center gap-2 border-b border-slate-100 pb-3">
          <Sparkles size={16} className="text-teal-600" />
          <h4 className="text-sm font-bold text-slate-900">Deterministic Career Recommendations</h4>
        </div>

        <div className="mt-4 grid gap-3 sm:grid-cols-2">
          {recommendations.map((rec) => (
            <div
              key={rec.id}
              className="flex flex-col justify-between rounded-xl border border-slate-200 bg-slate-50/50 p-4 hover:bg-slate-50 transition"
            >
              <div>
                <div className="flex items-center justify-between">
                  <span className="rounded bg-teal-100 px-2 py-0.5 text-[10px] font-bold text-teal-800 uppercase">
                    {rec.tag}
                  </span>
                  <span className={`text-[10px] font-bold uppercase ${
                    rec.priority === 'high' ? 'text-red-700' : rec.priority === 'medium' ? 'text-amber-700' : 'text-slate-500'
                  }`}>
                    {rec.priority} priority
                  </span>
                </div>
                <h5 className="mt-2 text-xs font-bold text-slate-900">{rec.title}</h5>
                <p className="mt-1 text-[11px] text-slate-600 leading-relaxed">{rec.description}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
