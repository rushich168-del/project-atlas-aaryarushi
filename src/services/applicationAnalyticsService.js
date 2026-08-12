/**
 * Project Atlas — Career Application Intelligence & Analytics Service
 * Deterministic, in-memory career analytics derived from existing user-owned data.
 */

function safeRate(numerator, denominator) {
  if (!denominator || denominator <= 0 || isNaN(denominator)) return 0
  if (!numerator || numerator <= 0 || isNaN(numerator)) return 0
  const rate = Math.round((numerator / denominator) * 100)
  return Math.min(100, Math.max(0, rate))
}

export function calculateApplicationOverview(jobs = [], applications = []) {
  const safeJobs = Array.isArray(jobs) ? jobs.filter(Boolean) : []
  const safeApps = Array.isArray(applications) ? applications.filter(Boolean) : []

  const savedCount = safeApps.filter((a) => a && a.status === 'saved').length
  const appliedCount = safeApps.filter((a) => a && a.status === 'applied').length
  const screeningCount = safeApps.filter((a) => a && a.status === 'screening').length
  const interviewCount = safeApps.filter((a) => a && a.status === 'interview').length
  const offerCount = safeApps.filter((a) => a && a.status === 'offer').length
  const rejectedCount = safeApps.filter((a) => a && a.status === 'rejected').length
  const withdrawnCount = safeApps.filter((a) => a && a.status === 'withdrawn').length

  const activeApplicationsCount = appliedCount + screeningCount + interviewCount + offerCount

  return {
    trackedJobs: safeJobs.length,
    totalApplications: safeApps.length,
    savedCount,
    appliedCount,
    screeningCount,
    interviewCount,
    offerCount,
    rejectedCount,
    withdrawnCount,
    activeApplicationsCount,
    hasData: safeJobs.length > 0 || safeApps.length > 0,
  }
}

export function calculateConversionMetrics(applications = [], jobs = []) {
  const safeApps = Array.isArray(applications) ? applications.filter(Boolean) : []
  const safeJobs = Array.isArray(jobs) ? jobs.filter(Boolean) : []

  const totalApps = safeApps.length
  const screeningOrHigher = safeApps.filter((a) => a && ['screening', 'interview', 'offer'].includes(a.status)).length
  const interviewOrHigher = safeApps.filter((a) => a && ['interview', 'offer'].includes(a.status)).length
  const offerCount = safeApps.filter((a) => a && a.status === 'offer').length

  const applicationRate = safeRate(totalApps, safeJobs.length)
  const screeningRate = safeRate(screeningOrHigher, totalApps)
  const interviewRate = safeRate(interviewOrHigher, totalApps)
  const offerRate = safeRate(offerCount, totalApps)

  const screeningToInterviewRate = safeRate(interviewOrHigher, screeningOrHigher)
  const interviewToOfferRate = safeRate(offerCount, interviewOrHigher)

  return {
    applicationRate,
    screeningRate,
    interviewRate,
    offerRate,
    screeningToInterviewRate,
    interviewToOfferRate,
    hasConversionData: totalApps > 0,
  }
}

export function calculateApplicationFunnel(jobs = [], applications = []) {
  const safeJobs = Array.isArray(jobs) ? jobs.filter(Boolean) : []
  const safeApps = Array.isArray(applications) ? applications.filter(Boolean) : []

  const totalTracked = safeJobs.length
  const appliedOrHigher = safeApps.filter((a) => a && ['applied', 'screening', 'interview', 'offer', 'rejected', 'withdrawn'].includes(a.status)).length
  const screeningOrHigher = safeApps.filter((a) => a && ['screening', 'interview', 'offer'].includes(a.status)).length
  const interviewOrHigher = safeApps.filter((a) => a && ['interview', 'offer'].includes(a.status)).length
  const offerCount = safeApps.filter((a) => a && a.status === 'offer').length
  const rejectedCount = safeApps.filter((a) => a && a.status === 'rejected').length
  const withdrawnCount = safeApps.filter((a) => a && a.status === 'withdrawn').length

  const stages = [
    {
      id: 'tracked',
      name: 'Tracked Opportunities',
      count: totalTracked,
      rate: 100,
      color: 'bg-slate-500',
    },
    {
      id: 'applied',
      name: 'Applied',
      count: appliedOrHigher,
      rate: safeRate(appliedOrHigher, Math.max(1, totalTracked)),
      color: 'bg-blue-600',
    },
    {
      id: 'screening',
      name: 'Screening',
      count: screeningOrHigher,
      rate: safeRate(screeningOrHigher, Math.max(1, appliedOrHigher)),
      color: 'bg-purple-600',
    },
    {
      id: 'interview',
      name: 'Interview',
      count: interviewOrHigher,
      rate: safeRate(interviewOrHigher, Math.max(1, appliedOrHigher)),
      color: 'bg-amber-600',
    },
    {
      id: 'offer',
      name: 'Offer',
      count: offerCount,
      rate: safeRate(offerCount, Math.max(1, appliedOrHigher)),
      color: 'bg-emerald-600',
    },
  ]

  return {
    stages,
    rejectedCount,
    withdrawnCount,
    hasFunnelData: totalTracked > 0 || safeApps.length > 0,
  }
}

export function calculateTimeMetrics(applications = []) {
  const safeApps = Array.isArray(applications) ? applications.filter(Boolean) : []
  const durations = []

  safeApps.forEach((app) => {
    if (app && app.applied_at) {
      const start = new Date(app.applied_at).getTime()
      const end = app.updated_at ? new Date(app.updated_at).getTime() : Date.now()
      if (!isNaN(start) && !isNaN(end) && end >= start) {
        const days = Math.round((end - start) / (1000 * 60 * 60 * 24))
        durations.push(days)
      }
    }
  })

  const averageDaysInPipeline = durations.length > 0
    ? Math.round(durations.reduce((sum, d) => sum + d, 0) / durations.length)
    : 0

  return {
    averageDaysInPipeline,
    sampleCount: durations.length,
    hasTimeData: durations.length > 0,
  }
}

export function calculateAtsOutcomeAnalysis(jobs = [], applications = [], atsAnalyses = {}) {
  const safeJobs = Array.isArray(jobs) ? jobs.filter(Boolean) : []
  const safeApps = Array.isArray(applications) ? applications.filter(Boolean) : []
  const safeAnalyses = atsAnalyses && typeof atsAnalyses === 'object' ? atsAnalyses : {}

  const bands = {
    high: { name: '80–100% (High Alignment)', min: 80, max: 100, total: 0, interviews: 0, offers: 0, rejected: 0 },
    moderate: { name: '60–79% (Moderate Alignment)', min: 60, max: 79, total: 0, interviews: 0, offers: 0, rejected: 0 },
    low: { name: '40–59% (Low Alignment)', min: 40, max: 59, total: 0, interviews: 0, offers: 0, rejected: 0 },
    minimal: { name: '0–39% (Minimal Alignment)', min: 0, max: 39, total: 0, interviews: 0, offers: 0, rejected: 0 },
  }

  let totalScoreSum = 0
  let scoreCount = 0

  safeApps.forEach((app) => {
    if (!app || !app.job_id) return
    const analysis = safeAnalyses[app.job_id]
    const score = analysis?.matchScore

    if (typeof score === 'number' && !isNaN(score)) {
      totalScoreSum += score
      scoreCount++

      let targetBand = bands.minimal
      if (score >= 80) targetBand = bands.high
      else if (score >= 60) targetBand = bands.moderate
      else if (score >= 40) targetBand = bands.low

      targetBand.total++
      if (['interview', 'offer'].includes(app.status)) targetBand.interviews++
      if (app.status === 'offer') targetBand.offers++
      if (app.status === 'rejected') targetBand.rejected++
    }
  })

  // Add rates
  Object.values(bands).forEach((b) => {
    b.interviewRate = safeRate(b.interviews, b.total)
    b.offerRate = safeRate(b.offers, b.total)
  })

  const averageAtsScore = scoreCount > 0 ? Math.round(totalScoreSum / scoreCount) : 0

  return {
    averageAtsScore,
    scoreBands: Object.values(bands),
    analyzedCount: scoreCount,
    hasAtsData: scoreCount > 0,
  }
}

export function calculateResumePerformance(applications = [], resumes = []) {
  const safeApps = Array.isArray(applications) ? applications.filter(Boolean) : []
  const safeResumes = Array.isArray(resumes) ? resumes.filter(Boolean) : []

  const resumeMap = new Map(safeResumes.map((r) => [r.id, r.title || 'Untitled Resume']))

  const performanceMap = {}

  safeApps.forEach((app) => {
    if (!app) return
    const key = app.resume_id || 'unassigned'
    const title = app.resume_id ? (resumeMap.get(app.resume_id) || 'Custom Resume') : 'General Application'

    if (!performanceMap[key]) {
      performanceMap[key] = {
        resumeId: key,
        title,
        applicationCount: 0,
        interviewCount: 0,
        offerCount: 0,
        rejectedCount: 0,
      }
    }

    performanceMap[key].applicationCount++
    if (['interview', 'offer'].includes(app.status)) performanceMap[key].interviewCount++
    if (app.status === 'offer') performanceMap[key].offerCount++
    if (app.status === 'rejected') performanceMap[key].rejectedCount++
  })

  const list = Object.values(performanceMap).map((item) => ({
    ...item,
    interviewRate: safeRate(item.interviewCount, item.applicationCount),
    offerRate: safeRate(item.offerCount, item.applicationCount),
  }))

  list.sort((a, b) => b.interviewRate - a.interviewRate || b.applicationCount - a.applicationCount)

  return {
    resumes: list,
    hasResumeData: list.length > 0,
  }
}

export function calculateSourcePerformance(jobs = [], applications = []) {
  const safeJobs = Array.isArray(jobs) ? jobs.filter(Boolean) : []
  const safeApps = Array.isArray(applications) ? applications.filter(Boolean) : []

  const jobMap = new Map(safeJobs.filter((j) => j && j.id).map((j) => [j.id, j]))
  const sourceMap = {}

  safeApps.forEach((app) => {
    if (!app) return
    const job = app.job_id ? jobMap.get(app.job_id) : null
    const source = (job && job.source && job.source.trim()) ? job.source.trim() : 'Company Website / Direct'

    if (!sourceMap[source]) {
      sourceMap[source] = {
        source,
        applicationCount: 0,
        interviewCount: 0,
        offerCount: 0,
      }
    }

    sourceMap[source].applicationCount++
    if (['interview', 'offer'].includes(app.status)) sourceMap[source].interviewCount++
    if (app.status === 'offer') sourceMap[source].offerCount++
  })

  const list = Object.values(sourceMap).map((item) => ({
    ...item,
    interviewRate: safeRate(item.interviewCount, item.applicationCount),
    offerRate: safeRate(item.offerCount, item.applicationCount),
  }))

  list.sort((a, b) => b.interviewRate - a.interviewRate || b.applicationCount - a.applicationCount)

  return {
    sources: list,
    hasSourceData: list.length > 0,
  }
}

export function calculateWorkTypePerformance(jobs = [], applications = []) {
  const safeJobs = Array.isArray(jobs) ? jobs.filter(Boolean) : []
  const safeApps = Array.isArray(applications) ? applications.filter(Boolean) : []

  const jobMap = new Map(safeJobs.filter((j) => j && j.id).map((j) => [j.id, j]))
  const typeMap = {}

  safeApps.forEach((app) => {
    if (!app) return
    const job = app.job_id ? jobMap.get(app.job_id) : null
    const workType = job?.work_type || 'Full-time'
    const empType = job?.employment_type || 'Remote'
    const key = `${workType} • ${empType}`

    if (!typeMap[key]) {
      typeMap[key] = {
        workType,
        employmentType: empType,
        displayName: key,
        applicationCount: 0,
        interviewCount: 0,
        offerCount: 0,
      }
    }

    typeMap[key].applicationCount++
    if (['interview', 'offer'].includes(app.status)) typeMap[key].interviewCount++
    if (app.status === 'offer') typeMap[key].offerCount++
  })

  const list = Object.values(typeMap).map((item) => ({
    ...item,
    interviewRate: safeRate(item.interviewCount, item.applicationCount),
    offerRate: safeRate(item.offerCount, item.applicationCount),
  }))

  list.sort((a, b) => b.interviewRate - a.interviewRate || b.applicationCount - a.applicationCount)

  return {
    workTypes: list,
    hasWorkTypeData: list.length > 0,
  }
}

export function calculateSkillOpportunityAnalysis(jobs = [], userSkills = []) {
  const safeJobs = Array.isArray(jobs) ? jobs.filter(Boolean) : []
  const safeUserSkills = Array.isArray(userSkills) ? userSkills.filter(Boolean) : []

  const userSkillMap = new Map()
  safeUserSkills.forEach((s) => {
    if (s && s.name) {
      userSkillMap.set(s.name.trim().toLowerCase(), s)
    }
  })

  const jobSkillFrequency = {}

  safeJobs.forEach((job) => {
    if (job && Array.isArray(job.skills)) {
      job.skills.forEach((skill) => {
        if (typeof skill === 'string' && skill.trim()) {
          const norm = skill.trim()
          jobSkillFrequency[norm] = (jobSkillFrequency[norm] || 0) + 1
        }
      })
    }
  })

  const frequentlyRequested = []
  const strongSkills = []
  const developingSkills = []
  const missingSkills = []

  Object.entries(jobSkillFrequency).forEach(([skillName, jobCount]) => {
    const norm = skillName.toLowerCase()
    const userMatch = userSkillMap.get(norm)

    const skillItem = {
      name: skillName,
      jobCount,
      percentageOfJobs: safeRate(jobCount, safeJobs.length),
    }

    frequentlyRequested.push(skillItem)

    if (userMatch) {
      const prof = (userMatch.proficiency || '').toLowerCase()
      if (['advanced', 'expert', 'proficient'].includes(prof)) {
        strongSkills.push({ ...skillItem, proficiency: userMatch.proficiency })
      } else {
        developingSkills.push({ ...skillItem, proficiency: userMatch.proficiency || 'Intermediate' })
      }
    } else {
      missingSkills.push(skillItem)
    }
  })

  frequentlyRequested.sort((a, b) => b.jobCount - a.jobCount)
  strongSkills.sort((a, b) => b.jobCount - a.jobCount)
  developingSkills.sort((a, b) => b.jobCount - a.jobCount)
  missingSkills.sort((a, b) => b.jobCount - a.jobCount)

  return {
    frequentlyRequested: frequentlyRequested.slice(0, 10),
    strongSkills: strongSkills.slice(0, 6),
    developingSkills: developingSkills.slice(0, 6),
    missingSkills: missingSkills.slice(0, 6),
    totalTargetSkills: Object.keys(jobSkillFrequency).length,
  }
}

export function calculateCareerRecommendations(
  overview = {},
  conversion = {},
  atsOutcome = {},
  skillsAnalysis = {},
  resumePerf = {}
) {
  const recommendations = []

  if (!overview.hasData || overview.totalApplications === 0) {
    recommendations.push({
      id: 'rec-start',
      title: 'Begin Tracking Opportunities',
      description: 'Add tracked job opportunities and submit applications to start building your career conversion intelligence.',
      priority: 'high',
      tag: 'Getting Started',
    })
    return recommendations
  }

  // 1. Funnel conversion insight
  if (overview.appliedCount >= 3 && conversion.interviewRate < 25) {
    recommendations.push({
      id: 'rec-ats-optimization',
      title: 'Enhance ATS Match & Resume Tailoring',
      description: `Your observed interview rate is ${conversion.interviewRate}%. Consider targeting jobs with higher ATS score alignment (75%+) and utilizing the Application Assistant.`,
      priority: 'high',
      tag: 'Conversion Focus',
    })
  }

  // 2. High performing resume version
  if (resumePerf.resumes && resumePerf.resumes.length > 1) {
    const topResume = resumePerf.resumes[0]
    if (topResume.interviewRate > 0 && topResume.applicationCount >= 2) {
      recommendations.push({
        id: 'rec-top-resume',
        title: `Leverage Top Resume "${topResume.title}"`,
        description: `Applications using "${topResume.title}" achieved a ${topResume.interviewRate}% interview rate. Consider adapting similar phrasing across other resumes.`,
        priority: 'medium',
        tag: 'Resume Performance',
      })
    }
  }

  // 3. Developing skills in target roles
  if (skillsAnalysis.developingSkills && skillsAnalysis.developingSkills.length > 0) {
    const topDev = skillsAnalysis.developingSkills[0]
    recommendations.push({
      id: 'rec-dev-skill',
      title: `Level Up "${topDev.name}" Competency`,
      description: `"${topDev.name}" is requested across ${topDev.jobCount} of your tracked roles but is currently marked as ${topDev.proficiency}. Consider building a portfolio project to showcase mastery.`,
      priority: 'medium',
      tag: 'Skill Growth',
    })
  }

  // 4. Missing high-frequency skills
  if (skillsAnalysis.missingSkills && skillsAnalysis.missingSkills.length > 0) {
    const topMissing = skillsAnalysis.missingSkills[0]
    if (topMissing.jobCount >= 2) {
      recommendations.push({
        id: 'rec-missing-skill',
        title: `Consider Adding "${topMissing.name}"`,
        description: `"${topMissing.name}" appears in ${topMissing.jobCount} target opportunities. If you have verified experience, add it to your Career Profile.`,
        priority: 'low',
        tag: 'Market Demand',
      })
    }
  }

  // 5. Unapplied saved jobs
  if (overview.savedCount >= 3) {
    recommendations.push({
      id: 'rec-saved-pipeline',
      title: `${overview.savedCount} Saved Opportunities Ready`,
      description: 'You have multiple saved jobs ready for tailored applications. Use the Cover Letter Customization engine to prepare packages.',
      priority: 'low',
      tag: 'Pipeline Action',
    })
  }

  if (recommendations.length === 0) {
    recommendations.push({
      id: 'rec-maintain',
      title: 'Maintain Consistent Application Velocity',
      description: 'Your application pipeline is active. Continue updating interview notes and tracking stage outcomes.',
      priority: 'low',
      tag: 'Best Practice',
    })
  }

  return recommendations
}

export function calculateFullAnalytics(
  jobs = [],
  applications = [],
  atsAnalyses = {},
  resumes = [],
  userSkills = []
) {
  const safeJobs = Array.isArray(jobs) ? jobs.filter(Boolean) : []
  const safeApps = Array.isArray(applications) ? applications.filter(Boolean) : []
  const safeAnalyses = atsAnalyses && typeof atsAnalyses === 'object' ? atsAnalyses : {}
  const safeResumes = Array.isArray(resumes) ? resumes.filter(Boolean) : []
  const safeSkills = Array.isArray(userSkills) ? userSkills.filter(Boolean) : []

  const overview = calculateApplicationOverview(safeJobs, safeApps)
  const conversion = calculateConversionMetrics(safeApps, safeJobs)
  const funnel = calculateApplicationFunnel(safeJobs, safeApps)
  const time = calculateTimeMetrics(safeApps)
  const atsOutcome = calculateAtsOutcomeAnalysis(safeJobs, safeApps, safeAnalyses)
  const resumePerformance = calculateResumePerformance(safeApps, safeResumes)
  const sourcePerformance = calculateSourcePerformance(safeJobs, safeApps)
  const workTypePerformance = calculateWorkTypePerformance(safeJobs, safeApps)
  const skillOpportunity = calculateSkillOpportunityAnalysis(safeJobs, safeSkills)
  const recommendations = calculateCareerRecommendations(
    overview,
    conversion,
    atsOutcome,
    skillOpportunity,
    resumePerformance
  )

  return {
    overview,
    conversion,
    funnel,
    time,
    atsOutcome,
    resumePerformance,
    sourcePerformance,
    workTypePerformance,
    skillOpportunity,
    recommendations,
  }
}
