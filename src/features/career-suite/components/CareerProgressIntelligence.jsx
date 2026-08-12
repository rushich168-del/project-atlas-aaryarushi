import { useState } from 'react'
import {
  TrendingUp,
  Target,
  Sparkles,
  Award,
  CheckCircle2,
  AlertCircle,
  Clock,
  ArrowRight,
  ShieldCheck,
  Zap,
  Info,
  Layers,
  ChevronRight,
  BookOpen,
  Briefcase,
  Play,
  RotateCw,
} from 'lucide-react'

export function CareerProgressIntelligence({
  progressIntelligence,
  onUpdateStatus,
  onNavigateToRoadmap,
  onNavigateToInterview,
  onNavigateToJobs,
}) {
  if (!progressIntelligence) return null

  const { targetRole, priorities, progress, smartMilestones, signals, nextActions, topPriority } =
    progressIntelligence

  return (
    <div className="space-y-6">
      {/* 1. Readiness & Progress Strip */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold uppercase tracking-wider text-slate-500">
              Roadmap Completion
            </span>
            <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-teal-50 text-teal-700">
              <TrendingUp size={14} />
            </span>
          </div>
          <p className="mt-2 text-2xl font-black text-slate-900">{progress.overallCompletionRate}%</p>
          <p className="mt-1 text-[11px] text-slate-400">
            {progress.completedCount} of {progress.totalMilestones} milestones completed
          </p>
        </div>

        <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold uppercase tracking-wider text-slate-500">
              Critical Skill Readiness
            </span>
            <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-red-50 text-red-700">
              <Zap size={14} />
            </span>
          </div>
          <p className="mt-2 text-2xl font-black text-red-700">{progress.criticalReadiness}%</p>
          <p className="mt-1 text-[11px] text-slate-400">Critical role requirements met</p>
        </div>

        <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold uppercase tracking-wider text-slate-500">
              High-Priority Readiness
            </span>
            <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-amber-50 text-amber-700">
              <ShieldCheck size={14} />
            </span>
          </div>
          <p className="mt-2 text-2xl font-black text-amber-700">{progress.highReadiness}%</p>
          <p className="mt-1 text-[11px] text-slate-400">High-importance skills verified</p>
        </div>

        <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold uppercase tracking-wider text-slate-500">
              Active Milestones
            </span>
            <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-blue-50 text-blue-700">
              <Clock size={14} />
            </span>
          </div>
          <p className="mt-2 text-2xl font-black text-blue-700">{progress.inProgressCount}</p>
          <p className="mt-1 text-[11px] text-slate-400">Milestones currently in progress</p>
        </div>
      </div>

      {/* 2. "What Should I Work On Next?" — Smart Priority Cards */}
      <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-xs">
        <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between border-b border-slate-100 pb-4">
          <div>
            <div className="flex items-center gap-2">
              <Sparkles size={16} className="text-teal-600" />
              <h4 className="text-sm font-bold text-slate-900">What Should I Work On Next?</h4>
              <span className="rounded bg-teal-100 px-2 py-0.5 text-[10px] font-bold text-teal-800 uppercase">
                Deterministic Recommendation
              </span>
            </div>
            <p className="text-xs text-slate-500">
              Ranked dynamically by role requirements, tracked job demand, and interview feedback.
            </p>
          </div>
        </div>

        <div className="mt-6 grid gap-4 lg:grid-cols-3">
          {priorities.slice(0, 3).map((item) => (
            <div
              key={item.skillName}
              className="flex flex-col justify-between rounded-xl border border-slate-200 bg-slate-50/60 p-5 hover:border-teal-300 hover:bg-white transition"
            >
              <div>
                <div className="flex items-center justify-between">
                  <span className={`rounded border px-2 py-0.5 text-[10px] font-bold uppercase ${item.priorityColor}`}>
                    {item.priorityLevel} Priority
                  </span>
                  <span className="text-xs font-black text-slate-800">
                    Score: {item.priorityScore}/100
                  </span>
                </div>

                <h5 className="mt-3 text-sm font-bold text-slate-900">{item.skillName}</h5>
                <p className="mt-1 text-[11px] font-semibold text-teal-800">
                  {item.userProficiency} → {item.requiredProficiency} ({item.importance} Requirement)
                </p>

                <div className="mt-3 space-y-1.5 border-t border-slate-100 pt-3">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block mb-1">
                    Why this is prioritized:
                  </span>
                  {item.reasons.map((r, rIdx) => (
                    <div key={rIdx} className="flex items-start gap-1.5 text-[11px] text-slate-600">
                      <span className="text-teal-600 font-bold">•</span>
                      <span>{r}</span>
                    </div>
                  ))}
                </div>
              </div>

              <div className="mt-5 flex items-center gap-2 border-t border-slate-100 pt-3">
                <button
                  type="button"
                  onClick={onNavigateToRoadmap}
                  className="inline-flex w-full items-center justify-center gap-1 rounded-lg bg-teal-600 px-3 py-1.5 text-xs font-bold text-white hover:bg-teal-700 transition"
                >
                  <Play size={12} />
                  Roadmap Milestone
                </button>
                <button
                  type="button"
                  onClick={onNavigateToInterview}
                  className="inline-flex items-center justify-center rounded-lg border border-slate-200 bg-white p-1.5 text-slate-700 hover:bg-slate-50 transition"
                  title="Practice interview questions"
                >
                  <BookOpen size={14} />
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* 3. Skill Progress & Opportunity Matrix */}
      <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-xs">
        <div className="flex items-center justify-between border-b border-slate-100 pb-4">
          <div>
            <h4 className="text-sm font-bold text-slate-900">Skill Priority Matrix — {targetRole}</h4>
            <p className="text-xs text-slate-500">
              Evaluates competency gaps against actual market occurrences in your tracked opportunity pipeline.
            </p>
          </div>
          <span className="text-xs font-semibold text-slate-400">
            {priorities.length} competencies tracked
          </span>
        </div>

        <div className="mt-4 overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="border-b border-slate-200 text-slate-500 font-bold uppercase tracking-wider text-[10px]">
                <th className="pb-2">Skill / Competency</th>
                <th className="pb-2">Current</th>
                <th className="pb-2">Required</th>
                <th className="pb-2">Status</th>
                <th className="pb-2">Tracked Jobs</th>
                <th className="pb-2">Interview Readiness</th>
                <th className="pb-2 text-right">Priority Score</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {priorities.map((item) => (
                <tr key={item.skillName} className="hover:bg-slate-50/60">
                  <td className="py-2.5 font-bold text-slate-800">{item.skillName}</td>
                  <td className="py-2.5 text-slate-600">{item.userProficiency}</td>
                  <td className="py-2.5 font-semibold text-slate-700">{item.requiredProficiency}</td>
                  <td className="py-2.5">
                    <span
                      className={`rounded px-1.5 py-0.5 text-[10px] font-bold uppercase ${
                        item.gapStatus === 'Strong'
                          ? 'bg-emerald-100 text-emerald-800'
                          : item.gapStatus === 'Developing'
                          ? 'bg-amber-100 text-amber-800'
                          : 'bg-red-100 text-red-800'
                      }`}
                    >
                      {item.gapStatus}
                    </span>
                  </td>
                  <td className="py-2.5 text-slate-600">
                    {item.jobCount > 0 ? `${item.jobCount} roles` : '0 roles'}
                  </td>
                  <td className="py-2.5 text-slate-600">{item.interviewStatus}</td>
                  <td className="py-2.5 text-right font-black text-slate-900">
                    <span className={`rounded border px-2 py-0.5 text-[11px] font-bold ${item.priorityColor}`}>
                      {item.priorityScore}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* 4. Progress Signals & Feedback Loops */}
      <div className="grid gap-6 lg:grid-cols-2">
        {/* Positive & Attention Growth Signals */}
        <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-xs">
          <div className="border-b border-slate-100 pb-3">
            <h4 className="text-sm font-bold text-slate-900">Progress Signals & Milestone Alerts</h4>
            <p className="text-xs text-slate-500">Deterministic signals derived from your recent activity.</p>
          </div>

          <div className="mt-4 space-y-3">
            {signals.positiveSignals.map((s, idx) => (
              <div key={idx} className="flex items-start gap-2.5 rounded-lg border border-emerald-100 bg-emerald-50/50 p-3 text-xs text-emerald-900">
                <CheckCircle2 size={15} className="text-emerald-600 shrink-0 mt-0.5" />
                <span>{s}</span>
              </div>
            ))}

            {signals.attentionSignals.map((s, idx) => (
              <div key={idx} className="flex items-start gap-2.5 rounded-lg border border-amber-100 bg-amber-50/50 p-3 text-xs text-amber-900">
                <AlertCircle size={15} className="text-amber-600 shrink-0 mt-0.5" />
                <span>{s}</span>
              </div>
            ))}

            {signals.positiveSignals.length === 0 && signals.attentionSignals.length === 0 && (
              <p className="py-4 text-center text-xs text-slate-400">No active progress signals.</p>
            )}
          </div>
        </div>

        {/* Application & Interview Feedback Loops */}
        <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-xs">
          <div className="border-b border-slate-100 pb-3">
            <h4 className="text-sm font-bold text-slate-900">Application & Interview Feedback</h4>
            <p className="text-xs text-slate-500">Correlates opportunity pipeline requirements with practice status.</p>
          </div>

          <div className="mt-4 space-y-3">
            {signals.applicationSignals.map((s, idx) => (
              <div key={idx} className="flex items-start gap-2.5 rounded-lg border border-blue-100 bg-blue-50/50 p-3 text-xs text-blue-900">
                <Briefcase size={15} className="text-blue-600 shrink-0 mt-0.5" />
                <span>{s}</span>
              </div>
            ))}

            {signals.applicationSignals.length === 0 && (
              <div className="rounded-lg border border-slate-100 bg-slate-50/60 p-4 text-xs text-slate-500">
                Track active applications and complete interview practice questions to populate targeted feedback loops.
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
