import { isSupabaseConfigured, supabase } from '../lib/supabaseClient.js'

export const DEFAULT_ATS_WEIGHTS = {
  skillMatch: 0.35,        // 35%
  experienceMatch: 0.25,   // 25%
  keywordMatch: 0.20,      // 20%
  educationMatch: 0.10,    // 10%
  resumeCompleteness: 0.10 // 10%
}

function getLocalAnalysisKey(userId) {
  return `projectAtlas.jobAnalysis.${userId || 'guest'}`
}

const commonStopwords = new Set([
  'a', 'about', 'above', 'after', 'again', 'against', 'all', 'am', 'an', 'and', 'any', 'are', 'aren',
  'as', 'at', 'be', 'because', 'been', 'before', 'being', 'below', 'between', 'both', 'but', 'by',
  'can', 'could', 'did', 'do', 'does', 'doing', 'down', 'during', 'each', 'few', 'for', 'from',
  'further', 'had', 'has', 'have', 'having', 'he', 'her', 'here', 'hers', 'herself', 'him', 'himself',
  'his', 'how', 'i', 'if', 'in', 'into', 'is', 'it', 'its', 'itself', 'just', 'll', 'm', 'ma', 'me',
  'might', 'more', 'most', 'must', 'my', 'myself', 'no', 'nor', 'not', 'now', 'o', 'of', 'off', 'on',
  'once', 'only', 'or', 'other', 'our', 'ours', 'ourselves', 'out', 'over', 'own', 're', 's', 'same',
  'she', 'should', 'so', 'some', 'such', 't', 'than', 'that', 'the', 'their', 'theirs', 'them',
  'themselves', 'then', 'there', 'these', 'they', 'this', 'those', 'through', 'to', 'too', 'under',
  'until', 'up', 've', 'very', 'was', 'we', 'were', 'what', 'when', 'where', 'which', 'while', 'who',
  'whom', 'why', 'will', 'with', 'won', 'would', 'y', 'you', 'your', 'yours', 'yourself', 'yourselves',
  'role', 'responsibilities', 'looking', 'work', 'job', 'team', 'experience', 'ability', 'preferred'
])

export function extractKeywords(text = '') {
  if (!text || typeof text !== 'string') return []
  const clean = text.toLowerCase().replace(/[^a-z0-9+#.\s-]/g, ' ')
  const tokens = clean.split(/\s+/).filter(Boolean)
  const frequencyMap = new Map()

  tokens.forEach((word) => {
    if (word.length >= 2 && !commonStopwords.has(word) && !/^\d+$/.test(word)) {
      frequencyMap.set(word, (frequencyMap.get(word) || 0) + 1)
    }
  })

  return Array.from(frequencyMap.entries())
    .sort((a, b) => b[1] - a[1])
    .slice(0, 20)
    .map(([word]) => word)
}

export function calculateJobMatch(job = {}, profile = {}, skills = [], experience = [], education = [], resumes = [], weights = DEFAULT_ATS_WEIGHTS) {
  const safeJob = job || {}
  const safeProfile = profile || {}
  const safeSkills = Array.isArray(skills) ? skills.filter((s) => s && typeof s.name === 'string') : []
  const safeExperience = Array.isArray(experience) ? experience.filter((e) => e && typeof e === 'object') : []
  const safeEducation = Array.isArray(education) ? education.filter((e) => e && typeof e === 'object') : []
  const safeResumes = Array.isArray(resumes) ? resumes.filter((r) => r && typeof r === 'object') : []

  // 1. Skill Match Evaluation (35%)
  const jobSkills = Array.isArray(safeJob.skills) && safeJob.skills.length > 0
    ? safeJob.skills
    : ['React', 'Node.js', 'PostgreSQL', 'System Architecture']

  const matchedSkills = []
  const developingSkills = []
  const missingSkills = []

  jobSkills.forEach((reqSkill) => {
    const normalizedReq = reqSkill.toLowerCase().trim()
    const found = safeSkills.find((s) => s.name.toLowerCase().trim().includes(normalizedReq) || normalizedReq.includes(s.name.toLowerCase().trim()))

    if (found) {
      if (['Advanced', 'Expert'].includes(found.proficiency)) {
        matchedSkills.push({ name: reqSkill, proficiency: found.proficiency, status: 'Strong' })
      } else {
        developingSkills.push({ name: reqSkill, proficiency: found.proficiency || 'Intermediate', status: 'Developing' })
      }
    } else {
      missingSkills.push({ name: reqSkill, proficiency: 'None', status: 'Missing' })
    }
  })

  const totalSkillCount = jobSkills.length
  const skillScore = totalSkillCount > 0
    ? Math.min(100, Math.round(((matchedSkills.length * 1.0 + developingSkills.length * 0.6) / totalSkillCount) * 100))
    : 80

  // 2. Experience Match Evaluation (25%)
  const expCount = safeExperience.length
  const hasLeadRole = safeExperience.some((e) => /lead|architect|senior|manager/i.test(e.title || ''))
  let experienceScore = 50
  if (expCount >= 3) experienceScore = 95
  else if (expCount === 2) experienceScore = 85
  else if (expCount === 1) experienceScore = 70
  if (hasLeadRole) experienceScore = Math.min(100, experienceScore + 5)

  // 3. Keyword Match Evaluation (20%)
  const jobText = `${safeJob.title || ''} ${safeJob.description || ''} ${jobSkills.join(' ')}`
  const targetKeywords = extractKeywords(jobText)
  const candidateText = `${safeProfile.headline || ''} ${safeProfile.summary || ''} ${safeSkills.map((s) => s.name).join(' ')} ${safeExperience.map((e) => `${e.title || ''} ${e.achievements || ''}`).join(' ')}`.toLowerCase()

  const matchedKeywords = []
  const missingKeywords = []

  targetKeywords.forEach((kw) => {
    if (candidateText.includes(kw.toLowerCase())) {
      matchedKeywords.push(kw)
    } else {
      missingKeywords.push(kw)
    }
  })

  const totalKwCount = targetKeywords.length
  const keywordScore = totalKwCount > 0
    ? Math.min(100, Math.round((matchedKeywords.length / totalKwCount) * 100))
    : 85

  // 4. Education Match Evaluation (10%)
  const eduCount = safeEducation.length
  const educationScore = eduCount > 0 ? 95 : 60

  // 5. Resume Completeness & Coverage (10%)
  const resumeScore = safeResumes.length > 0 ? 90 : 50

  // Overall Weighted Score
  const rawScore = (
    skillScore * weights.skillMatch +
    experienceScore * weights.experienceMatch +
    keywordScore * weights.keywordMatch +
    educationScore * weights.educationMatch +
    resumeScore * weights.resumeCompleteness
  )

  const matchScore = Math.max(0, Math.min(100, Math.round(rawScore)))

  // 6. Resume Recommendation
  const rankedResumes = safeResumes.map((resume) => {
    const resumeSkills = Array.isArray(resume.skills) ? resume.skills : []
    let resumeSkillMatches = 0
    jobSkills.forEach((js) => {
      if (resumeSkills.some((rs) => rs.toLowerCase().includes(js.toLowerCase()) || js.toLowerCase().includes(rs.toLowerCase()))) {
        resumeSkillMatches++
      }
    })

    const titleAlignment = (resume.target_role || '').toLowerCase().includes((safeJob.title || '').toLowerCase()) || (safeJob.title || '').toLowerCase().includes((resume.target_role || '').toLowerCase())
    const alignmentScore = Math.min(100, Math.round(((resumeSkillMatches / (jobSkills.length || 1)) * 60) + (titleAlignment ? 40 : 20)))

    return {
      ...resume,
      alignmentScore,
      reasons: [
        `${Math.round((resumeSkillMatches / (jobSkills.length || 1)) * 100)}% required skill coverage`,
        titleAlignment ? `Aligned target role: ${resume.target_role}` : 'General role coverage',
        `${resume.sections?.length || 4} verified resume sections`,
      ],
    }
  }).sort((a, b) => b.alignmentScore - a.alignmentScore)

  const recommendedResume = rankedResumes[0] || null

  // 7. Actionable Improvement Recommendations
  const recommendations = []
  if (missingSkills.length > 0) {
    recommendations.push(`Add technical competency and project evidence for missing skills: ${missingSkills.map((s) => s.name).slice(0, 3).join(', ')}.`)
  }
  if (developingSkills.length > 0) {
    recommendations.push(`Upgrade listed proficiency for developing skills (${developingSkills.map((s) => s.name).join(', ')}) with hands-on deliverables.`)
  }
  if (missingKeywords.length > 0) {
    recommendations.push(`Incorporate high-frequency keywords into your summary & experience: ${missingKeywords.slice(0, 4).join(', ')}.`)
  }
  if (experienceScore < 80) {
    recommendations.push('Include quantifiable business metrics (e.g. latency reductions, uptime, throughput) in your experience highlights.')
  }
  if (!recommendedResume) {
    recommendations.push('Create a tailored resume version targeted specifically for this opportunity.')
  }

  return {
    jobId: job.id,
    matchScore,
    skillScore,
    experienceScore,
    keywordScore,
    educationScore,
    resumeScore,
    matchedSkills,
    developingSkills,
    missingSkills,
    matchedKeywords,
    missingKeywords,
    recommendedResume,
    rankedResumes,
    recommendations,
  }
}

function getLocalAnalysisMap(userId) {
  try {
    const key = getLocalAnalysisKey(userId)
    const raw = window.localStorage.getItem(key)
    if (raw) return JSON.parse(raw)
  } catch {
    // Ignore restricted storage contexts
  }
  return {}
}

function saveLocalAnalysisMap(userId, map) {
  try {
    const key = getLocalAnalysisKey(userId)
    window.localStorage.setItem(key, JSON.stringify(map))
  } catch {
    // Ignore restricted storage contexts
  }
}

export async function fetchJobAnalysis(userId, jobId) {
  const localMap = getLocalAnalysisMap(userId)
  const cached = localMap[jobId]

  if (!isSupabaseConfigured || !userId || (typeof jobId === 'string' && jobId.startsWith('job-'))) {
    return cached || null
  }

  try {
    const { data, error } = await supabase
      .from('career_job_analysis')
      .select('*')
      .eq('user_id', userId)
      .eq('job_id', jobId)
      .maybeSingle()

    if (error) throw error
    if (data) {
      localMap[jobId] = data
      saveLocalAnalysisMap(userId, localMap)
      return data
    }
    return cached || null
  } catch (err) {
    return cached || null
  }
}

export async function saveJobAnalysis(userId, analysis) {
  const localMap = getLocalAnalysisMap(userId)
  localMap[analysis.jobId] = analysis
  saveLocalAnalysisMap(userId, localMap)

  if (isSupabaseConfigured && userId && !analysis.jobId.startsWith('job-')) {
    try {
      const payload = {
        user_id: userId,
        job_id: analysis.jobId,
        resume_id: analysis.recommendedResume?.id && !analysis.recommendedResume.id.startsWith('res-') ? analysis.recommendedResume.id : null,
        match_score: analysis.matchScore,
        skill_score: analysis.skillScore,
        experience_score: analysis.experienceScore,
        keyword_score: analysis.keywordScore,
        education_score: analysis.educationScore,
        matched_skills: analysis.matchedSkills,
        missing_skills: analysis.missingSkills,
        matched_keywords: analysis.matchedKeywords,
        missing_keywords: analysis.missingKeywords,
        recommended_resume_id: analysis.recommendedResume?.id || '',
        recommendations: analysis.recommendations,
        updated_at: new Date().toISOString(),
      }

      await supabase.from('career_job_analysis').upsert(payload, { onConflict: 'user_id, job_id' })
    } catch (err) {
      console.warn('[jobMatchService] Save job analysis Supabase warning:', err)
    }
  }

  return { status: 'success', analysis }
}
