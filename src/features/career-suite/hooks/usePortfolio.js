import { useEffect, useState, useMemo } from 'react'
import { useAuth } from '../../../context/AuthContext.jsx'
import { useCareerProfile } from './useCareerProfile.js'
import {
  fetchProjects,
  createProject as apiCreateProject,
  updateProject as apiUpdateProject,
  deleteProject as apiDeleteProject,
  fetchPublicProfileSettings,
  savePublicProfileSettings as apiSavePublicProfileSettings,
  generateDraftBio,
  generateLinkedInRecommendations,
} from '../../../services/portfolioService.js'

export function usePortfolio() {
  const { user } = useAuth()
  const { profile, skills, experience, education } = useCareerProfile()

  const [projects, setProjects] = useState([])
  const [publicProfile, setPublicProfile] = useState(null)
  const [loading, setLoading] = useState(true)
  const [isSaving, setIsSaving] = useState(false)

  async function loadAll() {
    setLoading(true)
    try {
      const [projRes, pubRes] = await Promise.all([
        fetchProjects(user?.id),
        fetchPublicProfileSettings(user?.id, user),
      ])
      setProjects(projRes.projects || [])
      setPublicProfile(pubRes.settings)
    } catch (err) {
      console.warn('Failed to load portfolio data:', err)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadAll()
  }, [user?.id])

  // Bio Options
  const bioOptions = useMemo(() => {
    return generateDraftBio(profile, skills, experience)
  }, [profile, skills, experience])

  // LinkedIn Recommendations
  const linkedInRecs = useMemo(() => {
    return generateLinkedInRecommendations(profile, skills, experience, projects)
  }, [profile, skills, experience, projects])

  async function createProject(projectData) {
    const res = await apiCreateProject(user?.id, projectData)
    if (res.status === 'success') {
      await loadAll()
    }
    return res
  }

  async function updateProject(projectId, updates) {
    const res = await apiUpdateProject(user?.id, projectId, updates)
    if (res.status === 'success') {
      await loadAll()
    }
    return res
  }

  async function deleteProject(projectId) {
    const res = await apiDeleteProject(user?.id, projectId)
    if (res.status === 'success') {
      await loadAll()
    }
    return res
  }

  async function savePublicSettings(settings) {
    setIsSaving(true)
    try {
      const res = await apiSavePublicProfileSettings(user?.id, settings)
      if (res.status === 'success') {
        setPublicProfile(res.settings)
      }
      return res
    } finally {
      setIsSaving(false)
    }
  }

  return {
    projects,
    publicProfile,
    loading,
    isSaving,
    profile,
    skills,
    experience,
    education,
    bioOptions,
    linkedInRecs,
    loadAll,
    createProject,
    updateProject,
    deleteProject,
    savePublicSettings,
  }
}
