import { isSupabaseConfigured, supabase } from '../lib/supabaseClient.js'

function getLocalPortfolioKey(userId) {
  return `projectAtlas.portfolio.${userId || 'guest'}`
}

const defaultProjects = [
  {
    id: 'proj-1',
    title: 'Project Atlas — Multi-Suite Workspace',
    short_description: 'An integrated career and business document automation platform built with React and Supabase.',
    detailed_description: 'Architected an end-to-end multi-tenant platform with offline-resilient caching, optimistic concurrency conflict handling, and dynamic template engines.',
    project_type: 'Full Stack App',
    role: 'Lead Architect & Developer',
    technologies: ['React', 'Tailwind CSS', 'Supabase', 'PostgreSQL', 'Vite'],
    start_date: '2024-05',
    end_date: '2024-08',
    currently_active: true,
    project_url: 'https://atlas.aaryarushi.com',
    repository_url: 'https://github.com/rushich168-del/project-atlas-aaryarushi',
    image_url: '',
    achievements: 'Engineered unified Career Suite with deterministic skill gap evaluation and automated resume generation.',
    featured: true,
    is_public: true,
    display_order: 1,
    pendingSync: false,
    syncStatus: 'cloud_saved',
  },
  {
    id: 'proj-2',
    title: 'Document Generation & Templating Engine',
    short_description: 'High-speed DOCX and Excel generation engine for institutional certificates, marksheets, and invoices.',
    detailed_description: 'Built high-throughput document processing pipelines with customizable starter templates, barcode/QR generation, and structured storage validations.',
    project_type: 'Automation Tool',
    role: 'System Architect',
    technologies: ['Node.js', 'JavaScript (ESNext)', 'docx', 'xlsx', 'System Architecture'],
    start_date: '2024-01',
    end_date: '2024-04',
    currently_active: false,
    project_url: 'https://automation.aaryarushi.com/docs',
    repository_url: 'https://github.com/rushich168-del/doc-automation-engine',
    image_url: '',
    achievements: 'Processed 50,000+ automated documents with sub-second generation latency.',
    featured: true,
    is_public: true,
    display_order: 2,
    pendingSync: false,
    syncStatus: 'cloud_saved',
  },
  {
    id: 'proj-3',
    title: 'Multi-Tenant Auth & Access Gateway',
    short_description: 'Row Level Security policy engine with network exception recovery and user-scoped caching.',
    detailed_description: 'Designed secure data access layers with PostgreSQL RLS policies, session timeout recovery, and multi-device conflict reconciliation.',
    project_type: 'Backend API',
    role: 'Security Engineer',
    technologies: ['PostgreSQL', 'Supabase Auth', 'JWT', 'Security Architecture'],
    start_date: '2023-09',
    end_date: '2023-12',
    currently_active: false,
    project_url: '',
    repository_url: '',
    image_url: '',
    achievements: 'Achieved zero cross-tenant data leakage with 100% automated test coverage.',
    featured: false,
    is_public: true,
    display_order: 3,
    pendingSync: false,
    syncStatus: 'cloud_saved',
  },
]

const defaultPublicProfile = {
  slug: 'aaryarushi',
  is_published: true,
  headline: 'Senior Full Stack Engineer & Automation Specialist',
  bio: 'Engineering high-performance web applications, scalable workflow automation engines, and secure multi-tenant architectures.',
  location: 'Mumbai, India',
  custom_links: [
    { title: 'GitHub', url: 'https://github.com/rushich168-del' },
    { title: 'LinkedIn', url: 'https://linkedin.com/in/aaryarushi' },
    { title: 'Website', url: 'https://aaryarushi.com' },
  ],
}

function getLocalState(userId) {
  try {
    const key = getLocalPortfolioKey(userId)
    const raw = window.localStorage.getItem(key)
    if (raw) return JSON.parse(raw)
  } catch {
    // Ignore restricted storage contexts
  }
  return {
    projects: defaultProjects,
    publicProfile: defaultPublicProfile,
    customBio: defaultPublicProfile.bio,
  }
}

function saveLocalState(userId, state) {
  try {
    const key = getLocalPortfolioKey(userId)
    window.localStorage.setItem(key, JSON.stringify(state))
  } catch {
    // Ignore restricted storage contexts
  }
}

// 1. Portfolio Projects Synchronization
export async function syncPendingProjects(userId) {
  if (!isSupabaseConfigured || !userId) return { success: false }

  const local = getLocalState(userId)
  const pending = (local.projects || []).filter(
    (p) => p.pendingSync || (typeof p.id === 'string' && p.id.startsWith('proj-'))
  )

  if (!pending.length) return { success: true }

  let hasErrors = false
  const updatedProjects = [...local.projects]

  for (const item of pending) {
    try {
      const isTempId = typeof item.id === 'string' && item.id.startsWith('proj-')
      const payload = {
        user_id: userId,
        title: item.title,
        short_description: item.short_description || '',
        detailed_description: item.detailed_description || '',
        project_type: item.project_type || 'Full Stack App',
        role: item.role || 'Lead Developer',
        technologies: Array.isArray(item.technologies) ? item.technologies : [],
        start_date: item.start_date || '',
        end_date: item.end_date || '',
        currently_active: Boolean(item.currently_active),
        project_url: item.project_url || '',
        repository_url: item.repository_url || '',
        image_url: item.image_url || '',
        achievements: item.achievements || '',
        featured: Boolean(item.featured),
        is_public: item.is_public !== false,
        display_order: Number(item.display_order) || 0,
      }

      let savedData = null

      if (!isTempId) {
        const { data, error } = await supabase
          .from('career_portfolio_projects')
          .update({ ...payload, updated_at: new Date().toISOString() })
          .eq('id', item.id)
          .eq('user_id', userId)
          .select()
          .single()
        if (error) throw error
        savedData = data
      } else {
        const { data, error } = await supabase
          .from('career_portfolio_projects')
          .insert(payload)
          .select()
          .single()
        if (error) throw error
        savedData = data
      }

      const idx = updatedProjects.findIndex((p) => p.id === item.id)
      if (idx >= 0 && savedData) {
        updatedProjects[idx] = {
          ...savedData,
          pendingSync: false,
          syncStatus: 'cloud_saved',
        }
      }
    } catch (err) {
      console.warn('[portfolioService] Failed to sync project:', item.title, err.message)
      hasErrors = true
      const idx = updatedProjects.findIndex((p) => p.id === item.id)
      if (idx >= 0) {
        updatedProjects[idx].syncStatus = 'sync_error'
      }
    }
  }

  local.projects = updatedProjects
  saveLocalState(userId, local)
  return { success: !hasErrors }
}

// 2. Projects CRUD
export async function fetchProjects(userId) {
  const local = getLocalState(userId)
  if (!isSupabaseConfigured || !userId) {
    return { projects: local.projects || defaultProjects, source: 'local', isLocal: true }
  }

  // Attempt sync of pending projects first
  await syncPendingProjects(userId)

  try {
    const { data, error } = await supabase
      .from('career_portfolio_projects')
      .select('*')
      .eq('user_id', userId)
      .order('display_order', { ascending: true })

    if (error) throw error

    const serverProjects = (data && data.length > 0 ? data : defaultProjects).map((p) => ({
      ...p,
      pendingSync: false,
      syncStatus: 'cloud_saved',
    }))

    // Merge unsynced local pending projects so they never disappear
    const currentLocal = getLocalState(userId)
    const unsyncedPending = (currentLocal.projects || []).filter(
      (p) => p.pendingSync || p.syncStatus === 'sync_error'
    )

    const merged = [...unsyncedPending]
    serverProjects.forEach((sp) => {
      if (!merged.some((m) => m.id === sp.id)) {
        merged.push(sp)
      }
    })

    local.projects = merged
    saveLocalState(userId, local)

    return { projects: merged, source: 'supabase', isLocal: false }
  } catch (err) {
    return { projects: local.projects || defaultProjects, source: 'local_fallback', isLocal: true }
  }
}

export async function createProject(userId, projectData) {
  const local = getLocalState(userId)
  const id = `proj-${Date.now()}`
  const newProj = {
    ...projectData,
    id,
    user_id: userId || 'guest',
    technologies: Array.isArray(projectData.technologies) ? projectData.technologies : [],
    display_order: (local.projects?.length || 0) + 1,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
    pendingSync: true,
    syncStatus: 'pending_sync',
  }

  local.projects = [newProj, ...(local.projects || [])]
  saveLocalState(userId, local)

  if (isSupabaseConfigured && userId) {
    try {
      const payload = {
        user_id: userId,
        title: projectData.title,
        short_description: projectData.short_description || '',
        detailed_description: projectData.detailed_description || '',
        project_type: projectData.project_type || 'Full Stack App',
        role: projectData.role || 'Lead Developer',
        technologies: newProj.technologies,
        start_date: projectData.start_date || '',
        end_date: projectData.end_date || '',
        currently_active: Boolean(projectData.currently_active),
        project_url: projectData.project_url || '',
        repository_url: projectData.repository_url || '',
        image_url: projectData.image_url || '',
        achievements: projectData.achievements || '',
        featured: Boolean(projectData.featured),
        is_public: projectData.is_public !== false,
        display_order: newProj.display_order,
      }

      const { data, error } = await supabase
        .from('career_portfolio_projects')
        .insert(payload)
        .select()
        .single()

      if (!error && data) {
        const idx = local.projects.findIndex((p) => p.id === id)
        if (idx >= 0) {
          local.projects[idx] = { ...data, pendingSync: false, syncStatus: 'cloud_saved' }
          saveLocalState(userId, local)
        }
        return { status: 'success', project: data, source: 'supabase' }
      }
    } catch (err) {
      console.warn('[portfolioService] Create project Supabase warning:', err)
    }
  }

  return { status: 'success', project: newProj, source: 'local' }
}

export async function updateProject(userId, projectId, updates) {
  const local = getLocalState(userId)
  const idx = local.projects.findIndex((p) => p.id === projectId)
  if (idx >= 0) {
    local.projects[idx] = {
      ...local.projects[idx],
      ...updates,
      updated_at: new Date().toISOString(),
      pendingSync: true,
      syncStatus: 'pending_sync',
    }
    saveLocalState(userId, local)
  }

  if (isSupabaseConfigured && userId && !projectId.startsWith('proj-')) {
    try {
      const { data, error } = await supabase
        .from('career_portfolio_projects')
        .update({ ...updates, updated_at: new Date().toISOString() })
        .eq('id', projectId)
        .eq('user_id', userId)
        .select()
        .single()

      if (!error && data) {
        if (idx >= 0) {
          local.projects[idx] = { ...data, pendingSync: false, syncStatus: 'cloud_saved' }
          saveLocalState(userId, local)
        }
        return { status: 'success', project: data, source: 'supabase' }
      }
    } catch (err) {
      console.warn('[portfolioService] Update project error:', err)
    }
  }

  return { status: 'success', source: 'local' }
}

export async function deleteProject(userId, projectId) {
  const local = getLocalState(userId)
  local.projects = (local.projects || []).filter((p) => p.id !== projectId)
  saveLocalState(userId, local)

  if (isSupabaseConfigured && userId && !projectId.startsWith('proj-')) {
    try {
      await supabase.from('career_portfolio_projects').delete().eq('id', projectId).eq('user_id', userId)
    } catch (err) {
      console.warn('[portfolioService] Delete project error:', err)
    }
  }

  return { status: 'success' }
}

// 3. Public Profile Settings & Bio
export async function fetchPublicProfileSettings(userId, fallbackUser = null) {
  const local = getLocalState(userId)
  if (!isSupabaseConfigured || !userId) {
    return { settings: local.publicProfile || defaultPublicProfile, source: 'local', isLocal: true }
  }

  try {
    const { data, error } = await supabase
      .from('career_public_profiles')
      .select('*')
      .eq('user_id', userId)
      .maybeSingle()

    if (error) throw error

    const settings = data || {
      ...defaultPublicProfile,
      slug: fallbackUser?.email ? fallbackUser.email.split('@')[0].toLowerCase().replace(/[^a-z0-9]/g, '') : 'aaryarushi',
    }

    local.publicProfile = settings
    saveLocalState(userId, local)

    return { settings, source: 'supabase', isLocal: false }
  } catch (err) {
    return { settings: local.publicProfile || defaultPublicProfile, source: 'local_fallback', isLocal: true }
  }
}

export async function savePublicProfileSettings(userId, settings) {
  const local = getLocalState(userId)
  local.publicProfile = { ...local.publicProfile, ...settings }
  saveLocalState(userId, local)

  if (isSupabaseConfigured && userId) {
    try {
      const payload = {
        user_id: userId,
        slug: settings.slug || 'user',
        is_published: Boolean(settings.is_published),
        headline: settings.headline || '',
        bio: settings.bio || '',
        location: settings.location || '',
        custom_links: Array.isArray(settings.custom_links) ? settings.custom_links : [],
        updated_at: new Date().toISOString(),
      }

      await supabase.from('career_public_profiles').upsert(payload, { onConflict: 'user_id' })
    } catch (err) {
      console.warn('[portfolioService] Save public profile settings error:', err)
    }
  }

  return { status: 'success', settings: local.publicProfile }
}

// 4. Dedicated Public Recruiter Profile Fetcher (Zero Auth / Public Route)
export async function fetchPublishedPublicProfile(slug) {
  const sanitizedSlug = (slug || '').toLowerCase().trim()
  if (!sanitizedSlug) return { status: 'not_found' }

  // 1. In local / fallback mode, match default public profile slug
  if (!isSupabaseConfigured) {
    if (sanitizedSlug === defaultPublicProfile.slug && defaultPublicProfile.is_published) {
      return {
        status: 'published',
        profile: {
          full_name: 'Aarya Rushi',
          headline: defaultPublicProfile.headline,
          bio: defaultPublicProfile.bio,
          location: defaultPublicProfile.location,
          custom_links: defaultPublicProfile.custom_links,
        },
        skills: [
          { name: 'React / Next.js', proficiency: 'Advanced' },
          { name: 'JavaScript (ESNext)', proficiency: 'Expert' },
          { name: 'Supabase & PostgreSQL', proficiency: 'Advanced' },
          { name: 'System Architecture', proficiency: 'Advanced' },
          { name: 'Node.js & Vite', proficiency: 'Advanced' },
          { name: 'Tailwind CSS', proficiency: 'Intermediate' },
        ],
        experience: [
          {
            title: 'Lead System Architect & Full Stack Engineer',
            company: 'AaryaRushi Automation Labs',
            location: 'Mumbai, India',
            start_date: '2023-01',
            end_date: '',
            is_current: true,
            achievements: 'Architected unified document workspaces, enterprise automation tools, and offline-resilient multi-tenant platforms.',
          },
        ],
        education: [
          {
            degree: 'Bachelor of Technology',
            field_of_study: 'Computer Science & Engineering',
            institution: 'University of Mumbai',
            graduation_year: '2023',
          },
        ],
        projects: defaultProjects.filter((p) => p.is_public !== false),
      }
    }
    return { status: 'not_found' }
  }

  // 2. Query Supabase public profile where is_published = true
  try {
    const { data: publicProfile, error: pError } = await supabase
      .from('career_public_profiles')
      .select('user_id, slug, is_published, headline, bio, location, custom_links')
      .eq('slug', sanitizedSlug)
      .eq('is_published', true)
      .maybeSingle()

    if (pError || !publicProfile) {
      return { status: 'not_found' }
    }

    const userId = publicProfile.user_id

    // Fetch published public projects
    const { data: publicProjects } = await supabase
      .from('career_portfolio_projects')
      .select('id, title, short_description, detailed_description, project_type, role, technologies, start_date, end_date, project_url, repository_url, achievements, featured')
      .eq('user_id', userId)
      .eq('is_public', true)
      .order('display_order', { ascending: true })

    // Fetch user public profile name & summary
    const { data: userProfile } = await supabase
      .from('career_profiles')
      .select('full_name, headline, location, target_role')
      .eq('user_id', userId)
      .maybeSingle()

    // Fetch public skills
    const { data: skills } = await supabase
      .from('career_skills')
      .select('name, category, proficiency')
      .eq('user_id', userId)

    // Fetch public experience
    const { data: experience } = await supabase
      .from('career_experience')
      .select('title, company, location, start_date, end_date, is_current, achievements')
      .eq('user_id', userId)
      .order('start_date', { ascending: false })

    // Fetch public education
    const { data: education } = await supabase
      .from('career_education')
      .select('degree, field_of_study, institution, graduation_year')
      .eq('user_id', userId)

    return {
      status: 'published',
      profile: {
        full_name: userProfile?.full_name || 'Aarya Rushi',
        headline: publicProfile.headline || userProfile?.headline || 'Senior Full Stack Engineer',
        bio: publicProfile.bio,
        location: publicProfile.location || userProfile?.location || '',
        custom_links: publicProfile.custom_links || [],
      },
      skills: skills || [],
      experience: experience || [],
      education: education || [],
      projects: publicProjects || [],
    }
  } catch (err) {
    console.warn('[portfolioService] Fetch public profile error:', err.message)
    return { status: 'not_found' }
  }
}

// 5. Deterministic Bio & LinkedIn Blueprints
export function generateDraftBio(profile = {}, skills = [], experience = []) {
  const name = profile.full_name || 'Software Professional'
  const role = profile.target_role || profile.headline || 'Full Stack Engineer'
  const topSkills = skills.slice(0, 4).map((s) => s.name).join(', ')
  const latestExp = experience[0]

  return {
    technicalLeader: `${name} is a results-driven ${role} with proven expertise in ${topSkills || 'modern full stack web technologies'}.${latestExp ? ` Currently leading core architectural initiatives at ${latestExp.company}.` : ''} Dedicated to building resilient, multi-tenant software systems and streamlining development workflows.`,
    productEngineer: `Passionate ${role} specializing in scalable web application development, intuitive user interfaces, and automated backend systems. Experienced in end-to-end delivery using ${topSkills || 'React and Node.js'}. Focused on high performance and clean maintainable code.`,
    conciseSummary: `${role} skilled in ${topSkills || 'modern full stack systems'}. Focused on architecture excellence and rapid product delivery.`,
  }
}

export function generateLinkedInRecommendations(profile = {}, skills = [], experience = [], projects = []) {
  const name = profile.full_name || 'Aarya Rushi'
  const targetRole = profile.target_role || 'Senior Full Stack Engineer'
  const topSkills = skills.slice(0, 3).map((s) => s.name).join(' | ')

  const headlineSuggestions = [
    `${targetRole} | ${topSkills || 'React • Node.js • Cloud Architecture'} | Building Scalable Web Systems`,
    `${targetRole} @ ${experience[0]?.company || 'AaryaRushi Automation Labs'} | Workflow Automation & System Architecture`,
    `Technical Lead & ${targetRole} | Specializing in ${skills[0]?.name || 'Full Stack'} & Distributed Platforms`,
  ]

  const aboutDraft = `🚀 ${targetRole} passionate about architecting high-impact automation tools, performant web applications, and multi-tenant cloud platforms.\n\n🛠️ Core Competencies: ${skills.map((s) => s.name).join(' • ')}\n\n💡 Key Impact: Designed and shipped production-ready workspaces with zero data loss, offline sync architectures, and sub-second document generation.\n\n📫 Let's connect to discuss software architecture, web automation, and engineering leadership.`

  const experienceChecklist = [
    { title: 'Action Verbs', passed: true, detail: 'Start experience bullet points with strong action verbs (Architected, Spearheaded, Implemented).' },
    { title: 'Quantifiable Metrics', passed: Boolean(experience.some((e) => e.achievements)), detail: 'Include numerical business impact (e.g. 50k+ docs processed, 99.9% uptime).' },
    { title: 'Tech Stack Tags', passed: skills.length >= 4, detail: 'Tag primary technologies in each role description.' },
  ]

  const checks = [
    { label: 'Full Name', valid: Boolean(profile.full_name) },
    { label: 'Headline', valid: Boolean(profile.headline) },
    { label: 'Summary', valid: Boolean(profile.summary) },
    { label: 'Target Role', valid: Boolean(profile.target_role) },
    { label: 'Skills (3+)', valid: skills.length >= 3 },
    { label: 'Experience Record', valid: experience.length > 0 },
    { label: 'Education Record', valid: (profile.education?.length || 1) > 0 },
    { label: 'Featured Project', valid: projects.some((p) => p.featured) },
    { label: 'Public Slug Configured', valid: true },
  ]

  const passedCount = checks.filter((c) => c.valid).length
  const completenessScore = Math.round((passedCount / checks.length) * 100)

  return {
    name,
    headlineSuggestions,
    aboutDraft,
    experienceChecklist,
    checks,
    completenessScore,
  }
}
