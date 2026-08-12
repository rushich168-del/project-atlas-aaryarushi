import { useState, useMemo } from 'react'
import {
  BrainCircuit,
  Award,
  Target,
  Sparkles,
  CheckCircle2,
  AlertCircle,
  Clock,
  ChevronRight,
  BookOpen,
  Filter,
  Check,
  Edit3,
  HelpCircle,
  ArrowRight,
  TrendingUp,
  Flame,
  Zap,
} from 'lucide-react'
import { useSkillsInterview } from '../hooks/useSkillsInterview.js'
import { useCareerProgress } from '../hooks/useCareerProgress.js'
import { CareerProgressIntelligence } from './CareerProgressIntelligence.jsx'

export function SkillsInterviewTab() {
  const {
    availableRoles,
    selectedRole,
    setSelectedRole,
    skillGapAnalysis,
    roadmap,
    roadmapLoading,
    updateItemStatus,
    activeCategory,
    setActiveCategory,
    filteredQuestions,
    practiceSessions,
    savePractice,
  } = useSkillsInterview()

  const { progressIntelligence } = useCareerProgress()

  const [activeSubTab, setActiveSubTab] = useState('progress') // 'progress' | 'gap' | 'roadmap' | 'interview'
  const [matrixFilter, setMatrixFilter] = useState('all') // 'all' | 'Strong' | 'Developing' | 'Missing'

  // Practice Modal State
  const [practicingQuestion, setPracticingQuestion] = useState(null)
  const [userAnswer, setUserAnswer] = useState('')
  const [userNotes, setUserNotes] = useState('')
  const [practiceStatus, setPracticeStatus] = useState('practiced')

  function handleStartPractice(q) {
    const existing = practiceSessions.find((p) => p.question === q.question)
    setPracticingQuestion(q)
    setUserAnswer(existing?.answer || '')
    setUserNotes(existing?.notes || '')
    setPracticeStatus(existing?.status || 'practiced')
  }

  async function handleSavePracticeSubmit(e) {
    e.preventDefault()
    if (!practicingQuestion) return

    await savePractice({
      role_name: selectedRole,
      category: practicingQuestion.category,
      question: practicingQuestion.question,
      difficulty: practicingQuestion.difficulty,
      related_skill: practicingQuestion.related_skill,
      answer: userAnswer.trim(),
      status: practiceStatus,
      notes: userNotes.trim(),
    })

    setPracticingQuestion(null)
    setUserAnswer('')
    setUserNotes('')
  }

  const filteredMatrix = useMemo(() => {
    if (matrixFilter === 'all') return skillGapAnalysis.matrix
    return skillGapAnalysis.matrix.filter((m) => m.status === matrixFilter)
  }, [skillGapAnalysis.matrix, matrixFilter])

  return (
    <div className="space-y-6">
      {/* 1. Module Sub-Tab Switcher & Role Selector */}
      <div className="flex flex-col gap-4 rounded-xl border border-slate-200 bg-white p-5 shadow-sm sm:flex-row sm:items-center sm:justify-between">
        <div className="flex flex-wrap items-center gap-2">
          <button
            type="button"
            onClick={() => setActiveSubTab('progress')}
            className={`focus-ring inline-flex items-center gap-2 rounded-lg px-4 py-2 text-xs font-semibold transition ${
              activeSubTab === 'progress'
                ? 'bg-teal-600 text-white shadow-sm'
                : 'border border-slate-200 bg-slate-50 text-slate-700 hover:bg-slate-100'
            }`}
          >
            <Zap size={14} />
            Progress Intelligence
          </button>
          <button
            type="button"
            onClick={() => setActiveSubTab('gap')}
            className={`focus-ring inline-flex items-center gap-2 rounded-lg px-4 py-2 text-xs font-semibold transition ${
              activeSubTab === 'gap'
                ? 'bg-teal-600 text-white shadow-sm'
                : 'border border-slate-200 bg-slate-50 text-slate-700 hover:bg-slate-100'
            }`}
          >
            <BrainCircuit size={14} />
            Skill Gap Matrix
          </button>
          <button
            type="button"
            onClick={() => setActiveSubTab('roadmap')}
            className={`focus-ring inline-flex items-center gap-2 rounded-lg px-4 py-2 text-xs font-semibold transition ${
              activeSubTab === 'roadmap'
                ? 'bg-teal-600 text-white shadow-sm'
                : 'border border-slate-200 bg-slate-50 text-slate-700 hover:bg-slate-100'
            }`}
          >
            <TrendingUp size={14} />
            Career Roadmap
          </button>
          <button
            type="button"
            onClick={() => setActiveSubTab('interview')}
            className={`focus-ring inline-flex items-center gap-2 rounded-lg px-4 py-2 text-xs font-semibold transition ${
              activeSubTab === 'interview'
                ? 'bg-teal-600 text-white shadow-sm'
                : 'border border-slate-200 bg-slate-50 text-slate-700 hover:bg-slate-100'
            }`}
          >
            <Sparkles size={14} />
            Interview Preparation
          </button>
        </div>

        <div className="flex items-center gap-2">
          <span className="text-[11px] font-semibold text-slate-500">Target Role:</span>
          <select
            value={selectedRole}
            onChange={(e) => setSelectedRole(e.target.value)}
            className="rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-xs font-bold text-slate-800 outline-none focus:border-teal-500"
          >
            {availableRoles.map((role) => (
              <option key={role} value={role}>
                {role}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* 2. SUB-TAB 0: Career Progress Intelligence */}
      {activeSubTab === 'progress' && (
        <CareerProgressIntelligence
          progressIntelligence={progressIntelligence}
          onUpdateStatus={updateItemStatus}
          onNavigateToRoadmap={() => setActiveSubTab('roadmap')}
          onNavigateToInterview={() => setActiveSubTab('interview')}
          onNavigateToJobs={() => {}}
        />
      )}

      {/* 3. SUB-TAB A: Skill Gap Analysis */}
      {activeSubTab === 'gap' && (
        <div className="space-y-6">
          {/* Readiness Score & Summary Counters */}
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold uppercase tracking-wider text-slate-500">Readiness Score</span>
                <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-teal-50 text-teal-700">
                  <Target size={16} />
                </span>
              </div>
              <p className="mt-2 text-2xl font-extrabold text-teal-700">
                {skillGapAnalysis.overallScore}<span className="text-sm font-semibold text-slate-400">/100</span>
              </p>
              <div className="mt-2 h-1.5 w-full rounded-full bg-slate-100">
                <div
                  className="h-1.5 rounded-full bg-teal-500 transition-all duration-500"
                  style={{ width: `${skillGapAnalysis.overallScore}%` }}
                />
              </div>
            </div>

            <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold uppercase tracking-wider text-slate-500">Strong Skills</span>
                <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-emerald-50 text-emerald-700">
                  <CheckCircle2 size={16} />
                </span>
              </div>
              <p className="mt-2 text-2xl font-extrabold text-emerald-700">{skillGapAnalysis.strongCount}</p>
              <p className="mt-1 text-[11px] text-slate-500">Meets or exceeds target level</p>
            </div>

            <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold uppercase tracking-wider text-slate-500">Developing</span>
                <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-amber-50 text-amber-700">
                  <Flame size={16} />
                </span>
              </div>
              <p className="mt-2 text-2xl font-extrabold text-amber-700">{skillGapAnalysis.developingCount}</p>
              <p className="mt-1 text-[11px] text-slate-500">Needs proficiency upgrade</p>
            </div>

            <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold uppercase tracking-wider text-slate-500">Missing Skills</span>
                <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-red-50 text-red-700">
                  <AlertCircle size={16} />
                </span>
              </div>
              <p className="mt-2 text-2xl font-extrabold text-red-700">{skillGapAnalysis.missingCount}</p>
              <p className="mt-1 text-[11px] text-slate-500">Not in current Career Profile</p>
            </div>
          </div>

          {/* Skill Gap Matrix Table */}
          <div className="rounded-xl border border-slate-200 bg-white shadow-sm overflow-hidden">
            <div className="flex flex-col gap-3 border-b border-slate-100 p-5 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <h3 className="text-base font-bold text-slate-900">Skill Competency Comparison</h3>
                <p className="text-xs text-slate-500">Comparing your profile inventory against {selectedRole} requirements.</p>
              </div>

              <div className="flex items-center gap-1.5 rounded-lg border border-slate-200 bg-slate-50 p-1 text-xs">
                <button
                  type="button"
                  onClick={() => setMatrixFilter('all')}
                  className={`rounded px-2.5 py-1 font-semibold transition ${
                    matrixFilter === 'all' ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-600'
                  }`}
                >
                  All ({skillGapAnalysis.matrix.length})
                </button>
                <button
                  type="button"
                  onClick={() => setMatrixFilter('Strong')}
                  className={`rounded px-2.5 py-1 font-semibold transition ${
                    matrixFilter === 'Strong' ? 'bg-emerald-50 text-emerald-700 shadow-sm' : 'text-slate-600'
                  }`}
                >
                  Strong ({skillGapAnalysis.strongCount})
                </button>
                <button
                  type="button"
                  onClick={() => setMatrixFilter('Developing')}
                  className={`rounded px-2.5 py-1 font-semibold transition ${
                    matrixFilter === 'Developing' ? 'bg-amber-50 text-amber-700 shadow-sm' : 'text-slate-600'
                  }`}
                >
                  Developing ({skillGapAnalysis.developingCount})
                </button>
                <button
                  type="button"
                  onClick={() => setMatrixFilter('Missing')}
                  className={`rounded px-2.5 py-1 font-semibold transition ${
                    matrixFilter === 'Missing' ? 'bg-red-50 text-red-700 shadow-sm' : 'text-slate-600'
                  }`}
                >
                  Missing ({skillGapAnalysis.missingCount})
                </button>
              </div>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="border-b border-slate-100 bg-slate-50/70 text-slate-500 uppercase tracking-wider font-semibold">
                  <tr>
                    <th className="px-5 py-3">Skill Competency</th>
                    <th className="px-4 py-3">Category</th>
                    <th className="px-4 py-3">Required Level</th>
                    <th className="px-4 py-3">Your Profile Level</th>
                    <th className="px-4 py-3">Evaluation Status</th>
                    <th className="px-4 py-3">Importance</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {filteredMatrix.map((item, idx) => (
                    <tr key={idx} className="hover:bg-slate-50/50">
                      <td className="px-5 py-3.5 font-bold text-slate-900">{item.skill_name}</td>
                      <td className="px-4 py-3.5 text-slate-600">{item.category}</td>
                      <td className="px-4 py-3.5 font-medium text-slate-800">{item.required_proficiency}</td>
                      <td className="px-4 py-3.5 font-medium text-slate-800">
                        {item.user_proficiency === 'None' ? (
                          <span className="text-slate-400 italic">Not Added</span>
                        ) : (
                          item.user_proficiency
                        )}
                      </td>
                      <td className="px-4 py-3.5">
                        <span className={`inline-flex items-center gap-1 rounded border px-2 py-0.5 text-[10px] font-bold uppercase ${
                          item.status === 'Strong'
                            ? 'border-emerald-200 bg-emerald-50 text-emerald-700'
                            : item.status === 'Developing'
                            ? 'border-amber-200 bg-amber-50 text-amber-700'
                            : 'border-red-200 bg-red-50 text-red-700'
                        }`}>
                          {item.status === 'Strong' && <CheckCircle2 size={11} />}
                          {item.status === 'Developing' && <Flame size={11} />}
                          {item.status === 'Missing' && <AlertCircle size={11} />}
                          {item.status}
                        </span>
                      </td>
                      <td className="px-4 py-3.5">
                        <span className={`font-semibold ${
                          item.importance === 'Critical' ? 'text-red-600' : 'text-slate-700'
                        }`}>
                          {item.importance}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* 3. SUB-TAB B: Career Roadmap */}
      {activeSubTab === 'roadmap' && (
        <div className="space-y-6">
          <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
            <div className="flex items-center justify-between border-b border-slate-100 pb-4">
              <div>
                <h3 className="text-base font-bold text-slate-900">{roadmap?.title || 'Learning Roadmap'}</h3>
                <p className="text-xs text-slate-500">Sequential milestones dynamically generated to close identified skill gaps.</p>
              </div>
              <span className="inline-flex items-center gap-1.5 rounded-full bg-teal-50 px-3 py-1 text-xs font-semibold text-teal-700 border border-teal-200">
                <CheckCircle2 size={14} />
                {roadmap?.items?.filter((i) => i.status === 'completed').length || 0} / {roadmap?.items?.length || 0} Milestones Completed
              </span>
            </div>

            <div className="mt-6 space-y-4">
              {roadmap?.items?.map((item, idx) => (
                <div
                  key={item.id || idx}
                  className="flex flex-col justify-between gap-4 rounded-xl border border-slate-200 bg-slate-50/50 p-5 transition hover:bg-white hover:shadow-sm md:flex-row md:items-center"
                >
                  <div className="max-w-xl">
                    <div className="flex items-center gap-2">
                      <span className="rounded bg-teal-600 px-2 py-0.5 text-[10px] font-bold text-white uppercase">
                        {item.target_date || `Milestone ${idx + 1}`}
                      </span>
                      <span className="text-xs font-bold text-slate-800">{item.skill_name}</span>
                    </div>
                    <h4 className="mt-2 text-sm font-bold text-slate-900">{item.title}</h4>
                    <p className="mt-1 text-xs leading-5 text-slate-600">{item.description}</p>
                    {item.notes && <p className="mt-2 text-[11px] text-teal-800 font-semibold">{item.notes}</p>}
                  </div>

                  <div className="flex items-center gap-2">
                    <span className="text-[11px] font-semibold text-slate-500">Status:</span>
                    <select
                      value={item.status}
                      onChange={(e) => updateItemStatus(item.id, e.target.value)}
                      className="rounded-lg border border-slate-200 bg-white px-2.5 py-1.5 text-xs font-bold text-slate-800 outline-none focus:border-teal-500"
                    >
                      <option value="not_started">Not Started</option>
                      <option value="in_progress">In Progress</option>
                      <option value="completed">Completed</option>
                    </select>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* 4. SUB-TAB C: Interview Preparation */}
      {activeSubTab === 'interview' && (
        <div className="space-y-6">
          <div className="flex flex-col gap-3 rounded-xl border border-slate-200 bg-white p-5 shadow-sm sm:flex-row sm:items-center sm:justify-between">
            <div>
              <h3 className="text-base font-bold text-slate-900">Curated Interview Question Bank</h3>
              <p className="text-xs text-slate-500">Practice core technical, architectural, and behavioral questions tailored for {selectedRole}.</p>
            </div>

            <div className="flex items-center gap-1.5 rounded-lg border border-slate-200 bg-slate-50 p-1 text-xs">
              <button
                type="button"
                onClick={() => setActiveCategory('technical')}
                className={`rounded px-3 py-1 font-semibold transition ${
                  activeCategory === 'technical' ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-600'
                }`}
              >
                Technical
              </button>
              <button
                type="button"
                onClick={() => setActiveCategory('behavioral')}
                className={`rounded px-3 py-1 font-semibold transition ${
                  activeCategory === 'behavioral' ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-600'
                }`}
              >
                Behavioral
              </button>
              <button
                type="button"
                onClick={() => setActiveCategory('hr')}
                className={`rounded px-3 py-1 font-semibold transition ${
                  activeCategory === 'hr' ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-600'
                }`}
              >
                HR & Motivation
              </button>
            </div>
          </div>

          {/* Practice Modal */}
          {practicingQuestion && (
            <form onSubmit={handleSavePracticeSubmit} className="rounded-xl border border-teal-300 bg-white p-6 shadow-lg">
              <div className="border-b border-slate-100 pb-3">
                <div className="flex items-center gap-2">
                  <span className="rounded bg-teal-100 px-2 py-0.5 text-[10px] font-bold text-teal-800 uppercase">
                    {practicingQuestion.category}
                  </span>
                  <span className="rounded border border-slate-200 px-2 py-0.5 text-[10px] font-semibold text-slate-600">
                    Difficulty: {practicingQuestion.difficulty}
                  </span>
                </div>
                <h4 className="mt-2 text-base font-bold text-slate-900">{practicingQuestion.question}</h4>
                {practicingQuestion.hint && (
                  <p className="mt-2 rounded-lg bg-teal-50/60 p-3 text-xs leading-5 text-teal-900">
                    <span className="font-bold">Preparation Guide:</span> {practicingQuestion.hint}
                  </p>
                )}
              </div>

              <div className="mt-4 space-y-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-700">Your Answer / Solution Outline</label>
                  <textarea
                    rows={4}
                    placeholder="Structure your response (e.g. STAR method for behavioral, technical tradeoffs for architecture)..."
                    value={userAnswer}
                    onChange={(e) => setUserAnswer(e.target.value)}
                    className="mt-1 w-full rounded-lg border border-slate-200 p-3 text-xs outline-none focus:border-teal-500"
                  />
                </div>

                <div className="grid gap-4 sm:grid-cols-2">
                  <div>
                    <label className="block text-xs font-semibold text-slate-700">Self Evaluation / Status</label>
                    <select
                      value={practiceStatus}
                      onChange={(e) => setPracticeStatus(e.target.value)}
                      className="mt-1 w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-xs outline-none focus:border-teal-500"
                    >
                      <option value="practiced">Practiced & Ready</option>
                      <option value="needs_review">Needs More Practice</option>
                      <option value="bookmarked">Bookmarked</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-700">Personal Notes / Pointers</label>
                    <input
                      type="text"
                      placeholder="e.g. Mention PostgreSQL RLS benchmarks in follow-up"
                      value={userNotes}
                      onChange={(e) => setUserNotes(e.target.value)}
                      className="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2 text-xs outline-none focus:border-teal-500"
                    />
                  </div>
                </div>
              </div>

              <div className="mt-5 flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setPracticingQuestion(null)}
                  className="rounded-lg px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="rounded-lg bg-teal-600 px-4 py-2 text-xs font-semibold text-white shadow hover:bg-teal-700"
                >
                  Save Practice Session
                </button>
              </div>
            </form>
          )}

          {/* Question Cards Grid */}
          <div className="grid gap-4 sm:grid-cols-2">
            {filteredQuestions.map((q) => {
              const practiceRecord = practiceSessions.find((p) => p.question === q.question)
              return (
                <div
                  key={q.id}
                  className="flex flex-col justify-between rounded-xl border border-slate-200 bg-white p-5 shadow-sm transition hover:border-teal-500/50 hover:shadow-md"
                >
                  <div>
                    <div className="flex items-center justify-between">
                      <span className="rounded bg-teal-50 px-2 py-0.5 text-[10px] font-bold text-teal-700 uppercase border border-teal-200">
                        {q.related_skill || q.category}
                      </span>
                      <span className={`rounded border px-2 py-0.5 text-[10px] font-bold ${
                        q.difficulty === 'Hard'
                          ? 'border-red-200 bg-red-50 text-red-700'
                          : q.difficulty === 'Medium'
                          ? 'border-amber-200 bg-amber-50 text-amber-700'
                          : 'border-emerald-200 bg-emerald-50 text-emerald-700'
                      }`}>
                        {q.difficulty}
                      </span>
                    </div>

                    <h4 className="mt-3 text-sm font-bold text-slate-900 leading-snug">{q.question}</h4>

                    {practiceRecord && (
                      <div className="mt-3 rounded-lg border border-emerald-200 bg-emerald-50/50 p-2.5 text-xs text-emerald-900">
                        <div className="flex items-center gap-1.5 font-bold">
                          <CheckCircle2 size={13} className="text-emerald-600" />
                          <span>Practiced Response Logged</span>
                        </div>
                        {practiceRecord.answer && (
                          <p className="mt-1 text-[11px] text-slate-600 line-clamp-2">{practiceRecord.answer}</p>
                        )}
                      </div>
                    )}
                  </div>

                  <div className="mt-5 border-t border-slate-100 pt-3">
                    <button
                      type="button"
                      onClick={() => handleStartPractice(q)}
                      className="focus-ring w-full inline-flex items-center justify-center gap-1.5 rounded-lg bg-teal-600 py-2 text-xs font-semibold text-white transition hover:bg-teal-700"
                    >
                      <Edit3 size={14} />
                      {practiceRecord ? 'Review & Edit Practice' : 'Start Practice'}
                    </button>
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      )}
    </div>
  )
}
