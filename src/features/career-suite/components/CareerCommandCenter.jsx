import { useState } from 'react'
import {
  Compass,
  Target,
  Sparkles,
  Zap,
  CheckCircle2,
  AlertCircle,
  Clock,
  ArrowRight,
  TrendingUp,
  Award,
  Briefcase,
  FileText,
  BrainCircuit,
  BookOpen,
  Calendar,
  Layers,
  ChevronRight,
  ExternalLink,
  ShieldCheck,
  Flame,
  Plus,
} from 'lucide-react'
import { useCareerCommandCenter } from '../hooks/useCareerCommandCenter.js'

export function CareerCommandCenter({ onNavigate }) {
  const {
    targetRole,
    readiness,
    attentionItems,
    topJobMatches,
    skillBlockers,
    weeklyPlan,
    nextBestActions,
    primaryAction,
    summary,
    loading,
  } = useCareerCommandCenter()

  if (loading && !readiness) {
    return (
      <div className="flex min-h-[350px] items-center justify-center rounded-xl border border-slate-200 bg-white p-12 text-slate-500">
        <div className="flex items-center gap-3 text-sm font-semibold">
          <div className="h-5 w-5 animate-spin rounded-full border-2 border-teal-600 border-t-transparent" />
          <span>Synchronizing Career Command Center...</span>
        </div>
      </div>
    )
  }

  const {
    overallScore = 0,
    skillReadiness = 0,
    resumeReadiness = 0,
    pipelineReadiness = 0,
    interviewReadiness = 0,
    portfolioReadiness = 0,
    details = {},
  } = readiness || {}

  return (
    <div className="space-y-6">
      {/* 1. HERO / CAREER STATUS */}
      <div className="relative overflow-hidden rounded-2xl border border-teal-100 bg-gradient-to-br from-teal-900 via-teal-800 to-slate-900 p-6 sm:p-8 text-white shadow-md">
        <div className="relative z-10 flex flex-col justify-between gap-6 lg:flex-row lg:items-center">
          <div className="max-w-2xl space-y-2">
            <div className="inline-flex items-center gap-2 rounded-full border border-teal-400/30 bg-teal-500/20 px-3 py-1 text-xs font-semibold text-teal-200 backdrop-blur-sm">
              <Compass size={14} className="text-teal-300" />
              <span>Personal Career Command Center</span>
            </div>
            <h2 className="text-2xl sm:text-3xl font-black tracking-tight text-white">
              Target Role: <span className="text-teal-300">{targetRole}</span>
            </h2>
            <p className="text-xs sm:text-sm text-teal-100/80 leading-relaxed">
              Your centralized career operating system. Track market readiness, resolve skill blockers, prepare for active interviews, and execute high-leverage application actions.
            </p>
          </div>

          <div className="flex items-center gap-5 rounded-xl border border-teal-500/30 bg-white/10 p-4 sm:p-5 backdrop-blur-md">
            <div className="text-right">
              <span className="text-[11px] font-bold uppercase tracking-wider text-teal-200 block">
                Overall Career Readiness
              </span>
              <span className="text-3xl sm:text-4xl font-black text-white">{overallScore}</span>
              <span className="text-sm font-bold text-teal-300">/100</span>
              <p className="text-[10px] text-teal-200/70 mt-0.5">
                {overallScore >= 75 ? 'Market Ready' : overallScore >= 50 ? 'Strong Foundation' : 'Progression Stage'}
              </p>
            </div>
            <div className="h-14 w-1.5 rounded-full bg-white/20">
              <div
                className="w-full rounded-full bg-teal-400 transition-all duration-700"
                style={{ height: `${overallScore}%` }}
              />
            </div>
          </div>
        </div>
      </div>

      {/* 2. READINESS MULTI-GAUGE */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
        {/* Skills */}
        <div
          onClick={() => onNavigate?.('skills')}
          className="group cursor-pointer rounded-xl border border-slate-200 bg-white p-4 shadow-xs transition hover:border-teal-500 hover:shadow-sm"
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-700">Skills Readiness</span>
            <span className="rounded-lg bg-teal-50 p-1.5 text-teal-700">
              <BrainCircuit size={14} />
            </span>
          </div>
          <p className="mt-2 text-xl font-black text-slate-900">{skillReadiness}%</p>
          <div className="mt-2 h-1.5 w-full rounded-full bg-slate-100">
            <div className="h-1.5 rounded-full bg-teal-600" style={{ width: `${skillReadiness}%` }} />
          </div>
          <p className="mt-2 text-[10px] text-slate-500">
            {details.strongSkills || 0} of {details.totalRequiredSkills || 0} required skills met
          </p>
        </div>

        {/* Resumes */}
        <div
          onClick={() => onNavigate?.('resume')}
          className="group cursor-pointer rounded-xl border border-slate-200 bg-white p-4 shadow-xs transition hover:border-teal-500 hover:shadow-sm"
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-700">Resume Readiness</span>
            <span className="rounded-lg bg-blue-50 p-1.5 text-blue-700">
              <FileText size={14} />
            </span>
          </div>
          <p className="mt-2 text-xl font-black text-slate-900">{resumeReadiness}%</p>
          <div className="mt-2 h-1.5 w-full rounded-full bg-slate-100">
            <div className="h-1.5 rounded-full bg-blue-600" style={{ width: `${resumeReadiness}%` }} />
          </div>
          <p className="mt-2 text-[10px] text-slate-500">
            {details.resumesCount > 0 ? `${details.resumesCount} tailored version(s)` : 'No resume created'}
          </p>
        </div>

        {/* Pipeline */}
        <div
          onClick={() => onNavigate?.('jobs')}
          className="group cursor-pointer rounded-xl border border-slate-200 bg-white p-4 shadow-xs transition hover:border-teal-500 hover:shadow-sm"
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-700">Pipeline Health</span>
            <span className="rounded-lg bg-amber-50 p-1.5 text-amber-700">
              <Briefcase size={14} />
            </span>
          </div>
          <p className="mt-2 text-xl font-black text-slate-900">{pipelineReadiness}%</p>
          <div className="mt-2 h-1.5 w-full rounded-full bg-slate-100">
            <div className="h-1.5 rounded-full bg-amber-600" style={{ width: `${pipelineReadiness}%` }} />
          </div>
          <p className="mt-2 text-[10px] text-slate-500">
            {details.activeApplications || 0} active role(s) tracked (Goal: 5)
          </p>
        </div>

        {/* Interview */}
        <div
          onClick={() => onNavigate?.('skills')}
          className="group cursor-pointer rounded-xl border border-slate-200 bg-white p-4 shadow-xs transition hover:border-teal-500 hover:shadow-sm"
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-700">Interview Prep</span>
            <span className="rounded-lg bg-purple-50 p-1.5 text-purple-700">
              <BookOpen size={14} />
            </span>
          </div>
          <p className="mt-2 text-xl font-black text-slate-900">{interviewReadiness}%</p>
          <div className="mt-2 h-1.5 w-full rounded-full bg-slate-100">
            <div className="h-1.5 rounded-full bg-purple-600" style={{ width: `${interviewReadiness}%` }} />
          </div>
          <p className="mt-2 text-[10px] text-slate-500">
            {details.practicedQuestions || 0} practice session(s) completed
          </p>
        </div>

        {/* Portfolio */}
        <div
          onClick={() => onNavigate?.('portfolio')}
          className="group cursor-pointer rounded-xl border border-slate-200 bg-white p-4 shadow-xs transition hover:border-teal-500 hover:shadow-sm"
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-700">Portfolio & Bio</span>
            <span className="rounded-lg bg-emerald-50 p-1.5 text-emerald-700">
              <Award size={14} />
            </span>
          </div>
          <p className="mt-2 text-xl font-black text-slate-900">{portfolioReadiness}%</p>
          <div className="mt-2 h-1.5 w-full rounded-full bg-slate-100">
            <div className="h-1.5 rounded-full bg-emerald-600" style={{ width: `${portfolioReadiness}%` }} />
          </div>
          <p className="mt-2 text-[10px] text-slate-500">
            {details.publicProjectsCount || 0} project(s) • {details.hasPublishedSlug ? 'Published' : 'Unpublished'}
          </p>
        </div>
      </div>

      {/* 3. PRIMARY NEXT BEST ACTION HERO CARD */}
      {primaryAction && (
        <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-xs">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div className="space-y-1.5">
              <div className="flex items-center gap-2">
                <Sparkles size={16} className="text-teal-600" />
                <span className="text-xs font-bold uppercase tracking-wider text-teal-800">
                  Highest-Value Career Action
                </span>
                <span className={`rounded border px-2 py-0.5 text-[10px] font-extrabold uppercase ${primaryAction.priorityColor}`}>
                  {primaryAction.priority} PRIORITY
                </span>
              </div>
              <h3 className="text-lg font-bold text-slate-900">{primaryAction.title}</h3>
              <p className="text-xs text-slate-600 max-w-3xl">{primaryAction.reason}</p>
            </div>
            <button
              type="button"
              onClick={() => onNavigate?.(primaryAction.navigationTab || 'skills')}
              className="focus-ring inline-flex shrink-0 items-center justify-center gap-2 rounded-lg bg-teal-600 px-5 py-2.5 text-xs font-bold text-white shadow-sm transition hover:bg-teal-700"
            >
              <span>{primaryAction.actionLabel}</span>
              <ArrowRight size={14} />
            </button>
          </div>
        </div>
      )}

      {/* 4. APPLICATION ATTENTION RADAR & TOP ATS MATCHES */}
      <div className="grid gap-6 lg:grid-cols-2">
        {/* Application Attention Radar */}
        <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-xs flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div className="flex items-center gap-2">
                <Zap size={16} className="text-amber-600" />
                <h4 className="text-sm font-bold text-slate-900">Application Attention Radar</h4>
              </div>
              <span className="text-xs font-semibold text-slate-400">
                {attentionItems.length} alert(s)
              </span>
            </div>

            <div className="mt-4 space-y-3">
              {attentionItems.map((item) => (
                <div
                  key={item.id}
                  className="flex flex-col justify-between gap-3 rounded-lg border border-slate-100 bg-slate-50/60 p-4 transition hover:bg-white sm:flex-row sm:items-center"
                >
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <span className={`rounded border px-1.5 py-0.2 text-[10px] font-bold uppercase ${item.urgencyColor}`}>
                        {item.urgency}
                      </span>
                      <span className="text-xs font-bold text-slate-900">{item.title}</span>
                    </div>
                    <p className="text-[11px] text-slate-500">{item.reason}</p>
                  </div>
                  <button
                    type="button"
                    onClick={() => onNavigate?.(item.navigationTab || 'jobs')}
                    className="inline-flex shrink-0 items-center gap-1 rounded-md bg-white border border-slate-200 px-2.5 py-1.5 text-[11px] font-bold text-slate-700 shadow-2xs hover:bg-slate-50"
                  >
                    <span>{item.actionText}</span>
                    <ChevronRight size={12} />
                  </button>
                </div>
              ))}

              {attentionItems.length === 0 && (
                <div className="rounded-lg border border-dashed border-slate-200 p-8 text-center">
                  <CheckCircle2 size={24} className="mx-auto text-teal-600" />
                  <p className="mt-2 text-xs font-bold text-slate-800">All Applications on Track</p>
                  <p className="mt-1 text-[11px] text-slate-500">
                    No urgent follow-ups, interview deadlines, or stalled applications detected.
                  </p>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Top Job Matches */}
        <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-xs flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div className="flex items-center gap-2">
                <Target size={16} className="text-teal-600" />
                <h4 className="text-sm font-bold text-slate-900">Top Matched Opportunities</h4>
              </div>
              <button
                type="button"
                onClick={() => onNavigate?.('jobs')}
                className="text-xs font-semibold text-teal-700 hover:text-teal-800"
              >
                View Pipeline →
              </button>
            </div>

            <div className="mt-4 space-y-3">
              {topJobMatches.slice(0, 3).map((job) => (
                <div
                  key={job.jobId}
                  className="flex flex-col justify-between gap-3 rounded-lg border border-slate-100 bg-slate-50/60 p-4 transition hover:bg-white sm:flex-row sm:items-center"
                >
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <span className="flex h-6 w-6 items-center justify-center rounded-md bg-teal-100 text-[11px] font-bold text-teal-800">
                        {job.matchScore}%
                      </span>
                      <span className="text-xs font-bold text-slate-900">{job.title}</span>
                      <span className="text-[11px] text-slate-500">at {job.company}</span>
                    </div>
                    <p className="text-[11px] text-slate-500">
                      Recommended: <span className="font-semibold text-slate-700">{job.recommendedResumeTitle}</span> • {job.matchedSkills.length} matched skill(s)
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={() => onNavigate?.('jobs')}
                    className="inline-flex shrink-0 items-center gap-1 rounded-md bg-teal-600 px-2.5 py-1.5 text-[11px] font-bold text-white shadow-2xs hover:bg-teal-700"
                  >
                    <span>Assistant</span>
                    <ArrowRight size={12} />
                  </button>
                </div>
              ))}

              {topJobMatches.length === 0 && (
                <div className="rounded-lg border border-dashed border-slate-200 p-8 text-center">
                  <Briefcase size={24} className="mx-auto text-slate-400" />
                  <p className="mt-2 text-xs font-bold text-slate-800">No Opportunities Tracked Yet</p>
                  <p className="mt-1 text-[11px] text-slate-500">
                    Add target job descriptions to unlock deterministic ATS scoring and resume matching.
                  </p>
                  <button
                    type="button"
                    onClick={() => onNavigate?.('jobs')}
                    className="mt-4 inline-flex items-center gap-1.5 rounded-lg bg-teal-600 px-3 py-1.5 text-xs font-semibold text-white hover:bg-teal-700"
                  >
                    <Plus size={12} />
                    Track First Role
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* 5. SKILL BLOCKERS & 7-DAY ACTION PLAN */}
      <div className="grid gap-6 lg:grid-cols-2">
        {/* High-Impact Skill Blockers */}
        <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-xs">
          <div className="flex items-center justify-between border-b border-slate-100 pb-3">
            <div className="flex items-center gap-2">
              <Flame size={16} className="text-red-600" />
              <h4 className="text-sm font-bold text-slate-900">High-Impact Skill Blockers</h4>
            </div>
            <button
              type="button"
              onClick={() => onNavigate?.('skills')}
              className="text-xs font-semibold text-teal-700 hover:text-teal-800"
            >
              Open Roadmap →
            </button>
          </div>

          <div className="mt-4 space-y-3">
            {skillBlockers.map((blocker) => (
              <div
                key={blocker.skillName}
                className="flex items-center justify-between rounded-lg border border-slate-100 bg-slate-50/60 p-3.5 hover:bg-white transition"
              >
                <div>
                  <div className="flex items-center gap-2">
                    <span className={`rounded border px-1.5 py-0.2 text-[10px] font-bold uppercase ${blocker.priorityColor}`}>
                      {blocker.priorityLevel}
                    </span>
                    <h5 className="text-xs font-bold text-slate-900">{blocker.skillName}</h5>
                    <span className="text-[10px] font-semibold text-teal-800">
                      ({blocker.userProficiency} → {blocker.requiredProficiency})
                    </span>
                  </div>
                  <p className="mt-1 text-[11px] text-slate-500">{blocker.reason}</p>
                </div>
                <button
                  type="button"
                  onClick={() => onNavigate?.('skills')}
                  className="inline-flex shrink-0 items-center gap-1 rounded-md bg-white border border-slate-200 px-2.5 py-1 text-[11px] font-bold text-slate-700 hover:bg-slate-50"
                >
                  <span>Advance</span>
                  <ChevronRight size={12} />
                </button>
              </div>
            ))}

            {skillBlockers.length === 0 && (
              <div className="p-6 text-center text-xs text-slate-400">
                All role requirement skills verified at required proficiency level.
              </div>
            )}
          </div>
        </div>

        {/* Deterministic 7-Day Career Action Plan */}
        <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-xs">
          <div className="flex items-center justify-between border-b border-slate-100 pb-3">
            <div className="flex items-center gap-2">
              <Calendar size={16} className="text-teal-600" />
              <h4 className="text-sm font-bold text-slate-900">Deterministic 7-Day Career Plan</h4>
            </div>
            <span className="rounded bg-teal-50 px-2 py-0.5 text-[10px] font-bold uppercase text-teal-800">
              Weekly Sprint
            </span>
          </div>

          <div className="mt-4 space-y-3">
            {weeklyPlan.map((task, idx) => (
              <div
                key={idx}
                className="flex items-start gap-3 rounded-lg border border-slate-100 bg-slate-50/60 p-3.5 hover:bg-white transition"
              >
                <span className="shrink-0 rounded-md bg-teal-600 px-2 py-1 text-[10px] font-black text-white">
                  {task.days}
                </span>
                <div className="flex-1 space-y-0.5">
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] font-bold uppercase tracking-wider text-teal-800">
                      {task.category}
                    </span>
                    <span className="text-[10px] font-bold text-slate-400">{task.priority} Priority</span>
                  </div>
                  <h5 className="text-xs font-bold text-slate-900">{task.title}</h5>
                  <p className="text-[11px] text-slate-500">{task.description}</p>
                </div>
                <button
                  type="button"
                  onClick={() => onNavigate?.(task.navigationTab || 'skills')}
                  className="shrink-0 text-slate-400 hover:text-teal-600 transition pt-1"
                >
                  <ArrowRight size={14} />
                </button>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}
