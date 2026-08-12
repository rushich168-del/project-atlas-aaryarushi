import { isSupabaseConfigured, supabase } from '../lib/supabaseClient.js'

function getLocalAssistantKey(userId) {
  return `projectAtlas.appAssistant.${userId || 'guest'}`
}

export function getApplicationStrengthTier(score = 0) {
  if (score >= 90) return { tier: 'Excellent Match', color: 'text-emerald-700 bg-emerald-50 border-emerald-200' }
  if (score >= 75) return { tier: 'Strong Match', color: 'text-teal-700 bg-teal-50 border-teal-200' }
  if (score >= 60) return { tier: 'Moderate Match', color: 'text-blue-700 bg-blue-50 border-blue-200' }
  if (score >= 40) return { tier: 'Weak Match', color: 'text-amber-700 bg-amber-50 border-amber-200' }
  return { tier: 'Low Match', color: 'text-red-700 bg-red-50 border-red-200' }
}

export function generateApplicationStrategy(job = {}, profile = {}, atsAnalysis = {}, recommendedResume = null) {
  const matchScore = atsAnalysis.matchScore || 0
  const strength = getApplicationStrengthTier(matchScore)
  const matchedSkills = (atsAnalysis.matchedSkills || []).map((s) => s.name || s)
  const missingSkills = (atsAnalysis.missingSkills || []).map((s) => s.name || s)
  const matchedKeywords = atsAnalysis.matchedKeywords || []
  const missingKeywords = atsAnalysis.missingKeywords || []

  const strongestPoints = []
  if (matchedSkills.length > 0) {
    strongestPoints.push(`Strong alignment in core competencies: ${matchedSkills.slice(0, 4).join(', ')}.`)
  }
  if (atsAnalysis.experienceScore >= 80) {
    strongestPoints.push('Substantial professional track record matching the required role seniority.')
  }
  if (matchedKeywords.length >= 3) {
    strongestPoints.push(`High keyword density matching job posting requirements (${matchedKeywords.length} verified terms).`)
  }

  const missingRequirements = []
  if (missingSkills.length > 0) {
    missingRequirements.push(`Key technical skills not listed on profile: ${missingSkills.slice(0, 4).join(', ')}.`)
  }
  if (missingKeywords.length > 0) {
    missingKeywords.push(`High-frequency posting keywords to incorporate: ${missingKeywords.slice(0, 4).join(', ')}.`)
  }

  const recommendedActions = []
  if (missingKeywords.length > 0) {
    recommendedActions.push(`Weave keywords (${missingKeywords.slice(0, 3).join(', ')}) into your customized cover letter and tailored resume summary.`)
  }
  if (recommendedResume) {
    recommendedActions.push(`Use recommended resume version "${recommendedResume.title}" featuring ${recommendedResume.alignmentScore}% role alignment.`)
  } else {
    recommendedActions.push('Create a dedicated resume version tailored for this job.')
  }
  recommendedActions.push('Review the generated cover letter draft and customize your opening statement.')

  return {
    matchScore,
    applicationStrength: strength.tier,
    strengthColor: strength.color,
    strongestPoints,
    missingRequirements,
    recommendedActions,
    resumeStrategy: recommendedResume ? `Recommended version: ${recommendedResume.title}` : 'General profile application',
    keywordStrategy: matchedKeywords.length > 0 ? `${matchedKeywords.length} matched keywords, ${missingKeywords.length} recommended` : 'General domain coverage',
  }
}

export function generateTailoredBulletSuggestions(job = {}, experience = [], skills = [], atsAnalysis = {}) {
  const suggestions = []
  const jobTitle = job.title || 'Target Role'
  const matchedKeywords = (atsAnalysis.matchedKeywords || []).slice(0, 4)

  experience.forEach((exp, idx) => {
    if (exp.achievements && typeof exp.achievements === 'string') {
      const originalLines = exp.achievements.split('\n').map((l) => l.trim()).filter(Boolean)

      originalLines.forEach((line, lIdx) => {
        // Deterministically polish active voice while STRICTLY preserving the candidate's existing factual statement
        const cleanLine = line.replace(/^[•\-\*\s]+/, '').trim()
        if (cleanLine.length > 10) {
          // Enhances phrasing without hallucinating fake metrics or false technologies
          const suggestionText = cleanLine.startsWith('Responsible for')
            ? cleanLine.replace(/^Responsible for/i, 'Led and executed')
            : cleanLine.startsWith('Worked on')
            ? cleanLine.replace(/^Worked on/i, 'Engineered and maintained')
            : cleanLine.startsWith('Helped with')
            ? cleanLine.replace(/^Helped with/i, 'Collaborated across teams to deliver')
            : `Executed: ${cleanLine}`

          suggestions.push({
            id: `bullet-${idx}-${lIdx}`,
            roleTitle: exp.title || 'Professional Role',
            company: exp.company_name || 'Organization',
            original: cleanLine,
            suggested: suggestionText,
            rationale: `Refined active phrasing aligned with ${jobTitle} requirements.`,
            status: 'suggested', // 'suggested' | 'used' | 'discarded'
          })
        }
      })
    }
  })

  // If no detailed achievements existed on profile, provide structured wording based on user's real skills & role
  if (suggestions.length === 0 && skills.length > 0) {
    const candidateSkills = skills.slice(0, 3).map((s) => s.name).join(', ')
    suggestions.push({
      id: 'bullet-fallback-1',
      roleTitle: profileRoleTitle(experience),
      company: 'Verified Experience',
      original: `Skilled in ${candidateSkills}`,
      suggested: `Leveraged core competencies in ${candidateSkills} to develop robust solutions aligned with organizational standards.`,
      rationale: 'Structured competency bullet based on verified profile skills.',
      status: 'suggested',
    })
  }

  return suggestions
}

function profileRoleTitle(experience = []) {
  if (experience.length > 0 && experience[0].title) return experience[0].title
  return 'Professional Candidate'
}

export function generateCoverLetterDraft(job = {}, profile = {}, experience = [], skills = [], atsAnalysis = {}, recommendedResume = null) {
  const candidateName = profile.full_name || 'Candidate'
  const targetJobTitle = job.title || 'Open Position'
  const companyName = job.company || 'the Team'
  const candidateHeadline = profile.headline || 'Dedicated Professional'
  const locationStr = profile.location ? ` based in ${profile.location}` : ''

  const matchedSkillsList = (atsAnalysis.matchedSkills || []).map((s) => s.name || s).slice(0, 5)
  const skillsText = matchedSkillsList.length > 0
    ? matchedSkillsList.join(', ')
    : skills.slice(0, 4).map((s) => s.name).join(', ') || 'technical and analytical problem solving'

  let expSummary = ''
  if (experience.length > 0) {
    const recentExp = experience[0]
    expSummary = `In my previous role as ${recentExp.title} at ${recentExp.company_name || 'my organization'}, I focused on delivering high-reliability solutions and collaborating effectively across teams.`
  } else {
    expSummary = `Throughout my professional background, I have developed strong foundational expertise and a disciplined approach to delivering measurable results.`
  }

  const currentDate = new Date().toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })

  return `${candidateName}
${profile.location || 'Professional Location'}
${currentDate}

Hiring Team
${companyName}

Subject: Application for ${targetJobTitle} position

Dear Hiring Team at ${companyName},

I am writing to express my strong interest in the ${targetJobTitle} position at ${companyName}. As a ${candidateHeadline}${locationStr}, I am excited by the opportunity to bring my hands-on experience and technical capabilities to your organization.

${expSummary} My core background encompasses ${skillsText}, which closely aligns with the requirements outlined for this role. I take pride in engineering scalable, high-quality deliverables and continuously expanding my technical domain.

What particularly attracts me to ${companyName} is the opportunity to contribute to high-impact challenges in ${job.work_type || 'full-time'} environments. I am confident that my work ethic, dedication to best practices, and adaptability will enable me to make immediate and valuable contributions to your team.

Thank you for your time and consideration. I welcome the opportunity to discuss how my verified background and qualifications align with ${companyName}'s current goals.

Sincerely,

${candidateName}
${profile.headline || ''}`
}

function getLocalAssistantMap(userId) {
  try {
    const key = getLocalAssistantKey(userId)
    const raw = window.localStorage.getItem(key)
    if (raw) return JSON.parse(raw)
  } catch {
    // Ignore restricted contexts
  }
  return {}
}

function saveLocalAssistantMap(userId, map) {
  try {
    const key = getLocalAssistantKey(userId)
    window.localStorage.setItem(key, JSON.stringify(map))
  } catch {
    // Ignore restricted contexts
  }
}

export async function fetchApplicationAssistant(userId, jobId, applicationId = null) {
  const localMap = getLocalAssistantMap(userId)
  const lookupKey = applicationId || jobId
  const cached = localMap[lookupKey]

  if (!isSupabaseConfigured || !userId || (typeof jobId === 'string' && jobId.startsWith('job-'))) {
    return cached || null
  }

  try {
    const query = supabase
      .from('career_application_assistant')
      .select('*')
      .eq('user_id', userId)

    if (applicationId && !applicationId.startsWith('app-')) {
      query.eq('application_id', applicationId)
    } else {
      query.eq('job_id', jobId)
    }

    const { data, error } = await query.maybeSingle()
    if (error) throw error
    if (data) {
      localMap[lookupKey] = data
      saveLocalAssistantMap(userId, localMap)
      return data
    }
    return cached || null
  } catch (err) {
    return cached || null
  }
}

export async function saveApplicationAssistant(userId, payload) {
  const localMap = getLocalAssistantMap(userId)
  const lookupKey = payload.applicationId || payload.jobId
  localMap[lookupKey] = payload
  saveLocalAssistantMap(userId, localMap)

  if (isSupabaseConfigured && userId && payload.jobId && !payload.jobId.startsWith('job-')) {
    try {
      const dbPayload = {
        user_id: userId,
        job_id: payload.jobId,
        application_id: payload.applicationId && !payload.applicationId.startsWith('app-') ? payload.applicationId : null,
        job_analysis_id: payload.jobAnalysisId && !payload.jobAnalysisId.startsWith('job-') ? payload.jobAnalysisId : null,
        resume_id: payload.resumeId && !payload.resumeId.startsWith('res-') ? payload.resumeId : null,
        application_strategy: payload.applicationStrategy || {},
        bullet_suggestions: payload.bulletSuggestions || [],
        cover_letter: payload.coverLetter || '',
        status: payload.status || 'draft',
        updated_at: new Date().toISOString(),
      }

      await supabase
        .from('career_application_assistant')
        .upsert(dbPayload, { onConflict: 'user_id, job_id' })
    } catch (err) {
      console.warn('[applicationAssistantService] Save Supabase warning:', err)
    }
  }

  return { status: 'success', data: payload }
}
