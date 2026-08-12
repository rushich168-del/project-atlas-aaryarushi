import { isSupabaseConfigured, supabase } from '../lib/supabaseClient.js'
import { getLocalResumes } from './resumeService.js'

function getLocalJobsKey(userId) {
  return `projectAtlas.jobs.${userId || 'guest'}`
}

function getLocalAppsKey(userId) {
  return `projectAtlas.applications.${userId || 'guest'}`
}

const defaultJobs = [
  {
    id: 'job-1',
    title: 'Senior Full Stack Engineer',
    company: 'TechFlow Automation Inc.',
    location: 'Bengaluru / Remote',
    work_type: 'Full-time',
    employment_type: 'Remote',
    description: 'Looking for a Senior Full Stack Engineer to lead architecture for workflow automation and modern web apps.',
    skills: ['React', 'Node.js', 'PostgreSQL', 'System Architecture'],
    salary_range: '₹24L - ₹32L / yr',
    source: 'TechFlow Careers',
    source_url: 'https://example.com/careers/fullstack',
    deadline: '2026-09-30',
    status: 'active',
    created_at: '2026-08-10T09:00:00.000Z',
    updated_at: '2026-08-10T09:00:00.000Z',
    pendingSync: false,
    syncStatus: 'cloud_saved',
  },
  {
    id: 'job-2',
    title: 'Solutions Architect — Cloud Systems',
    company: 'Nexus Scale Technologies',
    location: 'Mumbai / Hybrid',
    work_type: 'Full-time',
    employment_type: 'Hybrid',
    description: 'Lead design of multi-tenant cloud platforms, distributed services, and enterprise security policies.',
    skills: ['System Architecture', 'PostgreSQL', 'API Design', 'Cloud Infra'],
    salary_range: '₹30L - ₹42L / yr',
    source: 'Nexus Portal',
    source_url: 'https://example.com/careers/solutions-architect',
    deadline: '2026-10-15',
    status: 'active',
    created_at: '2026-08-11T11:30:00.000Z',
    updated_at: '2026-08-11T11:30:00.000Z',
    pendingSync: false,
    syncStatus: 'cloud_saved',
  },
  {
    id: 'job-3',
    title: 'Frontend Platform Engineer',
    company: 'Apex Cloud Systems',
    location: 'Remote',
    work_type: 'Contract',
    employment_type: 'Remote',
    description: 'Build responsive document generation tools, interactive canvas components, and high-performance React UI.',
    skills: ['React', 'Tailwind CSS', 'TypeScript', 'Vite'],
    salary_range: '₹18L - ₹25L / yr',
    source: 'Apex Careers',
    source_url: 'https://example.com/careers/frontend',
    deadline: '2026-09-20',
    status: 'active',
    created_at: '2026-08-12T08:00:00.000Z',
    updated_at: '2026-08-12T08:00:00.000Z',
    pendingSync: false,
    syncStatus: 'cloud_saved',
  },
]

const defaultApplications = [
  {
    id: 'app-1',
    job_id: 'job-1',
    resume_id: null,
    status: 'interview',
    applied_at: '2026-08-11T10:00:00.000Z',
    deadline: '2026-09-30',
    notes: 'Completed Round 1 Technical Screening. Scheduled for System Design deep dive next Tuesday.',
    created_at: '2026-08-11T10:00:00.000Z',
    updated_at: '2026-08-12T10:00:00.000Z',
    pendingSync: false,
    syncStatus: 'cloud_saved',
  },
  {
    id: 'app-2',
    job_id: 'job-2',
    resume_id: null,
    status: 'applied',
    applied_at: '2026-08-12T09:00:00.000Z',
    deadline: '2026-10-15',
    notes: 'Submitted customized Solutions Architect resume via company career portal.',
    created_at: '2026-08-12T09:00:00.000Z',
    updated_at: '2026-08-12T09:00:00.000Z',
    pendingSync: false,
    syncStatus: 'cloud_saved',
  },
]

export function getLocalJobs(userId) {
  try {
    const key = getLocalJobsKey(userId)
    const raw = window.localStorage.getItem(key)
    if (raw) return JSON.parse(raw)
  } catch {
    // Ignore restricted storage contexts
  }
  return defaultJobs
}

export function saveLocalJobs(userId, jobs) {
  try {
    const key = getLocalJobsKey(userId)
    window.localStorage.setItem(key, JSON.stringify(jobs))
  } catch {
    // Ignore restricted storage contexts
  }
}

export function getLocalApplications(userId) {
  try {
    const key = getLocalAppsKey(userId)
    const raw = window.localStorage.getItem(key)
    if (raw) return JSON.parse(raw)
  } catch {
    // Ignore restricted storage contexts
  }
  return defaultApplications
}

export function saveLocalApplications(userId, apps) {
  try {
    const key = getLocalAppsKey(userId)
    window.localStorage.setItem(key, JSON.stringify(apps))
  } catch {
    // Ignore restricted storage contexts
  }
}

export async function syncPendingJobs(userId) {
  if (!isSupabaseConfigured || !userId) return { success: false, idMap: {} }

  const localJobs = getLocalJobs(userId)
  const pending = localJobs.filter((j) => j.pendingSync || (typeof j.id === 'string' && j.id.startsWith('job-')))

  if (!pending.length) return { success: true, idMap: {} }

  let hasErrors = false
  const idMap = {}
  const updatedLocal = [...localJobs]

  for (const item of pending) {
    try {
      const isTempId = typeof item.id === 'string' && item.id.startsWith('job-')
      const payload = {
        user_id: userId,
        title: item.title,
        company: item.company,
        location: item.location || 'Remote / Hybrid',
        work_type: item.work_type || 'Full-time',
        employment_type: item.employment_type || 'Remote',
        description: item.description || '',
        skills: Array.isArray(item.skills) ? item.skills : [],
        salary_range: item.salary_range || '',
        source: item.source || 'Manual Entry',
        source_url: item.source_url || '',
        deadline: item.deadline || '',
        status: item.status || 'active',
      }

      let savedData = null

      if (!isTempId) {
        // Update existing cloud job
        const { data, error } = await supabase
          .from('career_jobs')
          .update({ ...payload, updated_at: new Date().toISOString() })
          .eq('id', item.id)
          .eq('user_id', userId)
          .select()
          .single()
        if (error) throw error
        savedData = data
      } else {
        // Insert new job and receive server UUID
        const { data, error } = await supabase
          .from('career_jobs')
          .insert(payload)
          .select()
          .single()
        if (error) throw error
        savedData = data
        idMap[item.id] = data.id
      }

      const idx = updatedLocal.findIndex((j) => j.id === item.id)
      if (idx >= 0 && savedData) {
        updatedLocal[idx] = {
          ...savedData,
          pendingSync: false,
          syncStatus: 'cloud_saved',
        }
      }
    } catch (err) {
      console.warn('[jobService] Failed to sync job:', item.title, err.message)
      hasErrors = true
      const idx = updatedLocal.findIndex((j) => j.id === item.id)
      if (idx >= 0) {
        updatedLocal[idx].syncStatus = 'sync_error'
        updatedLocal[idx].syncError = err.message
      }
    }
  }

  saveLocalJobs(userId, updatedLocal)
  return { success: !hasErrors, idMap }
}

export async function syncPendingApplications(userId, idMap = {}) {
  if (!isSupabaseConfigured || !userId) return false

  const localApps = getLocalApplications(userId)
  const currentJobs = getLocalJobs(userId)
  const currentResumes = getLocalResumes(userId)

  const pending = localApps.filter((a) => a.pendingSync || (typeof a.id === 'string' && a.id.startsWith('app-')))

  if (!pending.length) return true

  let hasErrors = false
  const updatedLocal = [...localApps]

  for (const item of pending) {
    try {
      let resolvedJobId = item.job_id

      // 1. Resolve job_id if temporary
      if (typeof resolvedJobId === 'string' && resolvedJobId.startsWith('job-')) {
        if (idMap[resolvedJobId]) {
          resolvedJobId = idMap[resolvedJobId]
        } else {
          // Check if already promoted in local jobs cache
          const matchedJob = currentJobs.find((j) => j.id === resolvedJobId || j.original_temp_id === resolvedJobId)
          if (matchedJob && !matchedJob.id.startsWith('job-')) {
            resolvedJobId = matchedJob.id
          } else {
            // Parent job not synced yet, keep application pending safely
            continue
          }
        }
      }

      // 2. Resolve resume_id if temporary
      let resolvedResumeId = item.resume_id
      if (typeof resolvedResumeId === 'string' && resolvedResumeId.startsWith('res-')) {
        const matchedResume = currentResumes.find((r) => r.id === resolvedResumeId)
        if (matchedResume && !matchedResume.id.startsWith('res-')) {
          resolvedResumeId = matchedResume.id
        } else {
          resolvedResumeId = null
        }
      }

      const isTempId = typeof item.id === 'string' && item.id.startsWith('app-')
      const payload = {
        user_id: userId,
        job_id: resolvedJobId,
        resume_id: resolvedResumeId,
        status: item.status || 'applied',
        applied_at: item.applied_at || new Date().toISOString(),
        deadline: item.deadline || '',
        notes: item.notes || '',
      }

      let savedData = null

      if (!isTempId) {
        const { data, error } = await supabase
          .from('career_applications')
          .update({ ...payload, updated_at: new Date().toISOString() })
          .eq('id', item.id)
          .eq('user_id', userId)
          .select()
          .single()
        if (error) throw error
        savedData = data
      } else {
        const { data, error } = await supabase
          .from('career_applications')
          .insert(payload)
          .select()
          .single()
        if (error) throw error
        savedData = data
      }

      const idx = updatedLocal.findIndex((a) => a.id === item.id)
      if (idx >= 0 && savedData) {
        updatedLocal[idx] = {
          ...savedData,
          job_id: resolvedJobId,
          pendingSync: false,
          syncStatus: 'cloud_saved',
        }
      }
    } catch (err) {
      console.warn('[jobService] Failed to sync application:', item.id, err.message)
      hasErrors = true
      const idx = updatedLocal.findIndex((a) => a.id === item.id)
      if (idx >= 0) {
        updatedLocal[idx].syncStatus = 'sync_error'
        updatedLocal[idx].syncError = err.message
      }
    }
  }

  saveLocalApplications(userId, updatedLocal)
  return !hasErrors
}

export async function syncAllJobsAndApplications(userId) {
  if (!isSupabaseConfigured || !userId) return false
  const { idMap } = await syncPendingJobs(userId)
  const appsSynced = await syncPendingApplications(userId, idMap)
  return appsSynced
}

export async function fetchJobs(userId) {
  if (!isSupabaseConfigured || !userId) {
    const jobs = getLocalJobs(userId).map((j) => ({
      ...j,
      syncStatus: j.pendingSync ? 'pending_sync' : 'local_offline',
    }))
    return { jobs, source: 'local', isLocal: true, status: 'success' }
  }

  // Attempt sync of pending local jobs first
  await syncPendingJobs(userId)

  try {
    const { data, error } = await supabase
      .from('career_jobs')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false })

    if (error) throw error

    const serverJobs = (data && data.length > 0 ? data : defaultJobs).map((j) => ({
      ...j,
      pendingSync: false,
      syncStatus: 'cloud_saved',
    }))

    // Merge any remaining unsynced local pending/error jobs so they never disappear
    const currentLocal = getLocalJobs(userId)
    const unsyncedPending = currentLocal.filter((j) => j.pendingSync || j.syncStatus === 'sync_error')

    const merged = [...unsyncedPending]
    serverJobs.forEach((sj) => {
      if (!merged.some((m) => m.id === sj.id)) {
        merged.push(sj)
      }
    })

    saveLocalJobs(userId, merged)

    return { jobs: merged, source: 'supabase', isLocal: false, status: 'success' }
  } catch (err) {
    console.warn('[jobService] Fetch jobs error, fallback to user-scoped local state:', err.message)
    const jobs = getLocalJobs(userId).map((j) => ({
      ...j,
      syncStatus: j.pendingSync ? 'pending_sync' : 'local_offline',
    }))
    return { jobs, source: 'local_fallback', isLocal: true, status: 'success', warning: err.message }
  }
}

export async function createJob(userId, jobData) {
  const newJob = {
    title: jobData.title || 'Untitled Opportunity',
    company: jobData.company || 'Company Name',
    location: jobData.location || 'Remote / Hybrid',
    work_type: jobData.work_type || 'Full-time',
    employment_type: jobData.employment_type || 'Remote',
    description: jobData.description || '',
    skills: Array.isArray(jobData.skills) ? jobData.skills : [],
    salary_range: jobData.salary_range || '',
    source: jobData.source || 'Manual Entry',
    source_url: jobData.source_url || '',
    deadline: jobData.deadline || '',
    status: 'active',
  }

  if (!isSupabaseConfigured || !userId) {
    const jobs = getLocalJobs(userId)
    const id = `job-${Date.now()}`
    const created = {
      ...newJob,
      id,
      user_id: userId || 'guest',
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
      pendingSync: true,
      syncStatus: 'local_offline',
    }
    jobs.unshift(created)
    saveLocalJobs(userId, jobs)
    return { status: 'success', job: created, source: 'local', isLocal: true, pendingSync: true }
  }

  try {
    const payload = { user_id: userId, ...newJob }
    const { data, error } = await supabase.from('career_jobs').insert(payload).select().single()
    if (error) throw error

    const fullCreated = { ...data, pendingSync: false, syncStatus: 'cloud_saved' }
    const jobs = getLocalJobs(userId)
    jobs.unshift(fullCreated)
    saveLocalJobs(userId, jobs)

    return { status: 'success', job: fullCreated, source: 'supabase', isLocal: false }
  } catch (err) {
    console.warn('[jobService] Create job error, saving to local queue:', err.message)
    const jobs = getLocalJobs(userId)
    const id = `job-${Date.now()}`
    const created = {
      ...newJob,
      id,
      user_id: userId,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
      pendingSync: true,
      syncStatus: 'pending_sync',
      syncError: err.message,
    }
    jobs.unshift(created)
    saveLocalJobs(userId, jobs)
    return { status: 'success', job: created, source: 'local_fallback', isLocal: true, pendingSync: true, warning: err.message }
  }
}

export async function updateJob(userId, jobId, updates) {
  const isTempId = typeof jobId === 'string' && jobId.startsWith('job-')

  if (!isSupabaseConfigured || !userId || isTempId) {
    const jobs = getLocalJobs(userId)
    const index = jobs.findIndex((j) => j.id === jobId)
    if (index >= 0) {
      jobs[index] = {
        ...jobs[index],
        ...updates,
        updated_at: new Date().toISOString(),
        pendingSync: true,
        syncStatus: 'pending_sync',
      }
      saveLocalJobs(userId, jobs)
    }
    return { status: 'success', source: 'local', isLocal: true, pendingSync: true }
  }

  try {
    const { data, error } = await supabase
      .from('career_jobs')
      .update({ ...updates, updated_at: new Date().toISOString() })
      .eq('id', jobId)
      .eq('user_id', userId)
      .select()
      .single()

    if (error) throw error

    const jobs = getLocalJobs(userId)
    const index = jobs.findIndex((j) => j.id === jobId)
    if (index >= 0) {
      jobs[index] = { ...data, pendingSync: false, syncStatus: 'cloud_saved' }
      saveLocalJobs(userId, jobs)
    }
    return { status: 'success', job: data, source: 'supabase', isLocal: false }
  } catch (err) {
    console.warn('[jobService] Update job error, queued locally:', err.message)
    const jobs = getLocalJobs(userId)
    const index = jobs.findIndex((j) => j.id === jobId)
    if (index >= 0) {
      jobs[index] = {
        ...jobs[index],
        ...updates,
        updated_at: new Date().toISOString(),
        pendingSync: true,
        syncStatus: 'pending_sync',
      }
      saveLocalJobs(userId, jobs)
    }
    return { status: 'success', source: 'local_fallback', isLocal: true, pendingSync: true }
  }
}

export async function deleteJob(userId, jobId) {
  const isTempId = typeof jobId === 'string' && jobId.startsWith('job-')

  if (!isSupabaseConfigured || !userId || isTempId) {
    let jobs = getLocalJobs(userId)
    jobs = jobs.filter((j) => j.id !== jobId)
    saveLocalJobs(userId, jobs)

    // Cascade delete local applications
    let apps = getLocalApplications(userId)
    apps = apps.filter((a) => a.job_id !== jobId)
    saveLocalApplications(userId, apps)

    return { status: 'success', source: 'local', isLocal: true }
  }

  try {
    const { error } = await supabase.from('career_jobs').delete().eq('id', jobId).eq('user_id', userId)
    if (error) throw error

    let jobs = getLocalJobs(userId)
    jobs = jobs.filter((j) => j.id !== jobId)
    saveLocalJobs(userId, jobs)

    let apps = getLocalApplications(userId)
    apps = apps.filter((a) => a.job_id !== jobId)
    saveLocalApplications(userId, apps)

    return { status: 'success', source: 'supabase', isLocal: false }
  } catch (err) {
    let jobs = getLocalJobs(userId)
    jobs = jobs.filter((j) => j.id !== jobId)
    saveLocalJobs(userId, jobs)

    let apps = getLocalApplications(userId)
    apps = apps.filter((a) => a.job_id !== jobId)
    saveLocalApplications(userId, apps)

    return { status: 'success', source: 'local_fallback', isLocal: true }
  }
}

export async function fetchApplications(userId) {
  if (!isSupabaseConfigured || !userId) {
    const applications = getLocalApplications(userId).map((a) => ({
      ...a,
      syncStatus: a.pendingSync ? 'pending_sync' : 'local_offline',
    }))
    return { applications, source: 'local', isLocal: true, status: 'success' }
  }

  // Attempt sync of pending local applications first
  await syncPendingApplications(userId)

  try {
    const { data, error } = await supabase
      .from('career_applications')
      .select('*')
      .eq('user_id', userId)
      .order('updated_at', { ascending: false })

    if (error) throw error

    const serverApps = (data && data.length > 0 ? data : defaultApplications).map((a) => ({
      ...a,
      pendingSync: false,
      syncStatus: 'cloud_saved',
    }))

    // Merge any remaining unsynced local pending/error applications
    const currentLocal = getLocalApplications(userId)
    const unsyncedPending = currentLocal.filter((a) => a.pendingSync || a.syncStatus === 'sync_error')

    const merged = [...unsyncedPending]
    serverApps.forEach((sa) => {
      if (!merged.some((m) => m.id === sa.id)) {
        merged.push(sa)
      }
    })

    saveLocalApplications(userId, merged)

    return { applications: merged, source: 'supabase', isLocal: false, status: 'success' }
  } catch (err) {
    console.warn('[jobService] Fetch applications error, fallback to user-scoped local state:', err.message)
    const applications = getLocalApplications(userId).map((a) => ({
      ...a,
      syncStatus: a.pendingSync ? 'pending_sync' : 'local_offline',
    }))
    return { applications, source: 'local_fallback', isLocal: true, status: 'success', warning: err.message }
  }
}

export async function createApplication(userId, appData) {
  const newApp = {
    job_id: appData.job_id,
    resume_id: appData.resume_id || null,
    status: appData.status || 'applied',
    applied_at: appData.applied_at || new Date().toISOString(),
    deadline: appData.deadline || '',
    notes: appData.notes || '',
  }

  const isJobTempId = typeof appData.job_id === 'string' && appData.job_id.startsWith('job-')

  if (!isSupabaseConfigured || !userId || isJobTempId) {
    const apps = getLocalApplications(userId)
    const id = `app-${Date.now()}`
    const created = {
      ...newApp,
      id,
      user_id: userId || 'guest',
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
      pendingSync: true,
      syncStatus: isJobTempId ? 'pending_sync' : 'local_offline',
    }
    apps.unshift(created)
    saveLocalApplications(userId, apps)
    return { status: 'success', application: created, source: 'local', isLocal: true, pendingSync: true }
  }

  try {
    const payload = { user_id: userId, ...newApp }
    const { data, error } = await supabase.from('career_applications').insert(payload).select().single()
    if (error) throw error

    const fullCreated = { ...data, pendingSync: false, syncStatus: 'cloud_saved' }
    const apps = getLocalApplications(userId)
    apps.unshift(fullCreated)
    saveLocalApplications(userId, apps)

    return { status: 'success', application: fullCreated, source: 'supabase', isLocal: false }
  } catch (err) {
    console.warn('[jobService] Create application error, saving locally:', err.message)
    const apps = getLocalApplications(userId)
    const id = `app-${Date.now()}`
    const created = {
      ...newApp,
      id,
      user_id: userId,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
      pendingSync: true,
      syncStatus: 'pending_sync',
      syncError: err.message,
    }
    apps.unshift(created)
    saveLocalApplications(userId, apps)
    return { status: 'success', application: created, source: 'local_fallback', isLocal: true, pendingSync: true, warning: err.message }
  }
}

export async function updateApplicationStatus(userId, appId, status, notes = null) {
  const updates = { status, updated_at: new Date().toISOString() }
  if (notes !== null) updates.notes = notes

  const isTempId = typeof appId === 'string' && appId.startsWith('app-')

  if (!isSupabaseConfigured || !userId || isTempId) {
    const apps = getLocalApplications(userId)
    const index = apps.findIndex((a) => a.id === appId)
    if (index >= 0) {
      apps[index] = {
        ...apps[index],
        ...updates,
        pendingSync: true,
        syncStatus: 'pending_sync',
      }
      saveLocalApplications(userId, apps)
    }
    return { status: 'success', source: 'local', isLocal: true, pendingSync: true }
  }

  try {
    const { data, error } = await supabase
      .from('career_applications')
      .update(updates)
      .eq('id', appId)
      .eq('user_id', userId)
      .select()
      .single()

    if (error) throw error

    const apps = getLocalApplications(userId)
    const index = apps.findIndex((a) => a.id === appId)
    if (index >= 0) {
      apps[index] = { ...data, pendingSync: false, syncStatus: 'cloud_saved' }
      saveLocalApplications(userId, apps)
    }
    return { status: 'success', application: data, source: 'supabase', isLocal: false }
  } catch (err) {
    console.warn('[jobService] Update application status error, queued locally:', err.message)
    const apps = getLocalApplications(userId)
    const index = apps.findIndex((a) => a.id === appId)
    if (index >= 0) {
      apps[index] = {
        ...apps[index],
        ...updates,
        pendingSync: true,
        syncStatus: 'pending_sync',
      }
      saveLocalApplications(userId, apps)
    }
    return { status: 'success', source: 'local_fallback', isLocal: true, pendingSync: true }
  }
}

export async function deleteApplication(userId, appId) {
  const isTempId = typeof appId === 'string' && appId.startsWith('app-')

  if (!isSupabaseConfigured || !userId || isTempId) {
    let apps = getLocalApplications(userId)
    apps = apps.filter((a) => a.id !== appId)
    saveLocalApplications(userId, apps)
    return { status: 'success', source: 'local', isLocal: true }
  }

  try {
    const { error } = await supabase.from('career_applications').delete().eq('id', appId).eq('user_id', userId)
    if (error) throw error

    let apps = getLocalApplications(userId)
    apps = apps.filter((a) => a.id !== appId)
    saveLocalApplications(userId, apps)

    return { status: 'success', source: 'supabase', isLocal: false }
  } catch (err) {
    let apps = getLocalApplications(userId)
    apps = apps.filter((a) => a.id !== appId)
    saveLocalApplications(userId, apps)
    return { status: 'success', source: 'local_fallback', isLocal: true }
  }
}
