import { useMemo } from 'react'
import { useSkillsInterview } from './useSkillsInterview.js'
import { useJobs } from './useJobs.js'
import { useCareerProfile } from './useCareerProfile.js'
import { calculateFullCareerProgress } from '../../../services/careerProgressService.js'

export function useCareerProgress() {
  const {
    availableRoles,
    selectedRole,
    setSelectedRole,
    skillGapAnalysis,
    roadmap,
    roadmapLoading,
    updateItemStatus,
    practiceSessions,
  } = useSkillsInterview()

  const { skills: userSkills } = useCareerProfile()
  const { jobs, applications, loading: jobsLoading } = useJobs()

  const progressIntelligence = useMemo(() => {
    return calculateFullCareerProgress({
      userSkills,
      targetRole: selectedRole,
      gapMatrix: skillGapAnalysis?.matrix || [],
      roadmap,
      practiceSessions,
      trackedJobs: jobs,
      applications,
    })
  }, [userSkills, selectedRole, skillGapAnalysis?.matrix, roadmap, practiceSessions, jobs, applications])

  return {
    availableRoles,
    selectedRole,
    setSelectedRole,
    skillGapAnalysis,
    roadmap,
    progressIntelligence,
    updateItemStatus,
    loading: roadmapLoading || jobsLoading,
  }
}
