import { isSupabaseConfigured, supabase } from '../lib/supabaseClient.js'

function getLocalSkillsInterviewKey(userId) {
  return `projectAtlas.skillsInterview.${userId || 'guest'}`
}

const proficiencyRanks = {
  Beginner: 1,
  Intermediate: 2,
  Advanced: 3,
  Expert: 4,
}

// 1. Role Skill Requirements Taxonomy
export const roleRequirementsTaxonomy = {
  'Senior Full Stack Engineer / Technical Lead': [
    { skill_name: 'React / Next.js', category: 'Technical', required_proficiency: 'Advanced', importance: 'Critical' },
    { skill_name: 'JavaScript (ESNext)', category: 'Technical', required_proficiency: 'Expert', importance: 'Critical' },
    { skill_name: 'Node.js & Vite', category: 'Technical', required_proficiency: 'Advanced', importance: 'High' },
    { skill_name: 'Supabase & PostgreSQL', category: 'Technical', required_proficiency: 'Advanced', importance: 'High' },
    { skill_name: 'System Architecture', category: 'Domain', required_proficiency: 'Advanced', importance: 'Critical' },
    { skill_name: 'Tailwind CSS', category: 'Technical', required_proficiency: 'Intermediate', importance: 'Medium' },
    { skill_name: 'Docker / Cloud Infra', category: 'Technical', required_proficiency: 'Intermediate', importance: 'High' },
    { skill_name: 'CI/CD & Testing', category: 'Technical', required_proficiency: 'Intermediate', importance: 'Medium' },
    { skill_name: 'Team Leadership & Mentoring', category: 'Soft Skill', required_proficiency: 'Advanced', importance: 'High' },
  ],
  'Software Architect': [
    { skill_name: 'System Architecture', category: 'Domain', required_proficiency: 'Expert', importance: 'Critical' },
    { skill_name: 'Supabase & PostgreSQL', category: 'Technical', required_proficiency: 'Expert', importance: 'Critical' },
    { skill_name: 'API Design & Microservices', category: 'Technical', required_proficiency: 'Advanced', importance: 'High' },
    { skill_name: 'Distributed Systems & Caching', category: 'Technical', required_proficiency: 'Advanced', importance: 'Critical' },
    { skill_name: 'Cloud Security & Auth Policies', category: 'Domain', required_proficiency: 'Advanced', importance: 'High' },
    { skill_name: 'React / Next.js', category: 'Technical', required_proficiency: 'Intermediate', importance: 'Medium' },
    { skill_name: 'Docker / Kubernetes', category: 'Technical', required_proficiency: 'Advanced', importance: 'High' },
  ],
  'Lead Automation Engineer': [
    { skill_name: 'JavaScript (ESNext)', category: 'Technical', required_proficiency: 'Expert', importance: 'Critical' },
    { skill_name: 'Node.js & Scripting', category: 'Technical', required_proficiency: 'Advanced', importance: 'Critical' },
    { skill_name: 'Workflow Automation Engines', category: 'Domain', required_proficiency: 'Advanced', importance: 'Critical' },
    { skill_name: 'Supabase & PostgreSQL', category: 'Technical', required_proficiency: 'Intermediate', importance: 'High' },
    { skill_name: 'API Integrations & Webhooks', category: 'Technical', required_proficiency: 'Advanced', importance: 'High' },
    { skill_name: 'CI/CD Pipelines', category: 'Technical', required_proficiency: 'Advanced', importance: 'High' },
  ],
  'General Software Engineer': [
    { skill_name: 'JavaScript (ESNext)', category: 'Technical', required_proficiency: 'Advanced', importance: 'Critical' },
    { skill_name: 'React / Next.js', category: 'Technical', required_proficiency: 'Intermediate', importance: 'High' },
    { skill_name: 'Supabase & PostgreSQL', category: 'Technical', required_proficiency: 'Intermediate', importance: 'High' },
    { skill_name: 'Git & Version Control', category: 'Technical', required_proficiency: 'Intermediate', importance: 'High' },
    { skill_name: 'Data Structures & Algorithms', category: 'Technical', required_proficiency: 'Intermediate', importance: 'High' },
  ],
}

// 2. Curated Interview Questions Library
export const interviewQuestionsLibrary = [
  {
    id: 'q-1',
    category: 'technical',
    role_name: 'Senior Full Stack Engineer / Technical Lead',
    question: 'How do you design a high-throughput multi-tenant database schema with Row Level Security (RLS)?',
    difficulty: 'Hard',
    related_skill: 'Supabase & PostgreSQL',
    hint: 'Discuss tenant isolation keys (user_id/org_id), PostgreSQL RLS policies, indexing strategy on foreign keys, and connection pooling.',
  },
  {
    id: 'q-2',
    category: 'technical',
    role_name: 'Senior Full Stack Engineer / Technical Lead',
    question: 'Explain the difference between optimistic concurrency control and pessimistic locking in web applications.',
    difficulty: 'Medium',
    related_skill: 'System Architecture',
    hint: 'Explain updated_at / version token comparisons vs SELECT FOR UPDATE locking, and describe how conflict resolution works on mobile/offline clients.',
  },
  {
    id: 'q-3',
    category: 'technical',
    role_name: 'Senior Full Stack Engineer / Technical Lead',
    question: 'How do you structure React component state and custom hooks to avoid unnecessary re-renders in large forms?',
    difficulty: 'Medium',
    related_skill: 'React / Next.js',
    hint: 'Discuss controlled vs uncontrolled inputs, custom hook abstraction, useMemo/useCallback boundaries, and modular component hierarchy.',
  },
  {
    id: 'q-4',
    category: 'behavioral',
    role_name: 'General',
    question: 'Describe a situation where you had to refactor a legacy architecture under a tight project deadline. How did you prioritize?',
    difficulty: 'Medium',
    related_skill: 'Team Leadership & Mentoring',
    hint: 'Use the STAR method: Situation, Task, Action (isolating dependencies, writing regression tests), and Result (zero production downtime).',
  },
  {
    id: 'q-5',
    category: 'hr',
    role_name: 'General',
    question: 'Why are you targeting this role, and how does your previous experience in automation labs align with our mission?',
    difficulty: 'Easy',
    related_skill: 'Career Vision',
    hint: 'Connect your direct accomplishments (document workspace, multi-suite platform architecture) with long-term engineering leadership.',
  },
]

// 3. Deterministic Skill Gap Calculator
export function calculateSkillGaps(userSkills = [], targetRoleName = 'Senior Full Stack Engineer / Technical Lead') {
  const requirements = roleRequirementsTaxonomy[targetRoleName] || roleRequirementsTaxonomy['General Software Engineer']

  const matrix = requirements.map((req) => {
    // Find matching user skill
    const userMatch = userSkills.find(
      (s) => s.name.toLowerCase().trim() === req.skill_name.toLowerCase().trim()
    )

    let status = 'Missing'
    const userProficiency = userMatch?.proficiency || 'None'
    const userRank = proficiencyRanks[userProficiency] || 0
    const reqRank = proficiencyRanks[req.required_proficiency] || 2

    if (userMatch) {
      if (userRank >= reqRank) {
        status = 'Strong'
      } else {
        status = 'Developing'
      }
    }

    return {
      skill_name: req.skill_name,
      category: req.category,
      required_proficiency: req.required_proficiency,
      importance: req.importance,
      user_proficiency: userProficiency,
      status, // 'Strong' | 'Developing' | 'Missing'
      gap_points: Math.max(0, reqRank - userRank),
    }
  })

  const strongCount = matrix.filter((m) => m.status === 'Strong').length
  const developingCount = matrix.filter((m) => m.status === 'Developing').length
  const missingCount = matrix.filter((m) => m.status === 'Missing').length
  const totalCount = matrix.length

  const overallScore = totalCount > 0
    ? Math.min(100, Math.round(((strongCount * 1.0 + developingCount * 0.5) / totalCount) * 100))
    : 0

  return {
    targetRole: targetRoleName,
    overallScore,
    strongCount,
    developingCount,
    missingCount,
    totalCount,
    matrix,
  }
}

// 4. Default Roadmaps Generator
export function generateDefaultRoadmap(userId, targetRole, gapMatrix = []) {
  const gapSkills = gapMatrix.filter((m) => m.status === 'Missing' || m.status === 'Developing')

  const items = gapSkills.map((gap, index) => ({
    id: `item-${index + 1}`,
    skill_name: gap.skill_name,
    title: `Master ${gap.skill_name} Competencies`,
    description: `Complete hands-on tutorials, architecture exercises, and build a working sample module in ${gap.skill_name}.`,
    sequence: index + 1,
    status: index === 0 ? 'in_progress' : 'not_started',
    target_date: `Phase ${index + 1}`,
    notes: `Focus on ${gap.required_proficiency} level requirements.`,
  }))

  return {
    id: `roadmap-${Date.now()}`,
    user_id: userId,
    target_role: targetRole,
    title: `${targetRole} — Competency Roadmap`,
    status: 'active',
    items: items.length > 0 ? items : [
      {
        id: 'item-1',
        skill_name: 'Advanced System Architecture',
        title: 'Deep Dive into Distributed System Design',
        description: 'Explore caching patterns, database partitioning, and enterprise security policies.',
        sequence: 1,
        status: 'in_progress',
        target_date: 'Phase 1',
        notes: 'Targeting Lead/Architect level proficiency.',
      },
    ],
  }
}

function getLocalState(userId) {
  try {
    const key = getLocalSkillsInterviewKey(userId)
    const raw = window.localStorage.getItem(key)
    if (raw) return JSON.parse(raw)
  } catch {
    // Ignore restricted storage contexts
  }
  return {
    roadmaps: [],
    practiceSessions: [],
  }
}

function saveLocalState(userId, state) {
  try {
    const key = getLocalSkillsInterviewKey(userId)
    window.localStorage.setItem(key, JSON.stringify(state))
  } catch {
    // Ignore restricted storage contexts
  }
}

export async function fetchRoadmap(userId, targetRole, gapMatrix = []) {
  const local = getLocalState(userId)
  let roadmap = local.roadmaps.find((r) => r.target_role === targetRole)

  if (!roadmap) {
    roadmap = generateDefaultRoadmap(userId, targetRole, gapMatrix)
    local.roadmaps.push(roadmap)
    saveLocalState(userId, local)
  }

  if (!isSupabaseConfigured || !userId) {
    return { roadmap, source: 'local', isLocal: true, status: 'success' }
  }

  try {
    const { data: dbRoadmaps, error: rError } = await supabase
      .from('career_roadmaps')
      .select('*')
      .eq('user_id', userId)
      .eq('target_role', targetRole)
      .maybeSingle()

    if (rError) throw rError

    if (dbRoadmaps) {
      const { data: dbItems } = await supabase
        .from('career_roadmap_items')
        .select('*')
        .eq('roadmap_id', dbRoadmaps.id)
        .order('sequence', { ascending: true })

      return {
        roadmap: { ...dbRoadmaps, items: dbItems || [] },
        source: 'supabase',
        isLocal: false,
        status: 'success',
      }
    }

    return { roadmap, source: 'local_fallback', isLocal: false, status: 'success' }
  } catch (err) {
    return { roadmap, source: 'local_fallback', isLocal: true, status: 'success' }
  }
}

export async function updateRoadmapItemStatus(userId, roadmapId, itemId, newStatus) {
  const local = getLocalState(userId)
  const rIdx = local.roadmaps.findIndex((r) => r.id === roadmapId)
  if (rIdx >= 0 && local.roadmaps[rIdx].items) {
    const itemIdx = local.roadmaps[rIdx].items.findIndex((i) => i.id === itemId)
    if (itemIdx >= 0) {
      local.roadmaps[rIdx].items[itemIdx].status = newStatus
      saveLocalState(userId, local)
    }
  }

  if (isSupabaseConfigured && userId && !itemId.startsWith('item-')) {
    try {
      await supabase
        .from('career_roadmap_items')
        .update({ status: newStatus, updated_at: new Date().toISOString() })
        .eq('id', itemId)
        .eq('user_id', userId)
    } catch (err) {
      console.warn('[skillsInterviewService] Failed to update item status in Supabase:', err)
    }
  }

  return { status: 'success', itemId, newStatus }
}

export async function fetchInterviewPractice(userId) {
  const local = getLocalState(userId)
  if (!isSupabaseConfigured || !userId) {
    return { practice: local.practiceSessions || [], source: 'local', isLocal: true }
  }

  try {
    const { data, error } = await supabase
      .from('career_interview_practice')
      .select('*')
      .eq('user_id', userId)
      .order('updated_at', { ascending: false })

    if (error) throw error
    return { practice: data || [], source: 'supabase', isLocal: false }
  } catch (err) {
    return { practice: local.practiceSessions || [], source: 'local_fallback', isLocal: true }
  }
}

export async function saveInterviewPractice(userId, practiceData) {
  const local = getLocalState(userId)
  const id = practiceData.id || `pract-${Date.now()}`
  const entry = {
    ...practiceData,
    id,
    user_id: userId || 'guest',
    updated_at: new Date().toISOString(),
  }

  const existingIdx = local.practiceSessions.findIndex((p) => p.question === practiceData.question)
  if (existingIdx >= 0) {
    local.practiceSessions[existingIdx] = entry
  } else {
    local.practiceSessions.unshift(entry)
  }
  saveLocalState(userId, local)

  if (isSupabaseConfigured && userId) {
    try {
      await supabase.from('career_interview_practice').upsert({
        user_id: userId,
        role_name: practiceData.role_name || 'General',
        category: practiceData.category || 'technical',
        question: practiceData.question,
        difficulty: practiceData.difficulty || 'Medium',
        related_skill: practiceData.related_skill || '',
        answer: practiceData.answer || '',
        status: practiceData.status || 'practiced',
        notes: practiceData.notes || '',
        updated_at: new Date().toISOString(),
      })
    } catch (err) {
      console.warn('[skillsInterviewService] Supabase interview practice save warning:', err)
    }
  }

  return { status: 'success', entry }
}
