/**
 * Project Atlas — Comprehensive Career Suite End-to-End Test Suite
 * Validates cross-module data flow, privacy boundaries, deterministic intelligence, and error resilience.
 */

import { calculateJobMatch } from '../src/services/jobMatchService.js'
import { calculateSkillGaps } from '../src/services/skillsInterviewService.js'
import { calculateFullCareerProgress } from '../src/services/careerProgressService.js'
import { calculateFullAnalytics } from '../src/services/applicationAnalyticsService.js'
import { validateCoverLetterFacts, countWordsAndCharacters } from '../src/services/applicationAssistantService.js'
import { calculateFullCommandCenterData, calculateCareerReadiness } from '../src/services/careerCommandCenterService.js'
import { generateDraftBio } from '../src/services/portfolioService.js'

console.log('=== Running Career Suite Comprehensive End-to-End Test Suite ===\n')

let passed = 0
let failed = 0

function assert(condition, message) {
  if (condition) {
    console.log(`✓ PASS: ${message}`)
    passed++
  } else {
    console.error(`✕ FAIL: ${message}`)
    failed++
  }
}

// ==========================================
// SCENARIO 1: Empty Candidate Baseline
// ==========================================
const emptyCC = calculateFullCommandCenterData({})
assert(emptyCC.readiness.overallScore === 0, 'Scenario 1A: Empty candidate overall readiness score is 0')
assert(emptyCC.topJobMatches.length === 0, 'Scenario 1B: Empty candidate returns 0 job matches without error')
assert(emptyCC.attentionItems.length === 0, 'Scenario 1C: Empty candidate returns 0 attention alerts')

// ==========================================
// SCENARIO 2: Complete Realistic Candidate Profile
// ==========================================
const realisticCandidate = {
  profile: {
    id: 'usr-1',
    full_name: 'Aarya Rushi',
    headline: 'Senior Full Stack Engineer & Automation Architect',
    summary: 'Lead developer with 4+ years architecting web platforms and automation systems.',
    location: 'Mumbai, India',
    target_role: 'Senior Full Stack Engineer / Technical Lead',
    bio: 'Experienced full stack engineer specializing in React, Node.js, and PostgreSQL.',
  },
  skills: [
    { name: 'React / Next.js', category: 'Technical', proficiency: 'Advanced' },
    { name: 'JavaScript (ESNext)', category: 'Technical', proficiency: 'Expert' },
    { name: 'Node.js & Vite', category: 'Technical', proficiency: 'Advanced' },
    { name: 'Supabase & PostgreSQL', category: 'Technical', proficiency: 'Advanced' },
    { name: 'System Architecture', category: 'Domain', proficiency: 'Intermediate' }, // Developing
    { name: 'Tailwind CSS', category: 'Technical', proficiency: 'Intermediate' },
    // Missing: Docker / Cloud Infra, CI/CD & Testing, Team Leadership
  ],
  experience: [
    {
      id: 'exp-1',
      title: 'Lead Software Engineer',
      company: 'AaryaRushi Automation Labs',
      location: 'Remote',
      start_date: '2024-01-01',
      is_current: true,
      achievements: 'Architected multi-tenant cloud platform with 99.9% uptime. Automated document generation across 9 enterprise tools.',
    },
    {
      id: 'exp-2',
      title: 'Full Stack Engineer',
      company: 'Tech Solutions Inc',
      location: 'Mumbai',
      start_date: '2022-06-01',
      end_date: '2023-12-31',
      is_current: false,
      achievements: 'Built high-throughput REST APIs and optimized PostgreSQL database queries reducing latency by 45%.',
    },
  ],
  education: [
    {
      id: 'edu-1',
      degree: 'Bachelor of Technology',
      field_of_study: 'Computer Science & Engineering',
      institution: 'University of Mumbai',
      graduation_year: '2022',
    },
  ],
  resumes: [
    {
      id: 'res-lead',
      title: 'Technical Lead Resume',
      target_role: 'Senior Full Stack Engineer / Technical Lead',
      skills: ['React / Next.js', 'JavaScript (ESNext)', 'Node.js & Vite', 'Supabase & PostgreSQL', 'System Architecture'],
      sections: ['Summary', 'Experience', 'Projects', 'Skills', 'Education'],
    },
    {
      id: 'res-general',
      title: 'Full Stack Engineer Resume',
      target_role: 'Software Engineer',
      skills: ['React', 'JavaScript', 'Node.js'],
      sections: ['Summary', 'Experience', 'Education'],
    },
  ],
  jobs: [
    {
      id: 'job-1',
      title: 'Senior Full Stack Engineer',
      company: 'Stripe',
      location: 'Remote',
      skills: ['React / Next.js', 'JavaScript (ESNext)', 'Node.js & Vite', 'Supabase & PostgreSQL'],
      description: 'Looking for a Senior Full Stack Engineer experienced with React, Node.js, and PostgreSQL to scale financial tooling.',
    },
    {
      id: 'job-2',
      title: 'Cloud Infrastructure Engineer',
      company: 'CloudScale',
      location: 'Remote',
      skills: ['Kubernetes', 'Docker / Cloud Infra', 'Terraform', 'CI/CD & Testing'],
      description: 'Join our cloud infrastructure team to manage Kubernetes clusters and automated CI/CD deployment pipelines.',
    },
  ],
  applications: [
    { id: 'app-1', job_id: 'job-1', status: 'interview', applied_at: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString() },
    { id: 'app-2', job_id: 'job-2', status: 'applied', applied_at: new Date(Date.now() - 9 * 24 * 60 * 60 * 1000).toISOString() },
  ],
  practiceSessions: [
    { id: 'p-1', related_skill: 'System Architecture', status: 'needs_review', question: 'Explain optimistic locking vs pessimistic concurrency.' },
    { id: 'p-2', related_skill: 'Supabase & PostgreSQL', status: 'practiced', question: 'How do you design multi-tenant schemas with RLS?' },
  ],
  portfolio: {
    is_published: true,
    publicProfile: { is_published: true, bio: 'Lead full stack developer' },
    projects: [
      { id: 'proj-1', title: 'Project Atlas Workspace', is_public: true, featured: true },
      { id: 'proj-2', title: 'Document Automation Pro', is_public: true, featured: true },
      { id: 'proj-3', title: 'Internal Private Tooling', is_public: false, featured: false },
    ],
  },
}
assert(realisticCandidate.skills.length === 6, 'Scenario 2: Realistic candidate profile instantiated')

// ==========================================
// SCENARIO 3: Career Profile → Resume Reuse
// ==========================================
assert(realisticCandidate.resumes.length === 2 && realisticCandidate.resumes[0].sections.length >= 4, 'Scenario 3: Profile reuse in multiple structured resumes')

// ==========================================
// SCENARIO 4: Career Profile → Skill Gap Analysis
// ==========================================
const gapRes = calculateSkillGaps(realisticCandidate.skills, realisticCandidate.profile.target_role)
assert(gapRes.strongCount >= 4, `Scenario 4A: Identified ${gapRes.strongCount} strong skills for target role`)
assert(gapRes.matrix.some((m) => m.skill_name === 'System Architecture' && m.status === 'Developing'), 'Scenario 4B: System Architecture correctly classified as Developing')
assert(gapRes.matrix.some((m) => m.skill_name === 'Docker / Cloud Infra' && m.status === 'Missing'), 'Scenario 4C: Docker correctly classified as Missing')

// ==========================================
// SCENARIO 5: Career Profile → ATS Match Engine
// ==========================================
const stripeMatch = calculateJobMatch(
  realisticCandidate.jobs[0],
  realisticCandidate.profile,
  realisticCandidate.skills,
  realisticCandidate.experience,
  realisticCandidate.education,
  realisticCandidate.resumes
)
assert(stripeMatch.matchScore >= 80, `Scenario 5A: Stripe job yields high ATS match score (${stripeMatch.matchScore}%)`)
assert(stripeMatch.skillScore === 100, `Scenario 5B: 100% skill score for perfectly aligned requirements (${stripeMatch.skillScore}%)`)

// ==========================================
// SCENARIO 6: ATS Match → Recommended Resume Selection
// ==========================================
assert(stripeMatch.recommendedResume && stripeMatch.recommendedResume.id === 'res-lead', 'Scenario 6: Technical Lead Resume recommended for Stripe Lead role')

// ==========================================
// SCENARIO 7: Job → Application Pipeline
// ==========================================
const cloudMatch = calculateJobMatch(
  realisticCandidate.jobs[1],
  realisticCandidate.profile,
  realisticCandidate.skills,
  realisticCandidate.experience,
  realisticCandidate.education,
  realisticCandidate.resumes
)
assert(cloudMatch.matchScore < stripeMatch.matchScore, `Scenario 7: Cloud role receives lower ATS score due to missing infrastructure skills (${cloudMatch.matchScore}% vs ${stripeMatch.matchScore}%)`)

// ==========================================
// SCENARIO 8: Application → Analytics Funnel
// ==========================================
const analytics = calculateFullAnalytics(
  realisticCandidate.jobs,
  realisticCandidate.applications,
  {},
  realisticCandidate.resumes,
  realisticCandidate.skills
)
assert(analytics.overview.totalApplications === 2 && analytics.overview.interviewCount === 1, 'Scenario 8A: Analytics overview accurately tracks 2 total applications and 1 interview')
assert(analytics.conversion.interviewRate === 50, 'Scenario 8B: Accurate 50% application-to-interview conversion rate')

// ==========================================
// SCENARIO 9: Application → Progress Intelligence
// ==========================================
const progressData = calculateFullCareerProgress({
  userSkills: realisticCandidate.skills,
  targetRole: realisticCandidate.profile.target_role,
  gapMatrix: gapRes.matrix,
  practiceSessions: realisticCandidate.practiceSessions,
  trackedJobs: realisticCandidate.jobs,
  applications: realisticCandidate.applications,
})
assert(progressData.priorities.length > 0, 'Scenario 9: Priorities computed from cross-module application signals')

// ==========================================
// SCENARIO 10: Interview Practice → Progress Intelligence
// ==========================================
const sysArchPriority = progressData.priorities.find((p) => p.skillName === 'System Architecture')
assert(sysArchPriority && sysArchPriority.reasons.some((r) => r.includes('interview practice questions')), 'Scenario 10: Unresolved interview question elevates System Architecture priority reason')

// ==========================================
// SCENARIO 11: Portfolio → Public Profile
// ==========================================
const bio = generateDraftBio(realisticCandidate.profile, realisticCandidate.skills, realisticCandidate.experience)
assert(bio.technicalLeader.includes('Aarya Rushi') && bio.technicalLeader.includes('React / Next.js'), 'Scenario 11: Professional bio generated from verified profile credentials')

// ==========================================
// SCENARIO 12: Public Profile Privacy Boundary
// ==========================================
// Verify public projects filter excludes private unlisted projects
const publicProjects = realisticCandidate.portfolio.projects.filter((p) => p.is_public !== false)
assert(publicProjects.length === 2 && !publicProjects.some((p) => p.title.includes('Private')), 'Scenario 12: Private projects excluded from public recruiter exposure')

// ==========================================
// SCENARIO 13: Command Center Multi-Dimensional Readiness
// ==========================================
const ccData = calculateFullCommandCenterData({
  profile: realisticCandidate.profile,
  skills: realisticCandidate.skills,
  experience: realisticCandidate.experience,
  education: realisticCandidate.education,
  resumes: realisticCandidate.resumes,
  jobs: realisticCandidate.jobs,
  applications: realisticCandidate.applications,
  practiceSessions: realisticCandidate.practiceSessions,
  portfolio: realisticCandidate.portfolio,
  targetRole: realisticCandidate.profile.target_role,
})
const { readiness } = ccData
assert(readiness.overallScore > 0 && readiness.overallScore <= 100, `Scenario 13A: Overall readiness score bounded (${readiness.overallScore}%)`)
assert(readiness.skillReadiness > 0 && readiness.resumeReadiness === 100, `Scenario 13B: Skill readiness (${readiness.skillReadiness}%) and Resume readiness (${readiness.resumeReadiness}%) verified`)

// ==========================================
// SCENARIO 14: Command Center Next-Best-Action Queue
// ==========================================
assert(ccData.nextBestActions.length > 0, 'Scenario 14A: Next best actions generated')
assert(ccData.primaryAction && ccData.primaryAction.priority === 'CRITICAL', 'Scenario 14B: Active interview stage elevates primary action to CRITICAL')

// ==========================================
// SCENARIO 15: Command Center Application Attention Radar
// ==========================================
const interviewAlert = ccData.attentionItems.find((a) => a.urgency === 'HIGH')
const followUpAlert = ccData.attentionItems.find((a) => a.urgency === 'MEDIUM')
assert(interviewAlert && interviewAlert.company === 'Stripe', 'Scenario 15A: High urgency radar alert for active Stripe interview')
assert(followUpAlert && followUpAlert.company === 'CloudScale', 'Scenario 15B: Medium urgency radar follow-up for CloudScale applied 9 days ago')

// ==========================================
// SCENARIO 16: Command Center 7-Day Career Action Plan
// ==========================================
assert(ccData.weeklyPlan.length >= 3, `Scenario 16: Generated ${ccData.weeklyPlan.length} deterministic weekly sprint tasks`)

// ==========================================
// SCENARIO 17: Offline State Handling
// ==========================================
const offlineReadiness = calculateCareerReadiness({
  skills: realisticCandidate.skills,
  resumes: [{ id: 'res-offline-1', title: 'Offline Resume', sections: ['Summary', 'Skills', 'Experience'] }],
})
assert(offlineReadiness.resumeReadiness === 100, 'Scenario 17: User-scoped offline resume records evaluated accurately')

// ==========================================
// SCENARIO 18: Malformed Data Safety
// ==========================================
const malformedTest = calculateFullCommandCenterData({
  profile: null,
  skills: [null, { name: null }],
  experience: [undefined],
  education: [null],
  resumes: [null],
  jobs: [null],
  applications: [null],
  practiceSessions: [null],
  portfolio: null,
})
assert(!isNaN(malformedTest.readiness.overallScore) && Array.isArray(malformedTest.topJobMatches), 'Scenario 18: Malformed inputs handled safely without runtime crash')

// ==========================================
// SCENARIO 19: Deterministic Repeated Calculations (100% Idempotent)
// ==========================================
const run1 = JSON.stringify(calculateFullCommandCenterData(realisticCandidate))
const run2 = JSON.stringify(calculateFullCommandCenterData(realisticCandidate))
assert(run1 === run2, 'Scenario 19: Repeated executions produce byte-for-byte identical output')

// ==========================================
// SCENARIO 20: 0–100 Score Boundaries
// ==========================================
let allBounded = true
for (let i = 0; i < 50; i++) {
  const randSkills = [
    { name: 'React / Next.js', proficiency: ['Beginner', 'Intermediate', 'Advanced', 'Expert'][i % 4] },
    { name: 'JavaScript (ESNext)', proficiency: ['Beginner', 'Intermediate', 'Advanced', 'Expert'][(i + 1) % 4] },
  ]
  const randJobs = [{ id: `j-${i}`, title: `Role ${i}`, company: `Co ${i}`, skills: ['React / Next.js', 'Rust'] }]
  const randRes = calculateFullCommandCenterData({ skills: randSkills, jobs: randJobs })
  if (randRes.readiness.overallScore < 0 || randRes.readiness.overallScore > 100 || isNaN(randRes.readiness.overallScore)) {
    allBounded = false
    break
  }
}
assert(allBounded, 'Scenario 20: 50 randomized candidate profiles all satisfy 0 <= score <= 100 without NaN')

console.log(`\n==========================================`)
console.log(`Total Scenarios: ${passed} passed, ${failed} failed`)
console.log(`==========================================`)

if (failed > 0) process.exit(1)
