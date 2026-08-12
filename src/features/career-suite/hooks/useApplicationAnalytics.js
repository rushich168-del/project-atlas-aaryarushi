import { useMemo } from 'react'
import { useJobs } from './useJobs.js'
import { useResumes } from './useResumes.js'
import { useCareerProfile } from './useCareerProfile.js'
import { calculateJobMatch } from '../../../services/jobMatchService.js'
import { calculateFullAnalytics } from '../../../services/applicationAnalyticsService.js'

export function useApplicationAnalytics() {
  const { jobs, applications, loading: jobsLoading, error: jobsError, isSyncing, loadAll } = useJobs()
  const { resumes, loading: resumesLoading } = useResumes()
  const { profile, skills, experience, education, loading: profileLoading } = useCareerProfile()

  // Compute ATS analyses for all jobs
  const atsAnalyses = useMemo(() => {
    const map = {}
    if (!Array.isArray(jobs) || jobs.length === 0) return map

    jobs.forEach((job) => {
      if (job && job.id) {
        try {
          const match = calculateJobMatch(job, profile, skills, experience, education, resumes)
          map[job.id] = match
        } catch {
          // Gracefully fallback if individual calculation fails
        }
      }
    })
    return map
  }, [jobs, profile, skills, experience, education, resumes])

  // Derive complete analytics
  const analytics = useMemo(() => {
    return calculateFullAnalytics(jobs, applications, atsAnalyses, resumes, skills)
  }, [jobs, applications, atsAnalyses, resumes, skills])

  const isLoading = jobsLoading || resumesLoading || profileLoading

  return {
    analytics,
    jobs,
    applications,
    resumes,
    skills,
    loading: isLoading,
    error: jobsError,
    isSyncing,
    refresh: loadAll,
  }
}
