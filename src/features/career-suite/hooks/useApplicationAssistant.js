import { useState, useEffect, useMemo } from 'react'
import { useAuth } from '../../../context/AuthContext.jsx'
import { useCareerProfile } from './useCareerProfile.js'
import { useResumes } from './useResumes.js'
import { calculateJobMatch } from '../../../services/jobMatchService.js'
import {
  generateApplicationStrategy,
  generateTailoredBulletSuggestions,
  generateCoverLetterDraft,
  validateCoverLetterFacts,
  countWordsAndCharacters,
  exportCoverLetterPDF,
  fetchApplicationAssistant,
  saveApplicationAssistant,
} from '../../../services/applicationAssistantService.js'

export function useApplicationAssistant(job = null, application = null) {
  const { user } = useAuth()
  const { profile, skills, experience, education } = useCareerProfile()
  const { resumes } = useResumes()

  const [activeJob, setActiveJob] = useState(job)
  const [activeApp, setActiveApp] = useState(application)
  const [tone, setTone] = useState('Executive')
  const [template, setTemplate] = useState('Standard')
  const [coverLetterText, setCoverLetterText] = useState('')
  const [bullets, setBullets] = useState([])
  const [status, setStatus] = useState('draft') // 'draft' | 'reviewed' | 'saved'
  const [isSaving, setIsSaving] = useState(false)
  const [saveMessage, setSaveMessage] = useState('')

  // 1. Deterministic ATS Match for this Job
  const atsAnalysis = useMemo(() => {
    if (!activeJob) return null
    return calculateJobMatch(activeJob, profile, skills, experience, education, resumes)
  }, [activeJob, profile, skills, experience, education, resumes])

  // 2. Application Strategy
  const strategy = useMemo(() => {
    if (!activeJob || !atsAnalysis) return null
    return generateApplicationStrategy(activeJob, profile, atsAnalysis, atsAnalysis.recommendedResume)
  }, [activeJob, profile, atsAnalysis])

  // 3. Live Word/Char & Fact Metrics
  const { words: wordCount, characters: characterCount } = useMemo(() => {
    return countWordsAndCharacters(coverLetterText)
  }, [coverLetterText])

  const factValidation = useMemo(() => {
    return validateCoverLetterFacts(coverLetterText, {
      profile,
      skills,
      experience,
      job: activeJob,
    })
  }, [coverLetterText, profile, skills, experience, activeJob])

  // 4. Initialize or load draft
  useEffect(() => {
    async function loadExistingDraft() {
      if (!activeJob) return

      const existing = await fetchApplicationAssistant(user?.id, activeJob.id, activeApp?.id)
      if (existing) {
        if (existing.cover_letter) setCoverLetterText(existing.cover_letter)
        if (existing.bullet_suggestions?.length > 0) setBullets(existing.bullet_suggestions)
        if (existing.tone) setTone(existing.tone)
        if (existing.template) setTemplate(existing.template)
        if (existing.status) setStatus(existing.status)
      } else {
        // Generate initial deterministic drafts
        const initialBullets = generateTailoredBulletSuggestions(activeJob, experience, skills, atsAnalysis || {})
        const initialCoverLetter = generateCoverLetterDraft(
          activeJob,
          profile,
          experience,
          skills,
          atsAnalysis || {},
          atsAnalysis?.recommendedResume,
          { tone: 'Executive', template: 'Standard' }
        )
        setBullets(initialBullets)
        setCoverLetterText(initialCoverLetter)
        setStatus('draft')
      }
    }

    loadExistingDraft()
  }, [activeJob?.id, activeApp?.id, user?.id])

  function regenerateCoverLetter(customOptions = {}) {
    if (!activeJob) return
    const activeTone = customOptions.tone || tone
    const activeTemplate = customOptions.template || template
    const regenerated = generateCoverLetterDraft(
      activeJob,
      profile,
      experience,
      skills,
      atsAnalysis || {},
      atsAnalysis?.recommendedResume,
      { tone: activeTone, template: activeTemplate }
    )
    setCoverLetterText(regenerated)
  }

  function handleToneChange(newTone) {
    setTone(newTone)
    regenerateCoverLetter({ tone: newTone, template })
  }

  function handleTemplateChange(newTemplate) {
    setTemplate(newTemplate)
    regenerateCoverLetter({ tone, template: newTemplate })
  }

  function regenerateBullets() {
    if (!activeJob) return
    const regenerated = generateTailoredBulletSuggestions(activeJob, experience, skills, atsAnalysis || {})
    setBullets(regenerated)
  }

  function updateBulletStatus(bulletId, newStatus) {
    setBullets((prev) =>
      prev.map((b) => (b.id === bulletId ? { ...b, status: newStatus } : b))
    )
  }

  function handleExportPDF() {
    exportCoverLetterPDF({
      letterText: coverLetterText,
      candidateName: profile.full_name,
      companyName: activeJob?.company,
      jobTitle: activeJob?.title,
    })
  }

  async function saveApplicationDraft(newStatus = 'saved') {
    if (!activeJob) return
    setIsSaving(true)
    setSaveMessage('')

    try {
      const payload = {
        jobId: activeJob.id,
        applicationId: activeApp?.id || null,
        jobAnalysisId: atsAnalysis?.id || null,
        resumeId: atsAnalysis?.recommendedResume?.id || null,
        applicationStrategy: strategy,
        bulletSuggestions: bullets,
        coverLetter: coverLetterText,
        tone,
        template,
        status: newStatus,
      }

      await saveApplicationAssistant(user?.id, payload)
      setStatus(newStatus)
      setSaveMessage('Application package saved successfully!')
      setTimeout(() => setSaveMessage(''), 3000)
    } finally {
      setIsSaving(false)
    }
  }

  return {
    activeJob,
    setActiveJob,
    activeApp,
    setActiveApp,
    atsAnalysis,
    strategy,
    bullets,
    coverLetterText,
    setCoverLetterText,
    tone,
    setTone: handleToneChange,
    template,
    setTemplate: handleTemplateChange,
    wordCount,
    characterCount,
    verifiedFactsCount: factValidation.verifiedFactsCount,
    status,
    setStatus,
    isSaving,
    saveMessage,
    regenerateCoverLetter,
    regenerateBullets,
    updateBulletStatus,
    handleExportPDF,
    saveApplicationDraft,
  }
}
