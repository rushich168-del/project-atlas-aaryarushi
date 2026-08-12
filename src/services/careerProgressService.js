/**
 * Project Atlas — Career Progress Intelligence Service
 * Deterministic, explainable recommendation and adaptive milestone engine.
 */

const proficiencyRanks = {
  None: 0,
  Beginner: 1,
  Intermediate: 2,
  Advanced: 3,
  Expert: 4,
}

function safeRate(numerator, denominator) {
  if (!denominator || denominator <= 0 || isNaN(denominator)) return 0
  if (!numerator || numerator <= 0 || isNaN(numerator)) return 0
  const rate = Math.round((numerator / denominator) * 100)
  return Math.min(100, Math.max(0, rate))
}

export function calculateSkillPriority({
  skillReq,
  userSkill,
  trackedJobs = [],
  applications = [],
  practiceSessions = [],
  roadmapItem = null,
}) {
  const reqName = skillReq?.skill_name || skillReq?.name || 'Technical Skill'
  const importance = skillReq?.importance || 'Medium'
  const requiredProficiency = skillReq?.required_proficiency || 'Advanced'
  const userProficiency = userSkill?.proficiency || 'None'

  const userRank = proficiencyRanks[userProficiency] || 0
  const reqRank = proficiencyRanks[requiredProficiency] || 3

  // 1. Skill Gap Severity
  let gapStatus = 'Missing'
  let gapScore = 100
  if (userSkill) {
    if (userRank >= reqRank) {
      gapStatus = 'Strong'
      gapScore = 0
    } else {
      gapStatus = 'Developing'
      gapScore = 60
    }
  }

  // 2. Role Importance Score
  let importanceScore = 50
  if (importance === 'Critical') importanceScore = 100
  else if (importance === 'High') importanceScore = 75
  else if (importance === 'Medium') importanceScore = 50
  else if (importance === 'Low' || importance === 'Nice-to-have') importanceScore = 25

  // 3. Tracked Opportunity Demand
  const safeJobs = Array.isArray(trackedJobs) ? trackedJobs.filter(Boolean) : []
  let jobCount = 0
  safeJobs.forEach((job) => {
    if (Array.isArray(job.skills)) {
      const match = job.skills.some(
        (s) => typeof s === 'string' && s.toLowerCase().trim() === reqName.toLowerCase().trim()
      )
      if (match) jobCount++
    }
  })
  const demandScore = safeJobs.length > 0
    ? Math.min(100, Math.round((jobCount / safeJobs.length) * 100 * 1.5))
    : 0

  // 4. Interview Relevance Score
  const safePractice = Array.isArray(practiceSessions) ? practiceSessions.filter(Boolean) : []
  const practiceItem = safePractice.find(
    (p) => (p.related_skill || '').toLowerCase().trim() === reqName.toLowerCase().trim()
  )
  let interviewScore = 0
  let interviewStatus = 'No questions practiced'
  if (practiceItem) {
    if (practiceItem.status === 'needs_review') {
      interviewScore = 100
      interviewStatus = 'Needs review'
    } else if (practiceItem.status === 'practiced') {
      interviewScore = 50
      interviewStatus = 'Practiced'
    } else {
      interviewScore = 25
      interviewStatus = 'Bookmarked'
    }
  }

  // 5. Active Application Relevance Score
  const safeApps = Array.isArray(applications) ? applications.filter(Boolean) : []
  const jobMap = new Map(safeJobs.map((j) => [j.id, j]))
  let inActiveApp = false
  let inSavedJob = false

  safeApps.forEach((app) => {
    const job = jobMap.get(app.job_id)
    if (job && Array.isArray(job.skills)) {
      const match = job.skills.some(
        (s) => typeof s === 'string' && s.toLowerCase().trim() === reqName.toLowerCase().trim()
      )
      if (match) {
        if (['applied', 'screening', 'interview'].includes(app.status)) inActiveApp = true
        else if (app.status === 'saved') inSavedJob = true
      }
    }
  })

  let applicationScore = 0
  if (inActiveApp) applicationScore = 100
  else if (inSavedJob) applicationScore = 50

  // 6. Roadmap Momentum Score
  let momentumScore = 50
  if (roadmapItem) {
    if (roadmapItem.status === 'in_progress') momentumScore = 100
    else if (roadmapItem.status === 'completed') momentumScore = 0
    else momentumScore = 50
  }

  // 7. Weighted Priority Formula
  const priorityScore = Math.min(
    100,
    Math.max(
      0,
      Math.round(
        gapScore * 0.30 +
        importanceScore * 0.25 +
        demandScore * 0.20 +
        interviewScore * 0.10 +
        applicationScore * 0.10 +
        momentumScore * 0.05
      )
    )
  )

  // Priority Level Classification
  let priorityLevel = 'Low'
  let priorityColor = 'text-slate-700 bg-slate-100 border-slate-200'
  if (priorityScore >= 80) {
    priorityLevel = 'Critical'
    priorityColor = 'text-red-700 bg-red-50 border-red-200'
  } else if (priorityScore >= 65) {
    priorityLevel = 'High'
    priorityColor = 'text-amber-700 bg-amber-50 border-amber-200'
  } else if (priorityScore >= 45) {
    priorityLevel = 'Medium'
    priorityColor = 'text-blue-700 bg-blue-50 border-blue-200'
  }

  // Generate Transparent Rationale Bullets
  const reasons = []
  if (importance === 'Critical' || importance === 'High') {
    reasons.push(`${importance} requirement for your target role (${requiredProficiency} level).`)
  }
  if (gapStatus === 'Missing') {
    reasons.push(`Currently missing from your verified profile skills.`)
  } else if (gapStatus === 'Developing') {
    reasons.push(`Currently at ${userProficiency} level (${requiredProficiency} required).`)
  }
  if (jobCount > 0) {
    reasons.push(`Appears in ${jobCount} of your tracked opportunities.`)
  }
  if (inActiveApp) {
    reasons.push(`Directly requested in roles you are actively interviewing or applying for.`)
  }
  if (practiceItem && practiceItem.status === 'needs_review') {
    reasons.push(`Has unresolved interview practice questions marked for review.`)
  }
  if (roadmapItem && roadmapItem.status === 'in_progress') {
    reasons.push(`Active roadmap milestone currently in progress.`)
  }
  if (reasons.length === 0) {
    reasons.push(`General domain competency recommended for target role readiness.`)
  }

  return {
    skillName: reqName,
    category: skillReq?.category || 'Technical',
    importance,
    requiredProficiency,
    userProficiency,
    gapStatus,
    jobCount,
    interviewStatus,
    priorityScore,
    priorityLevel,
    priorityColor,
    reasons,
    roadmapItemStatus: roadmapItem?.status || 'not_started',
  }
}

export function calculateSkillPriorities({
  gapMatrix = [],
  userSkills = [],
  trackedJobs = [],
  applications = [],
  practiceSessions = [],
  roadmapItems = [],
}) {
  const safeMatrix = Array.isArray(gapMatrix) ? gapMatrix.filter(Boolean) : []
  const safeUserSkills = Array.isArray(userSkills) ? userSkills.filter(Boolean) : []
  const safeRoadmapItems = Array.isArray(roadmapItems) ? roadmapItems.filter(Boolean) : []

  const userSkillMap = new Map()
  safeUserSkills.forEach((s) => {
    if (s && s.name) userSkillMap.set(s.name.toLowerCase().trim(), s)
  })

  const roadmapItemMap = new Map()
  safeRoadmapItems.forEach((r) => {
    if (r && r.skill_name) roadmapItemMap.set(r.skill_name.toLowerCase().trim(), r)
  })

  const priorities = safeMatrix.map((skillReq) => {
    const norm = (skillReq.skill_name || '').toLowerCase().trim()
    const userSkill = userSkillMap.get(norm)
    const roadmapItem = roadmapItemMap.get(norm)

    return calculateSkillPriority({
      skillReq,
      userSkill,
      trackedJobs,
      applications,
      practiceSessions,
      roadmapItem,
    })
  })

  // Sort by priorityScore descending
  priorities.sort((a, b) => b.priorityScore - a.priorityScore)

  return priorities
}

export function calculateRoadmapProgress(roadmap = null, gapMatrix = []) {
  const items = Array.isArray(roadmap?.items) ? roadmap.items.filter(Boolean) : []
  const safeMatrix = Array.isArray(gapMatrix) ? gapMatrix.filter(Boolean) : []

  const totalItems = items.length
  const completedCount = items.filter((i) => i.status === 'completed').length
  const inProgressCount = items.filter((i) => i.status === 'in_progress').length
  const notStartedCount = items.filter((i) => i.status === 'not_started' || !i.status).length

  const overallCompletionRate = safeRate(completedCount, totalItems)

  // Skill Readiness Breakdown
  const criticalSkills = safeMatrix.filter((m) => m.importance === 'Critical')
  const criticalStrong = criticalSkills.filter((m) => m.status === 'Strong').length
  const criticalReadiness = safeRate(criticalStrong, criticalSkills.length)

  const highSkills = safeMatrix.filter((m) => m.importance === 'High')
  const highStrong = highSkills.filter((m) => m.status === 'Strong').length
  const highReadiness = safeRate(highStrong, highSkills.length)

  return {
    totalMilestones: totalItems,
    completedCount,
    inProgressCount,
    notStartedCount,
    overallCompletionRate,
    criticalReadiness,
    highReadiness,
    hasRoadmap: totalItems > 0,
  }
}

export function generateSmartMilestones(skillPriorities = [], existingRoadmapItems = []) {
  const safePriorities = Array.isArray(skillPriorities) ? skillPriorities.filter(Boolean) : []
  const safeExisting = Array.isArray(existingRoadmapItems) ? existingRoadmapItems.filter(Boolean) : []

  const existingMap = new Map()
  safeExisting.forEach((i) => {
    if (i && i.skill_name) existingMap.set(i.skill_name.toLowerCase().trim(), i)
  })

  const smartMilestones = safePriorities
    .filter((p) => p.gapStatus === 'Missing' || p.gapStatus === 'Developing')
    .map((p, idx) => {
      const existing = existingMap.get(p.skillName.toLowerCase().trim())
      const actionVerb = p.gapStatus === 'Missing' ? 'Acquire & Implement' : 'Advance'
      const title = existing?.title || `${actionVerb} ${p.skillName} (${p.requiredProficiency} Level)`

      return {
        id: existing?.id || `smart-${idx + 1}`,
        skillName: p.skillName,
        title,
        description: `Targeting ${p.requiredProficiency} level competency to satisfy ${p.importance} requirement for your target role.`,
        priorityScore: p.priorityScore,
        priorityLevel: p.priorityLevel,
        priorityColor: p.priorityColor,
        currentProficiency: p.userProficiency,
        requiredProficiency: p.requiredProficiency,
        gapStatus: p.gapStatus,
        opportunityDemand: p.jobCount,
        reasons: p.reasons,
        status: existing?.status || (idx === 0 ? 'in_progress' : 'not_started'),
      }
    })

  return smartMilestones
}

export function calculateProgressSignals({
  roadmapProgress = {},
  skillPriorities = [],
  applications = [],
  practiceSessions = [],
}) {
  const positiveSignals = []
  const attentionSignals = []
  const applicationSignals = []

  const safePriorities = Array.isArray(skillPriorities) ? skillPriorities.filter(Boolean) : []
  const safeApps = Array.isArray(applications) ? applications.filter(Boolean) : []
  const safePractice = Array.isArray(practiceSessions) ? practiceSessions.filter(Boolean) : []

  // Positive Signals
  if (roadmapProgress.completedCount > 0) {
    positiveSignals.push(`You have completed ${roadmapProgress.completedCount} competency milestone(s).`)
  }
  const strongSkills = safePriorities.filter((p) => p.gapStatus === 'Strong')
  if (strongSkills.length > 0) {
    positiveSignals.push(`${strongSkills.length} core requirements are fully satisfied at required proficiency.`)
  }

  // Attention Signals
  const criticalGaps = safePriorities.filter((p) => p.importance === 'Critical' && p.gapStatus !== 'Strong')
  if (criticalGaps.length > 0) {
    attentionSignals.push(`${criticalGaps.length} critical requirement(s) still require skill progression (${criticalGaps.map((g) => g.skillName).slice(0, 2).join(', ')}).`)
  }
  const highDemandGaps = safePriorities.filter((p) => p.jobCount >= 2 && p.gapStatus !== 'Strong')
  if (highDemandGaps.length > 0) {
    attentionSignals.push(`"${highDemandGaps[0].skillName}" appears in ${highDemandGaps[0].jobCount} tracked opportunities but has an active skill gap.`)
  }

  // Application & Interview Feedback Signals
  const interviewReviews = safePractice.filter((p) => p.status === 'needs_review')
  if (interviewReviews.length > 0) {
    applicationSignals.push(`${interviewReviews.length} interview question(s) marked as needing review before upcoming technical rounds.`)
  }
  const activeAppCount = safeApps.filter((a) => ['applied', 'screening', 'interview'].includes(a.status)).length
  if (activeAppCount > 0) {
    applicationSignals.push(`${activeAppCount} active pipeline application(s) currently rely on your target role competencies.`)
  }

  return {
    positiveSignals,
    attentionSignals,
    applicationSignals,
  }
}

export function generateNextBestActions(skillPriorities = [], roadmapProgress = {}, practiceSessions = []) {
  const actions = []
  const safePriorities = Array.isArray(skillPriorities) ? skillPriorities.filter(Boolean) : []
  const safePractice = Array.isArray(practiceSessions) ? practiceSessions.filter(Boolean) : []

  // Action 1: Top Priority Skill Gap
  const topPriority = safePriorities.find((p) => p.gapStatus !== 'Strong')
  if (topPriority) {
    actions.push({
      id: 'act-top-gap',
      type: 'skill_gap',
      title: `Advance ${topPriority.skillName}`,
      description: `Highest career priority (${topPriority.priorityScore}/100). ${topPriority.reasons[0] || 'Focus on closing this gap.'}`,
      skillName: topPriority.skillName,
      priority: topPriority.priorityLevel,
      actionText: 'View Milestone',
    })
  }

  // Action 2: Interview Practice Needs Review
  const reviewPractice = safePractice.find((p) => p.status === 'needs_review')
  if (reviewPractice) {
    actions.push({
      id: 'act-practice-review',
      type: 'interview',
      title: `Review ${reviewPractice.related_skill || 'Technical'} Questions`,
      description: `Unresolved practice item: "${reviewPractice.question.slice(0, 70)}..."`,
      skillName: reviewPractice.related_skill,
      priority: 'High',
      actionText: 'Practice Now',
    })
  }

  // Action 3: Next In-Progress Milestone
  if (roadmapProgress.inProgressCount > 0) {
    actions.push({
      id: 'act-continue-roadmap',
      type: 'roadmap',
      title: 'Complete Active Roadmap Milestone',
      description: `You have ${roadmapProgress.inProgressCount} milestone(s) in progress. Mark finished tasks complete to raise readiness.`,
      priority: 'Medium',
      actionText: 'Open Roadmap',
    })
  }

  // Action 4: High Opportunity Demand Skill
  const topDemand = safePriorities.find(
    (p) => p.jobCount >= 2 && p.gapStatus !== 'Strong' && p.skillName !== topPriority?.skillName
  )
  if (topDemand) {
    actions.push({
      id: 'act-opportunity-demand',
      type: 'job_demand',
      title: `Bridge "${topDemand.skillName}" Opportunity Gap`,
      description: `Demanded in ${topDemand.jobCount} tracked opportunities. Level up to improve job match scores.`,
      skillName: topDemand.skillName,
      priority: 'Medium',
      actionText: 'View Jobs',
    })
  }

  return actions.slice(0, 4)
}

export function calculateFullCareerProgress({
  userSkills = [],
  targetRole = 'Senior Full Stack Engineer / Technical Lead',
  gapMatrix = [],
  roadmap = null,
  practiceSessions = [],
  trackedJobs = [],
  applications = [],
}) {
  const priorities = calculateSkillPriorities({
    gapMatrix,
    userSkills,
    trackedJobs,
    applications,
    practiceSessions,
    roadmapItems: roadmap?.items || [],
  })

  const progress = calculateRoadmapProgress(roadmap, gapMatrix)
  const smartMilestones = generateSmartMilestones(priorities, roadmap?.items || [])
  const signals = calculateProgressSignals({
    roadmapProgress: progress,
    skillPriorities: priorities,
    applications,
    practiceSessions,
  })
  const nextActions = generateNextBestActions(priorities, progress, practiceSessions)

  return {
    targetRole,
    priorities,
    progress,
    smartMilestones,
    signals,
    nextActions,
    topPriority: priorities.length > 0 ? priorities[0] : null,
  }
}
