import { useEffect, useState } from 'react'
import { useAuth } from '../../../context/AuthContext.jsx'
import {
  fetchResumes,
  fetchResumeById,
  createResume as apiCreateResume,
  updateResume as apiUpdateResume,
  deleteResume as apiDeleteResume,
} from '../../../services/resumeService.js'

export function useResumes() {
  const { user } = useAuth()
  const [resumes, setResumes] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [selectedResumeId, setSelectedResumeId] = useState(null)
  const [activeResume, setActiveResume] = useState(null)

  async function loadResumes() {
    setLoading(true)
    setError(null)
    try {
      const data = await fetchResumes(user?.id)
      setResumes(data.resumes)
    } catch (err) {
      setError('Failed to load resumes. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadResumes()
  }, [user?.id])

  async function openResume(id) {
    setSelectedResumeId(id)
    setLoading(true)
    try {
      const data = await fetchResumeById(user?.id, id)
      setActiveResume(data.resume)
    } catch (err) {
      setError('Failed to load selected resume.')
    } finally {
      setLoading(false)
    }
  }

  async function createResume(resumeData) {
    const res = await apiCreateResume(user?.id, resumeData)
    if (res.status === 'success') {
      loadResumes()
    }
    return res
  }

  async function updateResume(resumeId, updates) {
    const res = await apiUpdateResume(user?.id, resumeId, updates)
    if (res.status === 'success') {
      loadResumes()
    }
    return res
  }

  async function deleteResume(id) {
    const res = await apiDeleteResume(user?.id, id)
    if (res.status === 'success') {
      if (selectedResumeId === id) {
        setSelectedResumeId(null)
        setActiveResume(null)
      }
      loadResumes()
    }
    return res
  }

  function closeEditor() {
    setSelectedResumeId(null)
    setActiveResume(null)
  }

  return {
    resumes,
    loading,
    error,
    selectedResumeId,
    activeResume,
    setActiveResume,
    loadResumes,
    openResume,
    createResume,
    updateResume,
    deleteResume,
    closeEditor,
  }
}
