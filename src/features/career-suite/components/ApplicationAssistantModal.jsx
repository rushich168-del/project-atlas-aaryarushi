import { X, Sparkles, CheckCircle2, Save } from 'lucide-react'
import { useApplicationAssistant } from '../hooks/useApplicationAssistant.js'
import { ApplicationStrategyCard } from './ApplicationStrategyCard.jsx'
import { ResumeRecommendation } from './ResumeRecommendation.jsx'
import { TailoredBulletsSection } from './TailoredBulletsSection.jsx'
import { CoverLetterSection } from './CoverLetterSection.jsx'

export function ApplicationAssistantModal({ job, application, onClose, onAttachResume }) {
  const {
    strategy,
    atsAnalysis,
    bullets,
    coverLetterText,
    setCoverLetterText,
    tone,
    setTone,
    template,
    setTemplate,
    wordCount,
    characterCount,
    verifiedFactsCount,
    status,
    isSaving,
    saveMessage,
    regenerateCoverLetter,
    regenerateBullets,
    updateBulletStatus,
    handleExportPDF,
    saveApplicationDraft,
  } = useApplicationAssistant(job, application)

  if (!job) return null

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-xs p-4 overflow-y-auto">
      <div className="relative w-full max-w-4xl rounded-2xl bg-white shadow-2xl border border-slate-200 max-h-[92vh] flex flex-col my-auto">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-slate-100 p-6">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-teal-50 text-teal-700">
              <Sparkles size={20} />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="rounded bg-teal-100 px-2 py-0.5 text-[10px] font-bold text-teal-800 uppercase">
                  Application Assistant
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
            title="Close Assistant"
          >
            <X size={18} />
          </button>
        </div>

        {/* Save feedback banner */}
        {saveMessage && (
          <div className="bg-emerald-50 border-b border-emerald-200 px-6 py-2.5 text-xs font-bold text-emerald-800 flex items-center gap-2">
            <CheckCircle2 size={14} className="text-emerald-600" />
            <span>{saveMessage}</span>
          </div>
        )}

        {/* Scrollable Workspace */}
        <div className="p-6 overflow-y-auto space-y-6">
          {/* 1. Application Strategy Card */}
          <ApplicationStrategyCard
            job={job}
            strategy={strategy}
            atsAnalysis={atsAnalysis}
          />

          {/* 2. Recommended Resume Alignment */}
          {atsAnalysis?.recommendedResume && (
            <ResumeRecommendation
              recommendedResume={atsAnalysis.recommendedResume}
              onSelectResume={onAttachResume}
            />
          )}

          {/* 3. Tailored Resume Bullets */}
          <TailoredBulletsSection
            bullets={bullets}
            onUpdateStatus={updateBulletStatus}
            onRegenerate={regenerateBullets}
          />

          {/* 4. Tailored Cover Letter Draft */}
          <CoverLetterSection
            coverLetterText={coverLetterText}
            onChangeText={setCoverLetterText}
            tone={tone}
            onChangeTone={setTone}
            template={template}
            onChangeTemplate={setTemplate}
            onRegenerate={() => regenerateCoverLetter({ tone, template })}
            onSave={() => saveApplicationDraft('saved')}
            onExportPDF={handleExportPDF}
            isSaving={isSaving}
            status={status}
            wordCount={wordCount}
            characterCount={characterCount}
            verifiedFactsCount={verifiedFactsCount}
            atsScore={atsAnalysis?.matchScore || 0}
          />
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between border-t border-slate-100 p-4 bg-slate-50 rounded-b-2xl">
          <span className="text-[11px] text-slate-400">
            Assistant mode • You retain full control before applying
          </span>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => saveApplicationDraft('saved')}
              disabled={isSaving}
              className="inline-flex items-center gap-1.5 rounded-lg bg-teal-600 px-4 py-2 text-xs font-bold text-white shadow-sm hover:bg-teal-700 transition disabled:opacity-50"
            >
              <Save size={14} />
              {isSaving ? 'Saving Package...' : 'Save Full Package'}
            </button>
            <button
              type="button"
              onClick={onClose}
              className="rounded-lg border border-slate-200 bg-white px-4 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-50"
            >
              Done
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
