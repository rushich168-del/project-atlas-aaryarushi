import { useEffect, useState } from 'react'
import { useAuth } from '../../../context/AuthContext.jsx'
import {
  fetchCareerProfile,
  saveCareerProfileIdentity,
  saveEducationItem,
  deleteEducationItem,
  saveExperienceItem,
  deleteExperienceItem,
  saveSkillItem,
  deleteSkillItem,
  syncPendingLocalProfile,
  resolveProfileConflict,
} from '../../../services/careerProfileService.js'

export function useCareerProfile() {
  const { user } = useAuth()
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState(null)
  const [saveResult, setSaveResult] = useState(null)
  const [conflictState, setConflictState] = useState(null)

  const [profile, setProfile] = useState({
    full_name: '',
    headline: '',
    summary: '',
    location: '',
    phone: '',
    email: '',
    target_role: '',
    career_level: 'Mid',
  })
  const [education, setEducation] = useState([])
  const [experience, setExperience] = useState([])
  const [skills, setSkills] = useState([])

  async function loadData() {
    setLoading(true)
    setError(null)
    try {
      const data = await fetchCareerProfile(user?.id, user)
      setProfile(data.profile)
      setEducation(data.education)
      setExperience(data.experience)
      setSkills(data.skills)

      if (data.hasConflict) {
        setConflictState({
          hasConflict: true,
          cloudVersion: data.cloudVersion,
          localVersion: data.localVersion,
        })
        setSaveResult({
          isLocal: true,
          status: 'conflict',
          message: 'Conflict detected: profile was modified online while you were offline.',
        })
      } else if (data.isLocal) {
        setConflictState(null)
        setSaveResult({
          isLocal: true,
          status: data.pendingSync ? 'pending_sync' : 'local_offline',
          pendingSync: data.pendingSync || false,
          message: data.pendingSync
            ? 'Pending offline edits saved in user cache.'
            : 'Viewing local profile cache (Supabase offline).',
        })
      } else {
        setConflictState(null)
        setSaveResult({
          isLocal: false,
          status: 'cloud_saved',
          pendingSync: false,
          message: 'Account data synchronized with Supabase cloud storage.',
        })
      }
    } catch (err) {
      setError('Failed to load career profile data. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadData()
  }, [user?.id])

  async function handleResolveConflict(choice) {
    if (!user?.id) return
    setSaving(true)
    const res = await resolveProfileConflict(user.id, choice)
    setSaving(false)
    if (res.status === 'resolved') {
      setConflictState(null)
      await loadData()
    }
  }

  async function saveIdentity(identityData) {
    setSaving(true)
    setSaveResult(null)
    setError(null)

    const res = await saveCareerProfileIdentity(user?.id, identityData)
    setSaving(false)

    if (res.status === 'success') {
      setSaveResult({
        isLocal: res.isLocal,
        status: res.isLocal ? 'pending_sync' : 'cloud_saved',
        pendingSync: res.pendingSync || false,
        message: res.message,
      })
      setTimeout(() => setSaveResult(null), 5000)
    } else {
      setError('Failed to save profile identity.')
    }
  }

  async function saveEducation(eduData) {
    const res = await saveEducationItem(user?.id, eduData)
    if (res.status === 'success') {
      loadData()
    }
  }

  async function deleteEducation(id) {
    const res = await deleteEducationItem(user?.id, id)
    if (res.status === 'success') {
      loadData()
    }
  }

  async function saveExperience(expData) {
    const res = await saveExperienceItem(user?.id, expData)
    if (res.status === 'success') {
      loadData()
    }
  }

  async function deleteExperience(id) {
    const res = await deleteExperienceItem(user?.id, id)
    if (res.status === 'success') {
      loadData()
    }
  }

  async function addSkill(skillData) {
    const res = await saveSkillItem(user?.id, skillData)
    if (res.status === 'success') {
      loadData()
    }
  }

  async function deleteSkill(id) {
    const res = await deleteSkillItem(user?.id, id)
    if (res.status === 'success') {
      loadData()
    }
  }

  async function retrySync() {
    if (user?.id) {
      setSaving(true)
      const res = await syncPendingLocalProfile(user.id)
      setSaving(false)
      if (res.hasConflict) {
        setConflictState({
          hasConflict: true,
          cloudVersion: res.cloudVersion,
          localVersion: res.localVersion,
        })
      } else {
        await loadData()
      }
    }
  }

  return {
    profile,
    setProfile,
    education,
    experience,
    skills,
    loading,
    saving,
    error,
    saveResult,
    conflictState,
    loadData,
    saveIdentity,
    saveEducation,
    deleteEducation,
    saveExperience,
    deleteExperience,
    addSkill,
    deleteSkill,
    retrySync,
    resolveConflict: handleResolveConflict,
  }
}
