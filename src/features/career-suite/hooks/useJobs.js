import { useEffect, useState, useMemo } from 'react'
import { useAuth } from '../../../context/AuthContext.jsx'
import {
  fetchJobs,
  createJob as apiCreateJob,
  updateJob as apiUpdateJob,
  deleteJob as apiDeleteJob,
  fetchApplications,
  createApplication as apiCreateApplication,
  updateApplicationStatus as apiUpdateApplicationStatus,
  deleteApplication as apiDeleteApplication,
  syncAllJobsAndApplications,
} from '../../../services/jobService.js'

export function useJobs() {
  const { user } = useAuth()
  const [jobs, setJobs] = useState([])
  const [applications, setApplications] = useState([])
  const [loading, setLoading] = useState(true)
  const [isSyncing, setIsSyncing] = useState(false)
  const [error, setError] = useState(null)

  async function loadAll() {
    setLoading(true)
    setError(null)
    try {
      const [jobsRes, appsRes] = await Promise.all([
        fetchJobs(user?.id),
        fetchApplications(user?.id),
      ])
      setJobs(jobsRes.jobs || [])
      setApplications(appsRes.applications || [])
    } catch (err) {
      setError('Failed to load jobs and applications. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadAll()
  }, [user?.id])

  const metrics = useMemo(() => {
    const savedCount = jobs.length
    const appliedCount = applications.filter((a) => a.status === 'applied' || a.status === 'screening').length
    const interviewCount = applications.filter((a) => a.status === 'interview').length
    const offerCount = applications.filter((a) => a.status === 'offer').length

    return {
      savedCount,
      appliedCount,
      interviewCount,
      offerCount,
      totalApps: applications.length,
    }
  }, [jobs, applications])

  const syncStatusSummary = useMemo(() => {
    const pendingJobs = jobs.filter((j) => j.pendingSync || j.syncStatus === 'pending_sync')
    const pendingApps = applications.filter((a) => a.pendingSync || a.syncStatus === 'pending_sync')
    const errorJobs = jobs.filter((j) => j.syncStatus === 'sync_error')
    const errorApps = applications.filter((a) => a.syncStatus === 'sync_error')

    return {
      hasPending: pendingJobs.length > 0 || pendingApps.length > 0,
      hasErrors: errorJobs.length > 0 || errorApps.length > 0,
      pendingCount: pendingJobs.length + pendingApps.length,
      errorCount: errorJobs.length + errorApps.length,
    }
  }, [jobs, applications])

  async function retrySync() {
    if (!user?.id) return
    setIsSyncing(true)
    try {
      await syncAllJobsAndApplications(user.id)
      await loadAll()
    } finally {
      setIsSyncing(false)
    }
  }

  async function createJob(jobData) {
    const res = await apiCreateJob(user?.id, jobData)
    if (res.status === 'success') {
      await loadAll()
    }
    return res
  }

  async function updateJob(jobId, updates) {
    const res = await apiUpdateJob(user?.id, jobId, updates)
    if (res.status === 'success') {
      await loadAll()
    }
    return res
  }

  async function deleteJob(jobId) {
    const res = await apiDeleteJob(user?.id, jobId)
    if (res.status === 'success') {
      await loadAll()
    }
    return res
  }

  async function createApplication(appData) {
    const res = await apiCreateApplication(user?.id, appData)
    if (res.status === 'success') {
      await loadAll()
    }
    return res
  }

  async function updateApplicationStatus(appId, status, notes = null) {
    const res = await apiUpdateApplicationStatus(user?.id, appId, status, notes)
    if (res.status === 'success') {
      await loadAll()
    }
    return res
  }

  async function deleteApplication(appId) {
    const res = await apiDeleteApplication(user?.id, appId)
    if (res.status === 'success') {
      await loadAll()
    }
    return res
  }

  return {
    jobs,
    applications,
    loading,
    isSyncing,
    error,
    metrics,
    syncStatusSummary,
    loadAll,
    retrySync,
    createJob,
    updateJob,
    deleteJob,
    createApplication,
    updateApplicationStatus,
    deleteApplication,
  }
}
