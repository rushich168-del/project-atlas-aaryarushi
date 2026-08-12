import { useEffect, useState, useMemo } from 'react'
import { useAuth } from '../../../context/AuthContext.jsx'
import { useCareerProfile } from './useCareerProfile.js'
import {
  calculateSkillGaps,
  fetchRoadmap,
  updateRoadmapItemStatus as apiUpdateRoadmapItemStatus,
  interviewQuestionsLibrary,
  fetchInterviewPractice,
  saveInterviewPractice as apiSaveInterviewPractice,
  roleRequirementsTaxonomy,
} from '../../../services/skillsInterviewService.js'

export function useSkillsInterview() {
  const { user } = useAuth()
  const { profile, skills: userSkills } = useCareerProfile()

  const availableRoles = useMemo(() => {
    const defaultRoles = Object.keys(roleRequirementsTaxonomy)
    if (profile?.target_role && !defaultRoles.includes(profile.target_role)) {
      defaultRoles.unshift(profile.target_role)
    }
    return defaultRoles
  }, [profile?.target_role])

  const [selectedRole, setSelectedRole] = useState(
    profile?.target_role || 'Senior Full Stack Engineer / Technical Lead'
  )

  useEffect(() => {
    if (profile?.target_role) {
      setSelectedRole(profile.target_role)
    }
  }, [profile?.target_role])

  // 1. Skill Gap Analysis
  const skillGapAnalysis = useMemo(() => {
    return calculateSkillGaps(userSkills, selectedRole)
  }, [userSkills, selectedRole])

  // 2. Roadmap State
  const [roadmap, setRoadmap] = useState(null)
  const [roadmapLoading, setRoadmapLoading] = useState(true)

  async function loadRoadmap() {
    setRoadmapLoading(true)
    try {
      const res = await fetchRoadmap(user?.id, selectedRole, skillGapAnalysis.matrix)
      setRoadmap(res.roadmap)
    } catch (err) {
      console.warn('Failed to load roadmap:', err)
    } finally {
      setRoadmapLoading(false)
    }
  }

  useEffect(() => {
    loadRoadmap()
  }, [user?.id, selectedRole, skillGapAnalysis.matrix])

  async function updateItemStatus(itemId, newStatus) {
    if (!roadmap) return
    const res = await apiUpdateRoadmapItemStatus(user?.id, roadmap.id, itemId, newStatus)
    if (res.status === 'success') {
      setRoadmap((prev) => ({
        ...prev,
        items: prev.items.map((item) => (item.id === itemId ? { ...item, status: newStatus } : item)),
      }))
    }
  }

  // 3. Interview Preparation State
  const [practiceSessions, setPracticeSessions] = useState([])
  const [activeCategory, setActiveCategory] = useState('technical')

  async function loadPractice() {
    try {
      const res = await fetchInterviewPractice(user?.id)
      setPracticeSessions(res.practice || [])
    } catch (err) {
      console.warn('Failed to load interview practice:', err)
    }
  }

  useEffect(() => {
    loadPractice()
  }, [user?.id])

  const filteredQuestions = useMemo(() => {
    return interviewQuestionsLibrary.filter((q) => {
      if (activeCategory === 'all') return true
      return q.category === activeCategory
    })
  }, [activeCategory])

  async function savePractice(questionData) {
    const res = await apiSaveInterviewPractice(user?.id, questionData)
    if (res.status === 'success') {
      await loadPractice()
    }
    return res
  }

  return {
    availableRoles,
    selectedRole,
    setSelectedRole,
    userSkills,
    skillGapAnalysis,
    roadmap,
    roadmapLoading,
    updateItemStatus,
    activeCategory,
    setActiveCategory,
    filteredQuestions,
    practiceSessions,
    savePractice,
  }
}
