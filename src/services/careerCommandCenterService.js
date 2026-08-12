/**
 * Project Atlas — Career Command Center Service
 * Aggregates all Career Suite intelligence into a single, deterministic Personal Career Command Center bundle.
 */

import { calculateJobMatch } from './jobMatchService.js'
import { calculateSkillGaps, roleRequirementsTaxonomy } from './skillsInterviewService.js'
import { calculateSkillPriorities, calculateRoadmapProgress } from './careerProgressService.js'

function safeRate(numerator, denominator) {
  if (!denominator || denominator <= 0 || isNaN(denominator)) return 0
  if (!numerator || numerator <= 0 || isNaN(numerator)) return 0
  const rate = Math.round((numerator / denominator) * 100)
  return Math.min(100, Math.max(0, rate))
}

function clamp(val, min = 0, max = 100) {
  if (val === null || val === undefined || isNaN(val)) return min
  return Math.min(max, Math.max(min, Math.round(val)))
}

/**
 * 1. Multi-Dimensional Career Readiness Gauges
 */
export function calculateCareerReadiness({
  profile = null,
  skills = [],
  resumes = [],
  jobs = [],
  applications = [],
  practiceSessions = [],
  portfolio = null,
  targetRole = 'Senior Full Stack Engineer / Technical Lead',
}) {
  const safeSkills = Array.isArray(skills) ? skills.filter(Boolean) : []
  const safeResumes = Array.isArray(resumes) ? resumes.filter(Boolean) : []
  const safeApplications = Array.isArray(applications) ? applications.filter(Boolean) : []
  const safePractice = Array.isArray(practiceSessions) ? practiceSessions.filter(Boolean) : []

  // A. Skill Readiness
  const gapAnalysis = calculateSkillGaps(safeSkills, targetRole)
  const totalReqSkills = gapAnalysis.totalCount || 1
  const strongCount = gapAnalysis.strongCount || 0
  const devCount = gapAnalysis.developingCount || 0
  const skillReadiness = clamp(
    Math.round(((strongCount * 1.0 + devCount * 0.5) / Math.max(1, totalReqSkills)) * 100)
  )

  // B. Resume Readiness
  let resumeReadiness = 0
  if (safeResumes.length >= 1) {
    const hasCompletedSections = safeResumes.some(
      (r) => Array.isArray(r.sections) && r.sections.length >= 3
    ) || (Array.isArray(safeResumes[0]?.sections) && safeResumes[0].sections.length > 0)
    resumeReadiness = clamp(60 + (hasCompletedSections ? 40 : 0))
  }

  // C. Pipeline Readiness (Target: 5 active applications)
  const activeApps = safeApplications.filter((a) =>
    ['applied', 'screening', 'interview', 'offer'].includes(a.status)
  )
  const pipelineReadiness = clamp(Math.round((activeApps.length / 5) * 100))

  // D. Interview Readiness
  const totalQuestions = 10 // baseline benchmark
  const practicedCount = safePractice.filter((p) => p.status === 'practiced' || p.status === 'needs_review').length
  const interviewReadiness = clamp(Math.round((practicedCount / Math.max(1, totalQuestions)) * 100))

  // E. Portfolio Readiness
  const hasBio = Boolean(profile?.bio || portfolio?.bio)
  const hasPublishedSlug = Boolean(portfolio?.publicProfile?.is_published || portfolio?.is_published)
  const publicProjects = Array.isArray(portfolio?.projects)
    ? portfolio.projects.filter((p) => p.is_public !== false)
    : []
  const portfolioReadiness = clamp(
    (hasBio ? 25 : 0) +
    (hasPublishedSlug ? 25 : 0) +
    Math.min(50, publicProjects.length * 25)
  )

  // Overall Weighted Score
  const overallScore = clamp(
    Math.round(
      0.30 * skillReadiness +
      0.20 * resumeReadiness +
      0.20 * pipelineReadiness +
      0.15 * interviewReadiness +
      0.15 * portfolioReadiness
    )
  )

  return {
    overallScore,
    skillReadiness,
    resumeReadiness,
    pipelineReadiness,
    interviewReadiness,
    portfolioReadiness,
    details: {
      strongSkills: strongCount,
      totalRequiredSkills: totalReqSkills,
      resumesCount: safeResumes.length,
      activeApplications: activeApps.length,
      practicedQuestions: practicedCount,
      publicProjectsCount: publicProjects.length,
      hasPublishedSlug,
    },
  }
}

/**
 * 2. Application Attention Radar
 */
export function calculateApplicationAttentionRadar(applications = [], jobs = []) {
  const safeApps = Array.isArray(applications) ? applications.filter(Boolean) : []
  const safeJobs = Array.isArray(jobs) ? jobs.filter(Boolean) : []
  const jobMap = new Map(safeJobs.map((j) => [j.id, j]))

  const attentionItems = []
  const now = Date.now()
  const sevenDaysMs = 7 * 24 * 60 * 60 * 1000

  safeApps.forEach((app) => {
    const job = jobMap.get(app.job_id) || {}
    const jobTitle = job.title || 'Tracked Role'
    const company = job.company || 'Company'

    // 1. Interview Stage Alert (HIGH Urgency)
    if (app.status === 'interview') {
      attentionItems.push({
        id: `att-int-${app.id}`,
        type: 'interview_prep',
        urgency: 'HIGH',
        urgencyColor: 'text-red-700 bg-red-50 border-red-200',
        title: `Interview in Progress: ${jobTitle}`,
        company,
        jobId: app.job_id,
        applicationId: app.id,
        reason: 'Active interview stage in progress. Technical and behavioral mock preparation strongly recommended.',
        actionText: 'Practice Mock Questions',
        navigationTab: 'skills',
      })
    }

    // 2. Applied > 7 Days Ago Without Response (MEDIUM Urgency)
    if (app.status === 'applied' && app.applied_at) {
      const appliedTime = new Date(app.applied_at).getTime()
      if (!isNaN(appliedTime)) {
        const daysElapsed = Math.floor((now - appliedTime) / (24 * 60 * 60 * 1000))
        if (daysElapsed >= 7) {
          attentionItems.push({
            id: `att-followup-${app.id}`,
            type: 'follow_up',
            urgency: 'MEDIUM',
            urgencyColor: 'text-amber-700 bg-amber-50 border-amber-200',
            title: `Follow Up on ${jobTitle} (${daysElapsed}d ago)`,
            company,
            jobId: app.job_id,
            applicationId: app.id,
            reason: `Application submitted ${daysElapsed} days ago with no recorded status update. A polite check-in email is recommended.`,
            actionText: 'View Application Notes',
            navigationTab: 'jobs',
          })
        }
      }
    }
  })

  // 3. Saved Jobs Approaching Deadline (WARNING/MEDIUM Urgency)
  safeJobs.forEach((job) => {
    const app = safeApps.find((a) => a.job_id === job.id)
    const isSaved = !app || app.status === 'saved'

    if (isSaved && job.deadline) {
      const deadlineTime = new Date(job.deadline).getTime()
      if (!isNaN(deadlineTime)) {
        const diffMs = deadlineTime - now
        const daysRemaining = Math.ceil(diffMs / (24 * 60 * 60 * 1000))

        if (daysRemaining >= 0 && daysRemaining <= 7) {
          attentionItems.push({
            id: `att-deadline-${job.id}`,
            type: 'deadline_warning',
            urgency: daysRemaining <= 2 ? 'HIGH' : 'MEDIUM',
            urgencyColor: daysRemaining <= 2
              ? 'text-red-700 bg-red-50 border-red-200'
              : 'text-amber-700 bg-amber-50 border-amber-200',
            title: `Deadline Approaching: ${job.title}`,
            company: job.company,
            jobId: job.id,
            reason: `Application closes in ${daysRemaining} day${daysRemaining === 1 ? '' : 's'}. Tailor resume and submit before cutoff.`,
            actionText: 'Apply with Assistant',
            navigationTab: 'jobs',
          })
        }
      }
    }
  })

  // Sort by urgency: HIGH first, then MEDIUM
  attentionItems.sort((a, b) => {
    const rank = { HIGH: 1, MEDIUM: 2, LOW: 3 }
    return (rank[a.urgency] || 3) - (rank[b.urgency] || 3)
  })

  return attentionItems
}

/**
 * 3. Top Job Matches via Existing ATS Engine
 */
export function calculateTopJobMatches({
  jobs = [],
  profile = {},
  skills = [],
  experience = [],
  education = [],
  resumes = [],
  limit = 5,
}) {
  const safeJobs = Array.isArray(jobs) ? jobs.filter(Boolean) : []
  const safeResumes = Array.isArray(resumes) ? resumes.filter(Boolean) : []

  const matches = safeJobs.map((job) => {
    const atsMatch = calculateJobMatch(
      job,
      profile,
      skills,
      experience,
      education,
      safeResumes
    )

    // Find recommended resume title
    let recommendedResumeTitle = 'Primary Resume'
    const recommendedResumeId = atsMatch.recommendedResume?.id || atsMatch.recommendedResumeId || null
    if (recommendedResumeId) {
      const rec = safeResumes.find((r) => r.id === recommendedResumeId)
      if (rec) recommendedResumeTitle = rec.title
    }

    const matchScore = atsMatch.matchScore || atsMatch.overallScore || 0
    const fitLevel = atsMatch.fitLevel || (matchScore >= 80 ? 'Strong Match' : matchScore >= 60 ? 'Moderate Match' : 'Weak Match')

    return {
      jobId: job.id,
      title: job.title || 'Software Engineer',
      company: job.company || 'Hiring Company',
      location: job.location || 'Remote / Hybrid',
      matchScore,
      fitLevel,
      matchedSkills: atsMatch.matchedSkills || atsMatch.breakdown?.matchedSkills || [],
      missingSkills: atsMatch.missingSkills || atsMatch.breakdown?.missingSkills || [],
      recommendedResumeTitle,
      recommendedResumeId,
      topRecommendation: atsMatch.recommendations?.[0] || 'Tailor application keywords to role requirements.',
    }
  })

  // Sort deterministically by matchScore descending, then company/title stable order
  matches.sort((a, b) => {
    if (b.matchScore !== a.matchScore) return b.matchScore - a.matchScore
    return (a.company || '').localeCompare(b.company || '')
  })

  return matches.slice(0, limit)
}

/**
 * 4. High-Impact Skill Blockers
 */
export function calculateSkillBlockers({
  gapMatrix = [],
  userSkills = [],
  trackedJobs = [],
  applications = [],
  practiceSessions = [],
  roadmapItems = [],
  limit = 4,
}) {
  const priorities = calculateSkillPriorities({
    gapMatrix,
    userSkills,
    trackedJobs,
    applications,
    practiceSessions,
    roadmapItems,
  })

  const blockers = priorities
    .filter((p) => p.gapStatus === 'Missing' || p.gapStatus === 'Developing')
    .slice(0, limit)
    .map((p) => ({
      skillName: p.skillName,
      userProficiency: p.userProficiency,
      requiredProficiency: p.requiredProficiency,
      importance: p.importance,
      gapStatus: p.gapStatus,
      priorityScore: p.priorityScore,
      priorityLevel: p.priorityLevel,
      priorityColor: p.priorityColor,
      jobCount: p.jobCount,
      reason: p.reasons[0] || `${p.importance} requirement for your target role.`,
      actionText: 'Open Skill Roadmap',
      navigationTab: 'skills',
    }))

  return blockers
}

/**
 * 5. Deterministic 7-Day Weekly Career Plan
 */
export function generateWeeklyPlan({
  targetRole = 'Senior Full Stack Engineer / Technical Lead',
  skillBlockers = [],
  attentionItems = [],
  topJobMatches = [],
  readiness = {},
  publicProjectsCount = 0,
}) {
  const plan = []

  // Day 1–2: Top Priority Skill Milestone
  if (skillBlockers.length > 0) {
    const topSkill = skillBlockers[0]
    plan.push({
      days: 'Day 1–2',
      category: 'Skill Progression',
      title: `Advance ${topSkill.skillName} (${topSkill.requiredProficiency} level)`,
      description: `Focus on closing your highest-priority gap. ${topSkill.reason}`,
      priority: 'High',
      navigationTab: 'skills',
      actionText: 'Open Roadmap',
    })
  }

  // Day 3: Targeted Interview Practice
  const urgentInterview = attentionItems.find((a) => a.type === 'interview_prep')
  if (urgentInterview) {
    plan.push({
      days: 'Day 3',
      category: 'Interview Preparation',
      title: `Practice Mock Rounds for ${urgentInterview.company}`,
      description: 'Prepare system design, architecture, and STAR behavioral answers for active interview stage.',
      priority: 'High',
      navigationTab: 'skills',
      actionText: 'Start Mock Interview',
    })
  } else {
    plan.push({
      days: 'Day 3',
      category: 'Interview Preparation',
      title: 'Technical Mock Practice (Architecture & Security)',
      description: 'Complete 2 high-difficulty technical practice questions to maintain technical sharpness.',
      priority: 'Medium',
      navigationTab: 'skills',
      actionText: 'Review Questions',
    })
  }

  // Day 4–5: High ATS Job Applications
  if (topJobMatches.length > 0 && topJobMatches[0].matchScore >= 60) {
    const topJob = topJobMatches[0]
    plan.push({
      days: 'Day 4–5',
      category: 'Targeted Applications',
      title: `Apply to ${topJob.title} at ${topJob.company} (${topJob.matchScore}% Match)`,
      description: `Generate tailored bullets and custom cover letter using recommended resume: "${topJob.recommendedResumeTitle}".`,
      priority: 'High',
      navigationTab: 'jobs',
      actionText: 'Open Application Assistant',
    })
  } else {
    plan.push({
      days: 'Day 4–5',
      category: 'Opportunity Discovery',
      title: 'Track 3 Target Roles in Opportunities Pipeline',
      description: 'Add matching job descriptions to calculate ATS match scores and identify required skill deltas.',
      priority: 'Medium',
      navigationTab: 'jobs',
      actionText: 'Add Opportunity',
    })
  }

  // Day 6: Portfolio & Proof of Work
  if (publicProjectsCount < 2) {
    plan.push({
      days: 'Day 6',
      category: 'Portfolio Showcase',
      title: 'Add & Showcase High-Impact Project',
      description: 'Document architecture, tech stack, and GitHub repository to verify competencies to recruiters.',
      priority: 'Medium',
      navigationTab: 'portfolio',
      actionText: 'Update Portfolio',
    })
  }

  // Day 7: Pipeline Follow-ups & Review
  const followUpItem = attentionItems.find((a) => a.type === 'follow_up')
  if (followUpItem) {
    plan.push({
      days: 'Day 7',
      category: 'Pipeline Management',
      title: `Follow Up: ${followUpItem.company}`,
      description: 'Check in on pending application submitted over 7 days ago to maintain momentum.',
      priority: 'Medium',
      navigationTab: 'jobs',
      actionText: 'Review Pipeline',
    })
  } else {
    plan.push({
      days: 'Day 7',
      category: 'Weekly Retrospective',
      title: 'Review Weekly Readiness & Milestone Progress',
      description: 'Audit completed roadmap items and verify overall career readiness indicators.',
      priority: 'Low',
      navigationTab: 'skills',
      actionText: 'View Readiness',
    })
  }

  return plan.slice(0, 5)
}

/**
 * 6. Deterministic Next Best Action Queue
 */
export function generateNextBestActions({
  attentionItems = [],
  skillBlockers = [],
  topJobMatches = [],
  readiness = {},
  resumes = [],
  portfolio = null,
}) {
  const queue = []

  // 1. High Urgency Attention Item (e.g. active interview)
  const highAttention = attentionItems.find((a) => a.urgency === 'HIGH')
  if (highAttention) {
    queue.push({
      id: 'nba-interview',
      type: 'interview',
      title: highAttention.title,
      priority: 'CRITICAL',
      priorityColor: 'text-red-700 bg-red-50 border-red-200',
      reason: highAttention.reason,
      actionLabel: highAttention.actionText,
      navigationTab: highAttention.navigationTab,
      relatedJobId: highAttention.jobId,
    })
  }

  // 2. High Priority Skill Blocker
  if (skillBlockers.length > 0) {
    const topBlocker = skillBlockers[0]
    queue.push({
      id: 'nba-skill-blocker',
      type: 'skill_progression',
      title: `Close Competency Gap in ${topBlocker.skillName}`,
      priority: topBlocker.priorityLevel === 'Critical' ? 'CRITICAL' : 'HIGH',
      priorityColor: topBlocker.priorityColor,
      reason: `Rated ${topBlocker.priorityScore}/100 priority score. ${topBlocker.reason}`,
      actionLabel: 'Advance Skill',
      navigationTab: 'skills',
      relatedSkill: topBlocker.skillName,
    })
  }

  // 3. Top ATS Match Opportunity Application
  if (topJobMatches.length > 0 && topJobMatches[0].matchScore >= 70) {
    const topJob = topJobMatches[0]
    queue.push({
      id: 'nba-top-job',
      type: 'apply',
      title: `Submit Tailored Application for ${topJob.company}`,
      priority: 'HIGH',
      priorityColor: 'text-teal-700 bg-teal-50 border-teal-200',
      reason: `Outstanding ATS Match (${topJob.matchScore}%). Best alignment with your verified skill profile.`,
      actionLabel: 'Open Assistant',
      navigationTab: 'jobs',
      relatedJobId: topJob.jobId,
    })
  }

  // 4. Resume Builder Setup If Empty
  if (Array.isArray(resumes) && resumes.length === 0) {
    queue.push({
      id: 'nba-resume-empty',
      type: 'resume',
      title: 'Create Your Target Role Resume',
      priority: 'HIGH',
      priorityColor: 'text-blue-700 bg-blue-50 border-blue-200',
      reason: 'No resumes created. Build a tailored resume from your verified profile to unlock ATS matching.',
      actionLabel: 'Create Resume',
      navigationTab: 'resume',
    })
  }

  // 5. Portfolio Publishing If Unpublished
  if (portfolio && !portfolio.is_published && !portfolio.publicProfile?.is_published) {
    queue.push({
      id: 'nba-publish-portfolio',
      type: 'portfolio',
      title: 'Publish Recruiter Showcase Profile',
      priority: 'MEDIUM',
      priorityColor: 'text-purple-700 bg-purple-50 border-purple-200',
      reason: 'Your verified projects and bio are ready. Publish your public link for hiring managers.',
      actionLabel: 'Publish Profile',
      navigationTab: 'portfolio',
    })
  }

  return queue.slice(0, 4)
}

/**
 * 7. Complete Personal Career Command Center Bundle
 */
export function calculateFullCommandCenterData({
  profile = null,
  skills = [],
  experience = [],
  education = [],
  resumes = [],
  jobs = [],
  applications = [],
  practiceSessions = [],
  roadmap = null,
  portfolio = null,
  targetRole = 'Senior Full Stack Engineer / Technical Lead',
}) {
  const safeRole = profile?.target_role || targetRole || 'Senior Full Stack Engineer / Technical Lead'
  const gapAnalysis = calculateSkillGaps(skills, safeRole)

  const readiness = calculateCareerReadiness({
    profile,
    skills,
    resumes,
    jobs,
    applications,
    practiceSessions,
    portfolio,
    targetRole: safeRole,
  })

  const attentionItems = calculateApplicationAttentionRadar(applications, jobs)

  const topJobMatches = calculateTopJobMatches({
    jobs,
    profile,
    skills,
    experience,
    education,
    resumes,
    limit: 5,
  })

  const skillBlockers = calculateSkillBlockers({
    gapMatrix: gapAnalysis.matrix,
    userSkills: skills,
    trackedJobs: jobs,
    applications,
    practiceSessions,
    roadmapItems: roadmap?.items || [],
    limit: 4,
  })

  const weeklyPlan = generateWeeklyPlan({
    targetRole: safeRole,
    skillBlockers,
    attentionItems,
    topJobMatches,
    readiness,
    publicProjectsCount: readiness.details.publicProjectsCount,
  })

  const nextBestActions = generateNextBestActions({
    attentionItems,
    skillBlockers,
    topJobMatches,
    readiness,
    resumes,
    portfolio,
  })

  const primaryAction = nextBestActions.length > 0 ? nextBestActions[0] : null

  return {
    targetRole: safeRole,
    readiness,
    attentionItems,
    topJobMatches,
    skillBlockers,
    weeklyPlan,
    nextBestActions,
    primaryAction,
    summary: {
      activeApplications: readiness.details.activeApplications,
      strongSkills: readiness.details.strongSkills,
      topMatchScore: topJobMatches.length > 0 ? topJobMatches[0].matchScore : 0,
      resumesCount: readiness.details.resumesCount,
      publicProjectsCount: readiness.details.publicProjectsCount,
    },
  }
}
