import { isSupabaseConfigured, supabase } from '../lib/supabaseClient.js'

function getLocalResumesKey(userId) {
  return `projectAtlas.resumes.${userId || 'guest'}`
}

const defaultResumes = [
  {
    id: 'res-1',
    title: 'Senior Full Stack Engineer Resume',
    target_role: 'Full Stack Tech Lead',
    template_id: 'modern_tech',
    status: 'active',
    custom_headline: 'Senior Full Stack Engineer & Automation Specialist',
    custom_summary: 'Full Stack Engineer with 4+ years of expertise building React applications, system architectures, and workflow automation platforms.',
    created_at: '2026-08-10T10:00:00.000Z',
    updated_at: '2026-08-12T12:00:00.000Z',
    pendingSync: false,
    syncStatus: 'cloud_saved',
  },
  {
    id: 'res-2',
    title: 'Software Architect Resume',
    target_role: 'Solutions / Systems Architect',
    template_id: 'classic_executive',
    status: 'active',
    custom_headline: 'Systems Architect & Technical Lead',
    custom_summary: 'Specializing in robust SaaS architecture, multi-tenant databases, security policies, and rapid web application delivery.',
    created_at: '2026-08-11T14:30:00.000Z',
    updated_at: '2026-08-12T13:00:00.000Z',
    pendingSync: false,
    syncStatus: 'cloud_saved',
  },
]

const defaultSections = [
  { id: 'sec-1', section_type: 'summary', title: 'Professional Summary', sort_order: 1, is_enabled: true, config: {} },
  { id: 'sec-2', section_type: 'experience', title: 'Work & Experience', sort_order: 2, is_enabled: true, config: {} },
  { id: 'sec-3', section_type: 'education', title: 'Education & Academics', sort_order: 3, is_enabled: true, config: {} },
  { id: 'sec-4', section_type: 'skills', title: 'Core Competencies & Skills', sort_order: 4, is_enabled: true, config: {} },
]

export function getLocalResumes(userId) {
  try {
    const key = getLocalResumesKey(userId)
    const raw = window.localStorage.getItem(key)
    if (raw) {
      return JSON.parse(raw)
    }
  } catch {
    // Ignore restricted storage contexts
  }
  return defaultResumes
}

export function saveLocalResumes(userId, resumes) {
  try {
    const key = getLocalResumesKey(userId)
    window.localStorage.setItem(key, JSON.stringify(resumes))
  } catch {
    // Ignore restricted storage contexts
  }
}

export async function syncPendingResumes(userId) {
  if (!isSupabaseConfigured || !userId) return false

  const localResumes = getLocalResumes(userId)
  const pending = localResumes.filter((r) => r.pendingSync || (typeof r.id === 'string' && r.id.startsWith('res-')))

  if (!pending.length) return true

  let hasErrors = false
  const updatedLocal = [...localResumes]

  for (const item of pending) {
    try {
      const payload = {
        user_id: userId,
        title: item.title,
        target_role: item.target_role,
        template_id: item.template_id || 'modern_tech',
        status: item.status || 'active',
        custom_headline: item.custom_headline || '',
        custom_summary: item.custom_summary || '',
      }

      // If it has a real UUID, perform update; else insert
      const isTempId = typeof item.id === 'string' && item.id.startsWith('res-')
      let savedData = null

      if (!isTempId) {
        const { data, error } = await supabase
          .from('resumes')
          .update({ ...payload, updated_at: new Date().toISOString() })
          .eq('id', item.id)
          .eq('user_id', userId)
          .select()
          .single()
        if (error) throw error
        savedData = data
      } else {
        const { data, error } = await supabase.from('resumes').insert(payload).select().single()
        if (error) throw error
        savedData = data

        // Insert default sections for new cloud resume
        const defaultSectionsPayload = defaultSections.map((sec) => ({
          resume_id: data.id,
          user_id: userId,
          section_type: sec.section_type,
          title: sec.title,
          sort_order: sec.sort_order,
          is_enabled: sec.is_enabled,
          config: sec.config,
        }))
        await supabase.from('resume_sections').insert(defaultSectionsPayload)
      }

      // Replace temporary ID or mark synced in local state
      const idx = updatedLocal.findIndex((r) => r.id === item.id)
      if (idx >= 0 && savedData) {
        updatedLocal[idx] = {
          ...savedData,
          pendingSync: false,
          syncStatus: 'cloud_saved',
        }
      }
    } catch (err) {
      console.warn('[resumeService] Failed to sync resume:', item.title, err.message)
      hasErrors = true
      const idx = updatedLocal.findIndex((r) => r.id === item.id)
      if (idx >= 0) {
        updatedLocal[idx].syncStatus = 'sync_error'
        updatedLocal[idx].syncError = err.message
      }
    }
  }

  saveLocalResumes(userId, updatedLocal)
  return !hasErrors
}

export async function fetchResumes(userId) {
  if (!isSupabaseConfigured || !userId) {
    const resumes = getLocalResumes(userId).map((r) => ({
      ...r,
      syncStatus: r.pendingSync ? 'pending_sync' : 'local_offline',
    }))
    return { resumes, source: 'local', isLocal: true, status: 'success' }
  }

  // Attempt sync of pending local resumes first
  await syncPendingResumes(userId)

  try {
    const { data, error } = await supabase
      .from('resumes')
      .select('*')
      .eq('user_id', userId)
      .order('updated_at', { ascending: false })

    if (error) throw error

    const serverResumes = (data && data.length > 0 ? data : defaultResumes).map((r) => ({
      ...r,
      pendingSync: false,
      syncStatus: 'cloud_saved',
    }))

    // Merge any remaining unsynced local pending resumes so they never disappear
    const currentLocal = getLocalResumes(userId)
    const unsyncedPending = currentLocal.filter((r) => r.pendingSync || r.syncStatus === 'sync_error')

    const merged = [...unsyncedPending]
    serverResumes.forEach((sr) => {
      if (!merged.some((m) => m.id === sr.id)) {
        merged.push(sr)
      }
    })

    saveLocalResumes(userId, merged)

    return {
      resumes: merged,
      source: 'supabase',
      isLocal: false,
      status: 'success',
    }
  } catch (err) {
    console.warn('[resumeService] Supabase fetch error, fallback to user-scoped local state:', err.message)
    const resumes = getLocalResumes(userId).map((r) => ({
      ...r,
      syncStatus: r.pendingSync ? 'pending_sync' : 'local_offline',
    }))
    return { resumes, source: 'local_fallback', isLocal: true, status: 'success', warning: err.message }
  }
}

export async function fetchResumeById(userId, resumeId) {
  if (!isSupabaseConfigured || !userId || (typeof resumeId === 'string' && resumeId.startsWith('res-'))) {
    const resumes = getLocalResumes(userId)
    const resume = resumes.find((r) => r.id === resumeId) || defaultResumes[0]
    return {
      resume,
      sections: defaultSections,
      source: 'local',
      isLocal: true,
      status: 'success',
    }
  }

  try {
    const [resumeRes, sectionsRes] = await Promise.all([
      supabase.from('resumes').select('*').eq('id', resumeId).eq('user_id', userId).single(),
      supabase.from('resume_sections').select('*').eq('resume_id', resumeId).eq('user_id', userId).order('sort_order', { ascending: true }),
    ])

    if (resumeRes.error) throw resumeRes.error

    return {
      resume: { ...resumeRes.data, syncStatus: 'cloud_saved' },
      sections: sectionsRes.data && sectionsRes.data.length > 0 ? sectionsRes.data : defaultSections,
      source: 'supabase',
      isLocal: false,
      status: 'success',
    }
  } catch (err) {
    console.warn('[resumeService] Fetch resume by id error:', err.message)
    const resumes = getLocalResumes(userId)
    const resume = resumes.find((r) => r.id === resumeId) || defaultResumes[0]
    return { resume, sections: defaultSections, source: 'local_fallback', isLocal: true, status: 'success' }
  }
}

export async function createResume(userId, resumeData) {
  const newResume = {
    title: resumeData.title || 'Untitled Resume',
    target_role: resumeData.target_role || 'Software Engineer',
    template_id: resumeData.template_id || 'modern_tech',
    custom_headline: resumeData.custom_headline || '',
    custom_summary: resumeData.custom_summary || '',
    status: 'active',
  }

  if (!isSupabaseConfigured || !userId) {
    const resumes = getLocalResumes(userId)
    const id = `res-${Date.now()}`
    const created = {
      ...newResume,
      id,
      user_id: userId || 'local-user',
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
      pendingSync: true,
      syncStatus: 'local_offline',
    }
    resumes.unshift(created)
    saveLocalResumes(userId, resumes)
    return { status: 'success', resume: created, source: 'local', isLocal: true, pendingSync: true }
  }

  try {
    const payload = {
      user_id: userId,
      ...newResume,
    }

    const { data, error } = await supabase.from('resumes').insert(payload).select().single()

    if (error) throw error

    const defaultSectionsPayload = defaultSections.map((sec) => ({
      resume_id: data.id,
      user_id: userId,
      section_type: sec.section_type,
      title: sec.title,
      sort_order: sec.sort_order,
      is_enabled: sec.is_enabled,
      config: sec.config,
    }))

    await supabase.from('resume_sections').insert(defaultSectionsPayload)

    const fullCreated = { ...data, pendingSync: false, syncStatus: 'cloud_saved' }
    const resumes = getLocalResumes(userId)
    resumes.unshift(fullCreated)
    saveLocalResumes(userId, resumes)

    return { status: 'success', resume: fullCreated, source: 'supabase', isLocal: false }
  } catch (err) {
    console.warn('[resumeService] Create resume error, queuing locally:', err.message)
    const resumes = getLocalResumes(userId)
    const id = `res-${Date.now()}`
    const created = {
      ...newResume,
      id,
      user_id: userId,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
      pendingSync: true,
      syncStatus: 'pending_sync',
      syncError: err.message,
    }
    resumes.unshift(created)
    saveLocalResumes(userId, resumes)
    return { status: 'success', resume: created, source: 'local_fallback', isLocal: true, pendingSync: true, warning: err.message }
  }
}

export async function updateResume(userId, resumeId, updates) {
  const isTempId = typeof resumeId === 'string' && resumeId.startsWith('res-')

  if (!isSupabaseConfigured || !userId || isTempId) {
    const resumes = getLocalResumes(userId)
    const index = resumes.findIndex((r) => r.id === resumeId)
    if (index >= 0) {
      resumes[index] = {
        ...resumes[index],
        ...updates,
        updated_at: new Date().toISOString(),
        pendingSync: true,
        syncStatus: 'pending_sync',
      }
      saveLocalResumes(userId, resumes)
    }
    return { status: 'success', source: 'local', isLocal: true, pendingSync: true }
  }

  try {
    const { data, error } = await supabase
      .from('resumes')
      .update({ ...updates, updated_at: new Date().toISOString() })
      .eq('id', resumeId)
      .eq('user_id', userId)
      .select()
      .single()

    if (error) throw error

    const resumes = getLocalResumes(userId)
    const index = resumes.findIndex((r) => r.id === resumeId)
    if (index >= 0) {
      resumes[index] = { ...data, pendingSync: false, syncStatus: 'cloud_saved' }
      saveLocalResumes(userId, resumes)
    }

    return { status: 'success', resume: data, source: 'supabase', isLocal: false }
  } catch (err) {
    console.warn('[resumeService] Update resume error, updating local queue:', err.message)
    const resumes = getLocalResumes(userId)
    const index = resumes.findIndex((r) => r.id === resumeId)
    if (index >= 0) {
      resumes[index] = {
        ...resumes[index],
        ...updates,
        updated_at: new Date().toISOString(),
        pendingSync: true,
        syncStatus: 'pending_sync',
      }
      saveLocalResumes(userId, resumes)
    }
    return { status: 'success', source: 'local_fallback', isLocal: true, pendingSync: true }
  }
}

export async function deleteResume(userId, resumeId) {
  const isTempId = typeof resumeId === 'string' && resumeId.startsWith('res-')

  if (!isSupabaseConfigured || !userId || isTempId) {
    let resumes = getLocalResumes(userId)
    resumes = resumes.filter((r) => r.id !== resumeId)
    saveLocalResumes(userId, resumes)
    return { status: 'success', source: 'local', isLocal: true }
  }

  try {
    const { error } = await supabase.from('resumes').delete().eq('id', resumeId).eq('user_id', userId)
    if (error) throw error

    let resumes = getLocalResumes(userId)
    resumes = resumes.filter((r) => r.id !== resumeId)
    saveLocalResumes(userId, resumes)

    return { status: 'success', source: 'supabase', isLocal: false }
  } catch (err) {
    let resumes = getLocalResumes(userId)
    resumes = resumes.filter((r) => r.id !== resumeId)
    saveLocalResumes(userId, resumes)
    return { status: 'success', source: 'local_fallback', isLocal: true }
  }
}
