import { useMemo, useCallback } from 'react'
import { useCareerProfile } from './useCareerProfile.js'
import { useResumes } from './useResumes.js'
import { useJobs } from './useJobs.js'
import { useSkillsInterview } from './useSkillsInterview.js'
import { usePortfolio } from './usePortfolio.js'
import { calculateFullCommandCenterData } from '../../../services/careerCommandCenterService.js'

export function useCareerCommandCenter() {
  const {
    profile,
    skills,
    experience,
    education,
    loading: profileLoading,
    reload: reloadProfile,
  } = useCareerProfile()

  const {
    resumes,
    loading: resumesLoading,
    loadResumes,
  } = useResumes()

  const {
    jobs,
    applications,
    loading: jobsLoading,
    loadData: reloadJobs,
  } = useJobs()

  const {
    selectedRole,
    roadmap,
    practiceSessions,
    roadmapLoading,
    loadRoadmap,
    loadPractice,
  } = useSkillsInterview()

  const {
    projects,
    publicProfile,
    loading: portfolioLoading,
    loadAll: reloadPortfolio,
  } = usePortfolio()

  const loading =
    profileLoading || resumesLoading || jobsLoading || roadmapLoading || portfolioLoading

  const portfolioState = useMemo(() => ({
    bio: publicProfile?.bio || profile?.bio,
    is_published: Boolean(publicProfile?.is_published),
    publicProfile,
    projects,
  }), [publicProfile, profile?.bio, projects])

  const commandCenterData = useMemo(() => {
    return calculateFullCommandCenterData({
      profile,
      skills,
      experience,
      education,
      resumes,
      jobs,
      applications,
      practiceSessions,
      roadmap,
      portfolio: portfolioState,
      targetRole: selectedRole || profile?.target_role,
    })
  }, [
    profile,
    skills,
    experience,
    education,
    resumes,
    jobs,
    applications,
    practiceSessions,
    roadmap,
    portfolioState,
    selectedRole,
  ])

  const refresh = useCallback(async () => {
    try {
      await Promise.all([
        reloadProfile?.(),
        loadResumes?.(),
        reloadJobs?.(),
        loadRoadmap?.(),
        loadPractice?.(),
        reloadPortfolio?.(),
      ])
    } catch (err) {
      console.warn('Failed to refresh command center data:', err)
    }
  }, [reloadProfile, loadResumes, reloadJobs, loadRoadmap, loadPractice, reloadPortfolio])

  return {
    ...commandCenterData,
    loading,
    error: null,
    refresh,
  }
}
