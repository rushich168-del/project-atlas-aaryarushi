import { isSupabaseConfigured, supabase } from '../lib/supabaseClient.js'

export const COVER_LETTER_TONES = ['Executive', 'Technical', 'Creative', 'Concise']
export const COVER_LETTER_TEMPLATES = ['Standard', 'Executive', 'Technical']

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

export function countWordsAndCharacters(text = '') {
  if (!text || typeof text !== 'string') return { words: 0, characters: 0 }
  const words = text.trim().split(/\s+/).filter(Boolean).length
  const characters = text.length
  return { words, characters }
}

export function validateCoverLetterFacts(letter = '', sourceData = {}) {
  const issues = []
  if (!letter || typeof letter !== 'string') {
    return { isValid: false, issues: ['Cover letter content is empty'], verifiedFactsCount: 0 }
  }

  // 1. Check for bad programming output
  if (/undefined|null|NaN|\[object\s+Object\]/i.test(letter)) {
    issues.push('Letter contains unrendered programming placeholders (undefined/null/NaN).')
  }

  // 2. Count verified fact references
  let verifiedFactsCount = 0
  const candidateName = sourceData.profile?.full_name
  const companyName = sourceData.job?.company
  const jobTitle = sourceData.job?.title

  if (candidateName && letter.includes(candidateName)) verifiedFactsCount++
  if (companyName && letter.includes(companyName)) verifiedFactsCount++
  if (jobTitle && letter.includes(jobTitle)) verifiedFactsCount++

  const verifiedSkills = (sourceData.skills || []).map((s) => s.name.toLowerCase())
  verifiedSkills.forEach((skill) => {
    if (letter.toLowerCase().includes(skill)) verifiedFactsCount++
  })

  const verifiedRoles = (sourceData.experience || []).map((e) => (e.title || '').toLowerCase())
  verifiedRoles.forEach((role) => {
    if (role && letter.toLowerCase().includes(role)) verifiedFactsCount++
  })

  return {
    isValid: issues.length === 0,
    issues,
    verifiedFactsCount,
  }
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

  experience.forEach((exp, idx) => {
    if (exp.achievements && typeof exp.achievements === 'string') {
      const originalLines = exp.achievements.split('\n').map((l) => l.trim()).filter(Boolean)

      originalLines.forEach((line, lIdx) => {
        const cleanLine = line.replace(/^[•\-\*\s]+/, '').trim()
        if (cleanLine.length > 10) {
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
            status: 'suggested',
          })
        }
      })
    }
  })

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

export function generateCoverLetterDraft(
  job = {},
  profile = {},
  experience = [],
  skills = [],
  atsAnalysis = {},
  recommendedResume = null,
  options = {}
) {
  const tone = options.tone || 'Executive'
  const template = options.template || 'Standard'

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
    expSummary = `In my role as ${recentExp.title} at ${recentExp.company_name || 'my organization'}, I delivered measurable contributions and collaborated with cross-functional teams.`
  } else {
    expSummary = `Throughout my professional background, I have developed disciplined expertise in delivering robust, high-quality outcomes.`
  }

  const currentDate = new Date().toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })
  const headerBlock = `${candidateName}
${profile.location || 'Professional Location'}
${currentDate}

Hiring Team
${companyName}

Subject: Application for ${targetJobTitle} position`

  // Template + Tone synthesis
  if (template === 'Executive') {
    return `${headerBlock}

Dear Hiring Team at ${companyName},

I am writing to express my strong strategic interest in the ${targetJobTitle} leadership opportunity at ${companyName}. As a ${candidateHeadline}${locationStr}, I bring a track record of driving operational excellence, building resilient workflows, and aligning team execution with strategic business goals.

${expSummary} Over the course of my career, I have prioritized high-impact execution, robust stakeholder communication, and scalable process standards. My core competencies encompass ${skillsText}, positioning me to add immediate strategic value to ${companyName}'s current initiatives.

${tone === 'Concise'
  ? `I look forward to discussing how my verified background aligns with ${companyName}'s growth.`
  : `What particularly distinguishes ${companyName} is your dedication to sustainable innovation in ${job.work_type || 'collaborative'} settings. I am eager to leverage my background to help scale your team's objectives and deliver lasting value.`}

Thank you for your consideration. I welcome the opportunity to discuss how my qualifications align with your organizational roadmap.

Sincerely,

${candidateName}
${profile.headline || ''}`
  }

  if (template === 'Technical') {
    return `${headerBlock}

Dear Engineering Team at ${companyName},

I am excited to apply for the ${targetJobTitle} engineering role at ${companyName}. As a ${candidateHeadline}${locationStr}, I specialize in designing robust architectures, implementing resilient systems, and solving complex technical challenges.

${expSummary} My verified technical competencies include ${skillsText}. In my day-to-day work, I emphasize clean architecture, performance optimization, and rigorous testing standards to ensure production reliability.

${tone === 'Concise'
  ? `I am eager to contribute to ${companyName}'s engineering goals and technical infrastructure.`
  : `Contributing to ${companyName}'s technology stack represents an exciting opportunity to apply modern engineering practices to mission-critical problems. I look forward to bringing a dedicated, analytical approach to your engineering team.`}

Thank you for reviewing my application. I look forward to discussing my technical background in greater detail.

Sincerely,

${candidateName}
${profile.headline || ''}`
  }

  // Default Standard Template with Tone Modulations
  if (tone === 'Concise') {
    return `${headerBlock}

Dear Hiring Team at ${companyName},

I am writing to apply for the ${targetJobTitle} position at ${companyName}. As a ${candidateHeadline}${locationStr}, I offer proven hands-on experience in ${skillsText}.

${expSummary} My core background directly aligns with the technical and collaborative requirements outlined for this role at ${companyName}.

Thank you for your time. I welcome the opportunity to discuss my qualifications with your team.

Sincerely,

${candidateName}
${profile.headline || ''}`
  }

  if (tone === 'Creative') {
    return `${headerBlock}

Dear Hiring Team at ${companyName},

When I discovered the ${targetJobTitle} opening at ${companyName}, I immediately recognized a compelling alignment with my professional journey as a ${candidateHeadline}${locationStr}.

${expSummary} Navigating complex challenges with creative problem-solving and rigorous technical execution has always been central to my work. My core toolkit features ${skillsText}, which empowers me to bridge technical precision with intuitive user value.

I am particularly excited about ${companyName}'s mission and would love the opportunity to contribute fresh perspectives and proven dedication to your team.

Thank you for your consideration. I look forward to connecting soon!

Sincerely,

${candidateName}
${profile.headline || ''}`
  }

  // Standard Template - Professional / Executive Tone
  return `${headerBlock}

Dear Hiring Team at ${companyName},

I am writing to express my strong interest in the ${targetJobTitle} position at ${companyName}. As a ${candidateHeadline}${locationStr}, I am excited by the opportunity to bring my hands-on experience and technical capabilities to your organization.

${expSummary} My core background encompasses ${skillsText}, which closely aligns with the requirements outlined for this role. I take pride in engineering scalable, high-quality deliverables and continuously expanding my technical domain.

What particularly attracts me to ${companyName} is the opportunity to contribute to high-impact challenges in ${job.work_type || 'full-time'} environments. I am confident that my work ethic, dedication to best practices, and adaptability will enable me to make immediate and valuable contributions to your team.

Thank you for your time and consideration. I welcome the opportunity to discuss how my verified background and qualifications align with ${companyName}'s current goals.

Sincerely,

${candidateName}
${profile.headline || ''}`
}

export function exportCoverLetterPDF({ letterText, candidateName, companyName, jobTitle }) {
  if (typeof window === 'undefined') return

  const printWindow = window.open('', '_blank', 'width=800,height=900')
  if (!printWindow) {
    alert('Please allow popups to export your cover letter PDF.')
    return
  }

  const formattedParagraphs = letterText
    .split('\n\n')
    .map((p) => `<p style="margin-bottom: 14px; line-height: 1.6; font-size: 11pt; color: #1e293b;">${p.replace(/\n/g, '<br/>')}</p>`)
    .join('')

  const html = `<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8" />
  <title>Cover Letter — ${candidateName || 'Candidate'} — ${jobTitle || 'Application'}</title>
  <style>
    @page {
      size: letter;
      margin: 1in;
    }
    body {
      font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif;
      margin: 0;
      padding: 20px;
      color: #0f172a;
      background: #ffffff;
    }
    .container {
      max-width: 700px;
      margin: 0 auto;
    }
    @media print {
      body { padding: 0; }
      .no-print { display: none; }
    }
  </style>
</head>
<body>
  <div class="container">
    ${formattedParagraphs}
  </div>
  <script>
    window.onload = function() {
      setTimeout(function() {
        window.print();
      }, 300);
    };
  </script>
</body>
</html>`

  printWindow.document.open()
  printWindow.document.write(html)
  printWindow.document.close()
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
      const { words, characters } = countWordsAndCharacters(payload.coverLetter || '')

      const dbPayload = {
        user_id: userId,
        job_id: payload.jobId,
        application_id: payload.applicationId && !payload.applicationId.startsWith('app-') ? payload.applicationId : null,
        job_analysis_id: payload.jobAnalysisId && !payload.jobAnalysisId.startsWith('job-') ? payload.jobAnalysisId : null,
        resume_id: payload.resumeId && !payload.resumeId.startsWith('res-') ? payload.resumeId : null,
        application_strategy: payload.applicationStrategy || {},
        bullet_suggestions: payload.bulletSuggestions || [],
        cover_letter: payload.coverLetter || '',
        tone: payload.tone || 'Executive',
        template: payload.template || 'Standard',
        word_count: words,
        character_count: characters,
        customization_metadata: payload.customizationMetadata || {},
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
