import { useState, useEffect, useMemo } from 'react'
import { useAuth } from '../../../context/AuthContext.jsx'
import { useCareerProfile } from './useCareerProfile.js'
import { useResumes } from './useResumes.js'
import {
  calculateJobMatch,
  fetchJobAnalysis,
  saveJobAnalysis,
} from '../../../services/jobMatchService.js'

export function useJobMatch(initialJob = null) {
  const { user } = useAuth()
  const { profile, skills, experience, education } = useCareerProfile()
  const { resumes } = useResumes()

  const [activeJob, setActiveJob] = useState(initialJob)
  const [isAnalyzing, setIsAnalyzing] = useState(false)
  const [persistedAnalysis, setPersistedAnalysis] = useState(null)

  // Real-time deterministic analysis
  const currentAnalysis = useMemo(() => {
    if (!activeJob) return null
    return calculateJobMatch(activeJob, profile, skills, experience, education, resumes)
  }, [activeJob, profile, skills, experience, education, resumes])

  useEffect(() => {
    async function loadAnalysis() {
      if (activeJob?.id) {
        const cached = await fetchJobAnalysis(user?.id, activeJob.id)
        if (cached) setPersistedAnalysis(cached)
      }
    }
    loadAnalysis()
  }, [activeJob?.id, user?.id])

  async function analyzeJob(job) {
    setActiveJob(job)
    setIsAnalyzing(true)
    try {
      const result = calculateJobMatch(job, profile, skills, experience, education, resumes)
      await saveJobAnalysis(user?.id, result)
      setPersistedAnalysis(result)
      return result
    } finally {
      setIsAnalyzing(false)
    }
  }

  return {
    activeJob,
    setActiveJob,
    isAnalyzing,
    analysis: currentAnalysis,
    persistedAnalysis,
    analyzeJob,
    resumes,
  }
}
