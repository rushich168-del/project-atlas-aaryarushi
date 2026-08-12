import { X, Target, Sparkles, AlertCircle, CheckCircle2, RefreshCw } from 'lucide-react'
import { MatchScoreCard } from './MatchScoreCard.jsx'
import { SkillMatchMatrix } from './SkillMatchMatrix.jsx'
import { KeywordAnalysis } from './KeywordAnalysis.jsx'
import { ResumeRecommendation } from './ResumeRecommendation.jsx'

export function JobMatchAnalyzer({ job, analysis, onClose, onAttachResume }) {
  if (!analysis) return null

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-xs p-4 overflow-y-auto">
      <div className="relative w-full max-w-4xl rounded-2xl bg-white shadow-2xl border border-slate-200 max-h-[90vh] flex flex-col my-auto">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-slate-100 p-6">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-teal-50 text-teal-700">
              <Target size={20} />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="rounded bg-teal-100 px-2 py-0.5 text-[10px] font-bold text-teal-800 uppercase">
                  ATS Match Intelligence
                </span>
                <span className="text-xs font-semibold text-slate-500">{job.company}</span>
              </div>
              <h3 className="text-lg font-black text-slate-900">{job.title}</h3>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="rounded-lg p-2 text-slate-400 hover:bg-slate-100 hover:text-slate-700"
            title="Close Analysis"
          >
            <X size={18} />
          </button>
        </div>

        {/* Scrollable Body */}
        <div className="p-6 overflow-y-auto space-y-6">
          {/* 1. Top ATS Score Breakdown */}
          <MatchScoreCard analysis={analysis} />

          {/* 2. Skills Match Classification */}
          <SkillMatchMatrix
            matchedSkills={analysis.matchedSkills}
            developingSkills={analysis.developingSkills}
            missingSkills={analysis.missingSkills}
          />

          {/* 3. Keyword Optimization */}
          <KeywordAnalysis
            matchedKeywords={analysis.matchedKeywords}
            missingKeywords={analysis.missingKeywords}
          />

          {/* 4. Best Recommended Resume */}
          <ResumeRecommendation
            recommendedResume={analysis.recommendedResume}
            onSelectResume={onAttachResume}
          />

          {/* 5. Actionable Improvement Plan */}
          {analysis.recommendations && analysis.recommendations.length > 0 && (
            <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
              <h4 className="text-sm font-bold text-slate-900">Recommended Optimization Plan</h4>
              <p className="text-xs text-slate-500">Concrete actions to raise your ATS score and interview likelihood.</p>
              <div className="mt-4 space-y-2">
                {analysis.recommendations.map((rec, idx) => (
                  <div key={idx} className="flex items-start gap-2.5 rounded-lg border border-slate-100 bg-slate-50 p-3 text-xs leading-5 text-slate-700">
                    <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-teal-600 text-white font-bold text-[10px]">
                      {idx + 1}
                    </span>
                    <span>{rec}</span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between border-t border-slate-100 p-4 bg-slate-50 rounded-b-2xl">
          <span className="text-[11px] text-slate-400">Deterministic ATS engine • No external LLM data leakage</span>
          <button
            type="button"
            onClick={onClose}
            className="rounded-lg bg-teal-600 px-5 py-2 text-xs font-bold text-white shadow-sm hover:bg-teal-700 transition"
          >
            Done & Apply Insights
          </button>
        </div>
      </div>
    </div>
  )
}
