import { isSupabaseConfigured, supabase } from '../lib/supabaseClient.js'

function getLocalStorageKey(userId) {
  return `projectAtlas.careerProfile.${userId || 'guest'}`
}

const defaultProfile = {
  full_name: 'Aarya Rushi',
  headline: 'Full Stack Engineer & Automation Specialist',
  summary: 'Passionate about building highly efficient automation tools, workflow applications, and modern web software.',
  location: 'Mumbai, India',
  phone: '+91 98765 43210',
  email: 'aaryarushi@example.com',
  target_role: 'Senior Full Stack Engineer / Technical Lead',
  career_level: 'Mid-Senior',
  target_roles: ['Software Architect', 'Lead Automation Engineer', 'Product Engineer'],
  career_interests: ['Web Automation', 'AI Systems', 'System Architecture', 'React Ecosystem'],
}

const defaultEducation = [
  {
    id: 'edu-1',
    institution: 'University of Technology',
    degree: 'Bachelor of Technology',
    field_of_study: 'Computer Science & Engineering',
    start_date: '2020-08',
    end_date: '2024-05',
    grade: '8.8 CGPA',
    description: 'Specialized in Software Engineering, Database Systems, and Distributed Applications.',
  },
]

const defaultExperience = [
  {
    id: 'exp-1',
    company: 'AaryaRushi Automation Labs',
    job_title: 'Full Stack Developer',
    start_date: '2024-06',
    end_date: '',
    currently_working: true,
    description: 'Leading document automation engine development, multi-suite product architecture, and Supabase integration.',
    achievements: 'Architected DOCX generation engine and Career Suite unified workspace.',
  },
]

const defaultSkills = [
  { id: 'skill-1', name: 'React / Next.js', category: 'Technical', proficiency: 'Advanced' },
  { id: 'skill-2', name: 'JavaScript (ESNext)', category: 'Technical', proficiency: 'Expert' },
  { id: 'skill-3', name: 'Node.js & Vite', category: 'Technical', proficiency: 'Advanced' },
  { id: 'skill-4', name: 'Supabase & PostgreSQL', category: 'Technical', proficiency: 'Intermediate' },
  { id: 'skill-5', name: 'Tailwind CSS', category: 'Technical', proficiency: 'Advanced' },
  { id: 'skill-6', name: 'System Architecture', category: 'Domain', proficiency: 'Intermediate' },
]

export function getLocalProfileState(userId) {
  try {
    const key = getLocalStorageKey(userId)
    const data = window.localStorage.getItem(key)
    if (data) {
      return JSON.parse(data)
    }
  } catch {
    // Ignore restricted storage contexts
  }
  return {
    profile: defaultProfile,
    education: defaultEducation,
    experience: defaultExperience,
    skills: defaultSkills,
    syncBaseUpdatedAt: null,
    pendingSync: false,
    hasConflict: false,
    cloudVersion: null,
    localVersion: null,
  }
}

export function saveLocalProfileState(userId, state) {
  try {
    const key = getLocalStorageKey(userId)
    window.localStorage.setItem(key, JSON.stringify(state))
  } catch {
    // Ignore restricted storage contexts
  }
}

export async function syncPendingLocalProfile(userId) {
  if (!isSupabaseConfigured || !userId) return { status: 'offline', synced: false }

  const local = getLocalProfileState(userId)
  if (!local.pendingSync) return { status: 'clean', synced: true }

  try {
    // Check if remote version has changed since syncBaseUpdatedAt
    const { data: remoteProfile, error: fetchErr } = await supabase
      .from('career_profiles')
      .select('*')
      .eq('user_id', userId)
      .maybeSingle()

    if (fetchErr) throw fetchErr

    if (
      remoteProfile &&
      remoteProfile.updated_at &&
      local.syncBaseUpdatedAt &&
      new Date(remoteProfile.updated_at).getTime() > new Date(local.syncBaseUpdatedAt).getTime()
    ) {
      // Optimistic concurrency conflict detected!
      local.hasConflict = true
      local.cloudVersion = remoteProfile
      local.localVersion = local.profile
      saveLocalProfileState(userId, local)
      return {
        status: 'conflict',
        hasConflict: true,
        cloudVersion: remoteProfile,
        localVersion: local.profile,
      }
    }

    // Safe to upload local pending changes
    const { data: savedProfile, error: upsertErr } = await supabase
      .from('career_profiles')
      .upsert({
        user_id: userId,
        ...local.profile,
        updated_at: new Date().toISOString(),
      }, { onConflict: 'user_id' })
      .select()
      .single()

    if (upsertErr) throw upsertErr

    local.syncBaseUpdatedAt = savedProfile?.updated_at || new Date().toISOString()
    local.pendingSync = false
    local.hasConflict = false
    local.cloudVersion = null
    local.localVersion = null
    saveLocalProfileState(userId, local)

    return { status: 'success', synced: true }
  } catch (err) {
    console.warn('[careerProfileService] Sync pending profile error:', err.message)
    return { status: 'error', error: err.message, synced: false }
  }
}

export async function resolveProfileConflict(userId, choice) {
  const local = getLocalProfileState(userId)

  if (choice === 'cloud' && local.cloudVersion) {
    local.profile = { ...local.cloudVersion }
    local.syncBaseUpdatedAt = local.cloudVersion.updated_at
    local.pendingSync = false
    local.hasConflict = false
    local.cloudVersion = null
    local.localVersion = null
    saveLocalProfileState(userId, local)
    return { status: 'resolved', choice: 'cloud', profile: local.profile }
  }

  if (choice === 'local') {
    if (isSupabaseConfigured && userId) {
      try {
        const { data, error } = await supabase
          .from('career_profiles')
          .upsert({
            user_id: userId,
            ...local.profile,
            updated_at: new Date().toISOString(),
          }, { onConflict: 'user_id' })
          .select()
          .single()

        if (error) throw error

        local.syncBaseUpdatedAt = data?.updated_at || new Date().toISOString()
      } catch (err) {
        console.warn('[careerProfileService] Failed to force-sync local version:', err.message)
      }
    }

    local.pendingSync = false
    local.hasConflict = false
    local.cloudVersion = null
    local.localVersion = null
    saveLocalProfileState(userId, local)
    return { status: 'resolved', choice: 'local', profile: local.profile }
  }

  return { status: 'error', message: 'Invalid conflict resolution choice' }
}

export async function fetchCareerProfile(userId, fallbackUser = null) {
  if (!isSupabaseConfigured || !userId) {
    const local = getLocalProfileState(userId)
    if (fallbackUser?.email && !local.profile?.email) {
      local.profile.email = fallbackUser.email
    }
    return {
      ...local,
      source: 'local',
      isLocal: true,
      pendingSync: local.pendingSync || false,
      hasConflict: local.hasConflict || false,
      status: 'success',
    }
  }

  // Attempt sync of pending local changes first if not in conflict state
  const local = getLocalProfileState(userId)
  if (local.pendingSync && !local.hasConflict) {
    const syncRes = await syncPendingLocalProfile(userId)
    if (syncRes.hasConflict) {
      return {
        ...local,
        source: 'conflict',
        isLocal: true,
        pendingSync: true,
        hasConflict: true,
        cloudVersion: syncRes.cloudVersion,
        localVersion: syncRes.localVersion,
        status: 'conflict',
      }
    }
  }

  try {
    const [profileRes, eduRes, expRes, skillsRes] = await Promise.all([
      supabase.from('career_profiles').select('*').eq('user_id', userId).maybeSingle(),
      supabase.from('career_education').select('*').eq('user_id', userId).order('sort_order', { ascending: true }),
      supabase.from('career_experience').select('*').eq('user_id', userId).order('sort_order', { ascending: true }),
      supabase.from('career_skills').select('*').eq('user_id', userId).order('sort_order', { ascending: true }),
    ])

    if (profileRes.error) throw profileRes.error
    if (eduRes.error) throw eduRes.error
    if (expRes.error) throw expRes.error
    if (skillsRes.error) throw skillsRes.error

    const profileData = profileRes.data || {
      user_id: userId,
      full_name: fallbackUser?.user_metadata?.full_name || fallbackUser?.email?.split('@')[0] || defaultProfile.full_name,
      headline: defaultProfile.headline,
      summary: defaultProfile.summary,
      location: defaultProfile.location,
      phone: defaultProfile.phone,
      email: fallbackUser?.email || defaultProfile.email,
      target_role: defaultProfile.target_role,
      career_level: defaultProfile.career_level,
      target_roles: defaultProfile.target_roles,
      career_interests: defaultProfile.career_interests,
    }

    const fetchedState = {
      profile: profileData,
      education: eduRes.data && eduRes.data.length > 0 ? eduRes.data : defaultEducation,
      experience: expRes.data && expRes.data.length > 0 ? expRes.data : defaultExperience,
      skills: skillsRes.data && skillsRes.data.length > 0 ? skillsRes.data : defaultSkills,
      syncBaseUpdatedAt: profileRes.data?.updated_at || null,
      pendingSync: false,
      hasConflict: false,
      cloudVersion: null,
      localVersion: null,
    }

    saveLocalProfileState(userId, fetchedState)

    return {
      ...fetchedState,
      source: 'supabase',
      isLocal: false,
      status: 'success',
    }
  } catch (err) {
    console.warn('[careerProfileService] Supabase fetch warning, using user-scoped local state:', err.message)
    return {
      ...local,
      source: 'local_fallback',
      isLocal: true,
      pendingSync: local.pendingSync || false,
      hasConflict: local.hasConflict || false,
      status: 'success',
      error: err.message,
    }
  }
}

export async function saveCareerProfileIdentity(userId, profileData) {
  if (!isSupabaseConfigured || !userId) {
    const state = getLocalProfileState(userId)
    state.profile = { ...state.profile, ...profileData }
    state.pendingSync = true
    saveLocalProfileState(userId, state)
    return { status: 'success', source: 'local', isLocal: true, pendingSync: true, message: 'Saved to user local cache (Supabase offline).' }
  }

  try {
    const payload = {
      user_id: userId,
      ...profileData,
      updated_at: new Date().toISOString(),
    }

    const { data, error } = await supabase
      .from('career_profiles')
      .upsert(payload, { onConflict: 'user_id' })
      .select()
      .single()

    if (error) throw error

    const state = getLocalProfileState(userId)
    state.profile = { ...state.profile, ...profileData }
    state.syncBaseUpdatedAt = data?.updated_at || payload.updated_at
    state.pendingSync = false
    state.hasConflict = false
    saveLocalProfileState(userId, state)

    return { status: 'success', source: 'supabase', isLocal: false, pendingSync: false, message: 'Persisted to Supabase account cloud storage.' }
  } catch (err) {
    console.warn('[careerProfileService] Save profile error:', err.message)
    const state = getLocalProfileState(userId)
    state.profile = { ...state.profile, ...profileData }
    state.pendingSync = true
    saveLocalProfileState(userId, state)
    return { status: 'success', source: 'local_fallback', isLocal: true, pendingSync: true, message: 'Saved to local workspace cache (Supabase server offline).', warning: err.message }
  }
}

export async function saveEducationItem(userId, educationData) {
  if (!isSupabaseConfigured || !userId) {
    const state = getLocalProfileState(userId)
    const id = educationData.id || `edu-${Date.now()}`
    const updatedItem = { ...educationData, id }
    const existingIndex = state.education.findIndex((item) => item.id === id)

    if (existingIndex >= 0) {
      state.education[existingIndex] = updatedItem
    } else {
      state.education.push(updatedItem)
    }

    state.pendingSync = true
    saveLocalProfileState(userId, state)
    return { status: 'success', item: updatedItem, source: 'local', isLocal: true, pendingSync: true }
  }

  try {
    const payload = {
      user_id: userId,
      institution: educationData.institution,
      degree: educationData.degree || '',
      field_of_study: educationData.field_of_study || '',
      start_date: educationData.start_date || '',
      end_date: educationData.end_date || '',
      grade: educationData.grade || '',
      description: educationData.description || '',
    }

    if (educationData.id && !educationData.id.startsWith('edu-')) {
      payload.id = educationData.id
    }

    const { data, error } = await supabase
      .from('career_education')
      .upsert(payload)
      .select()
      .single()

    if (error) throw error

    return { status: 'success', item: data, source: 'supabase', isLocal: false }
  } catch (err) {
    console.warn('[careerProfileService] Save education error:', err.message)
    const state = getLocalProfileState(userId)
    const id = educationData.id || `edu-${Date.now()}`
    const updatedItem = { ...educationData, id }
    const existingIndex = state.education.findIndex((item) => item.id === id)

    if (existingIndex >= 0) {
      state.education[existingIndex] = updatedItem
    } else {
      state.education.push(updatedItem)
    }

    state.pendingSync = true
    saveLocalProfileState(userId, state)
    return { status: 'success', item: updatedItem, source: 'local_fallback', isLocal: true, pendingSync: true }
  }
}

export async function deleteEducationItem(userId, educationId) {
  if (!isSupabaseConfigured || !userId || educationId.startsWith('edu-')) {
    const state = getLocalProfileState(userId)
    state.education = state.education.filter((item) => item.id !== educationId)
    state.pendingSync = true
    saveLocalProfileState(userId, state)
    return { status: 'success', source: 'local', isLocal: true, pendingSync: true }
  }

  try {
    const { error } = await supabase
      .from('career_education')
      .delete()
      .eq('id', educationId)
      .eq('user_id', userId)

    if (error) throw error

    return { status: 'success', source: 'supabase', isLocal: false }
  } catch (err) {
    const state = getLocalProfileState(userId)
    state.education = state.education.filter((item) => item.id !== educationId)
    state.pendingSync = true
    saveLocalProfileState(userId, state)
    return { status: 'success', source: 'local_fallback', isLocal: true, pendingSync: true }
  }
}

export async function saveExperienceItem(userId, experienceData) {
  if (!isSupabaseConfigured || !userId) {
    const state = getLocalProfileState(userId)
    const id = experienceData.id || `exp-${Date.now()}`
    const updatedItem = { ...experienceData, id }
    const existingIndex = state.experience.findIndex((item) => item.id === id)

    if (existingIndex >= 0) {
      state.experience[existingIndex] = updatedItem
    } else {
      state.experience.push(updatedItem)
    }

    state.pendingSync = true
    saveLocalProfileState(userId, state)
    return { status: 'success', item: updatedItem, source: 'local', isLocal: true, pendingSync: true }
  }

  try {
    const payload = {
      user_id: userId,
      company: experienceData.company,
      job_title: experienceData.job_title,
      start_date: experienceData.start_date || '',
      end_date: experienceData.end_date || '',
      currently_working: Boolean(experienceData.currently_working),
      description: experienceData.description || '',
      achievements: experienceData.achievements || '',
    }

    if (experienceData.id && !experienceData.id.startsWith('exp-')) {
      payload.id = experienceData.id
    }

    const { data, error } = await supabase
      .from('career_experience')
      .upsert(payload)
      .select()
      .single()

    if (error) throw error

    return { status: 'success', item: data, source: 'supabase', isLocal: false }
  } catch (err) {
    console.warn('[careerProfileService] Save experience error:', err.message)
    const state = getLocalProfileState(userId)
    const id = experienceData.id || `exp-${Date.now()}`
    const updatedItem = { ...experienceData, id }
    const existingIndex = state.experience.findIndex((item) => item.id === id)

    if (existingIndex >= 0) {
      state.experience[existingIndex] = updatedItem
    } else {
      state.experience.push(updatedItem)
    }

    state.pendingSync = true
    saveLocalProfileState(userId, state)
    return { status: 'success', item: updatedItem, source: 'local_fallback', isLocal: true, pendingSync: true }
  }
}

export async function deleteExperienceItem(userId, experienceId) {
  if (!isSupabaseConfigured || !userId || experienceId.startsWith('exp-')) {
    const state = getLocalProfileState(userId)
    state.experience = state.experience.filter((item) => item.id !== experienceId)
    state.pendingSync = true
    saveLocalProfileState(userId, state)
    return { status: 'success', source: 'local', isLocal: true, pendingSync: true }
  }

  try {
    const { error } = await supabase
      .from('career_experience')
      .delete()
      .eq('id', experienceId)
      .eq('user_id', userId)

    if (error) throw error

    return { status: 'success', source: 'supabase', isLocal: false }
  } catch (err) {
    const state = getLocalProfileState(userId)
    state.experience = state.experience.filter((item) => item.id !== experienceId)
    state.pendingSync = true
    saveLocalProfileState(userId, state)
    return { status: 'success', source: 'local_fallback', isLocal: true, pendingSync: true }
  }
}

export async function saveSkillItem(userId, skillData) {
  if (!isSupabaseConfigured || !userId) {
    const state = getLocalProfileState(userId)
    const id = skillData.id || `skill-${Date.now()}`
    const updatedItem = { ...skillData, id }
    const existingIndex = state.skills.findIndex((item) => item.id === id)

    if (existingIndex >= 0) {
      state.skills[existingIndex] = updatedItem
    } else {
      state.skills.push(updatedItem)
    }

    state.pendingSync = true
    saveLocalProfileState(userId, state)
    return { status: 'success', item: updatedItem, source: 'local', isLocal: true, pendingSync: true }
  }

  try {
    const payload = {
      user_id: userId,
      name: skillData.name,
      category: skillData.category || 'Technical',
      proficiency: skillData.proficiency || 'Intermediate',
    }

    if (skillData.id && !skillData.id.startsWith('skill-')) {
      payload.id = skillData.id
    }

    const { data, error } = await supabase
      .from('career_skills')
      .upsert(payload)
      .select()
      .single()

    if (error) throw error

    return { status: 'success', item: data, source: 'supabase', isLocal: false }
  } catch (err) {
    console.warn('[careerProfileService] Save skill error:', err.message)
    const state = getLocalProfileState(userId)
    const id = skillData.id || `skill-${Date.now()}`
    const updatedItem = { ...skillData, id }
    const existingIndex = state.skills.findIndex((item) => item.id === id)

    if (existingIndex >= 0) {
      state.skills[existingIndex] = updatedItem
    } else {
      state.skills.push(updatedItem)
    }

    state.pendingSync = true
    saveLocalProfileState(userId, state)
    return { status: 'success', item: updatedItem, source: 'local_fallback', isLocal: true, pendingSync: true }
  }
}

export async function deleteSkillItem(userId, skillId) {
  if (!isSupabaseConfigured || !userId || skillId.startsWith('skill-')) {
    const state = getLocalProfileState(userId)
    state.skills = state.skills.filter((item) => item.id !== skillId)
    state.pendingSync = true
    saveLocalProfileState(userId, state)
    return { status: 'success', source: 'local', isLocal: true, pendingSync: true }
  }

  try {
    const { error } = await supabase
      .from('career_skills')
      .delete()
      .eq('id', skillId)
      .eq('user_id', userId)

    if (error) throw error

    return { status: 'success', source: 'supabase', isLocal: false }
  } catch (err) {
    const state = getLocalProfileState(userId)
    state.skills = state.skills.filter((item) => item.id !== skillId)
    state.pendingSync = true
    saveLocalProfileState(userId, state)
    return { status: 'success', source: 'local_fallback', isLocal: true, pendingSync: true }
  }
}
