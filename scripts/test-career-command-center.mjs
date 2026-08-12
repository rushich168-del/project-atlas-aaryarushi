import {
  calculateCareerReadiness,
  calculateApplicationAttentionRadar,
  calculateTopJobMatches,
  calculateSkillBlockers,
  generateWeeklyPlan,
  generateNextBestActions,
  calculateFullCommandCenterData,
} from '../src/services/careerCommandCenterService.js'

console.log('--- Testing Personal Career Command Center ---')

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

// 1. Empty Baseline
const emptyRes = calculateFullCommandCenterData({})
assert(emptyRes.readiness.overallScore === 0, 'Test 1: Empty baseline overall readiness is 0')

// 2. Empty/Malformed Input Safety
const malformedRes = calculateFullCommandCenterData({
  profile: null,
  skills: [null, undefined],
  experience: [null],
  education: [null],
  resumes: [null],
  jobs: [null],
  applications: [null],
  practiceSessions: [null],
  portfolio: null,
})
assert(malformedRes && !isNaN(malformedRes.readiness.overallScore), 'Test 2: Malformed input handled without crash')

// 3. Skill Readiness Exact Arithmetic
// Total requirements for Senior Full Stack Engineer = 9
// If 9 strong skills provided -> 100%
const fullSkills = [
  { name: 'React / Next.js', proficiency: 'Advanced' },
  { name: 'JavaScript (ESNext)', proficiency: 'Expert' },
  { name: 'Node.js & Vite', proficiency: 'Advanced' },
  { name: 'Supabase & PostgreSQL', proficiency: 'Advanced' },
  { name: 'System Architecture', proficiency: 'Advanced' },
  { name: 'Tailwind CSS', proficiency: 'Intermediate' },
  { name: 'Docker / Cloud Infra', proficiency: 'Intermediate' },
  { name: 'CI/CD & Testing', proficiency: 'Intermediate' },
  { name: 'Team Leadership & Mentoring', proficiency: 'Advanced' },
]
const fullSkillsReadiness = calculateCareerReadiness({
  skills: fullSkills,
  targetRole: 'Senior Full Stack Engineer / Technical Lead',
})
assert(fullSkillsReadiness.skillReadiness === 100, `Test 3: Full skill readiness evaluates to 100% (${fullSkillsReadiness.skillReadiness}%)`)

// 4. Resume Readiness Exact Arithmetic
const singleResumeNoSec = calculateCareerReadiness({
  resumes: [{ id: 'r1', title: 'Resume 1' }],
})
const singleResumeWithSec = calculateCareerReadiness({
  resumes: [{ id: 'r1', title: 'Resume 1', sections: ['s1', 's2', 's3'] }],
})
assert(singleResumeNoSec.resumeReadiness === 60, `Test 4A: Base single resume evaluates to 60% (${singleResumeNoSec.resumeReadiness}%)`)
assert(singleResumeWithSec.resumeReadiness === 100, `Test 4B: Completed resume evaluates to 100% (${singleResumeWithSec.resumeReadiness}%)`)

// 5. Pipeline Readiness Exact Arithmetic (Goal: 5 active)
const threeAppsReadiness = calculateCareerReadiness({
  applications: [
    { status: 'applied' },
    { status: 'interview' },
    { status: 'screening' },
  ],
})
assert(threeAppsReadiness.pipelineReadiness === 60, `Test 5: 3 of 5 active applications = 60% (${threeAppsReadiness.pipelineReadiness}%)`)

// 6. Interview Readiness Exact Arithmetic (Goal: 10 benchmark)
const fivePracticeReadiness = calculateCareerReadiness({
  practiceSessions: [
    { status: 'practiced' },
    { status: 'practiced' },
    { status: 'needs_review' },
    { status: 'practiced' },
    { status: 'needs_review' },
  ],
})
assert(fivePracticeReadiness.interviewReadiness === 50, `Test 6: 5 practiced sessions = 50% (${fivePracticeReadiness.interviewReadiness}%)`)

// 7. Portfolio Readiness Exact Arithmetic (Bio: 25, Slug: 25, 2 Projects: 50)
const fullPortfolioReadiness = calculateCareerReadiness({
  profile: { bio: 'Experienced full stack developer' },
  portfolio: {
    is_published: true,
    projects: [{ is_public: true }, { is_public: true }],
  },
})
assert(fullPortfolioReadiness.portfolioReadiness === 100, `Test 7: Full portfolio readiness = 100% (${fullPortfolioReadiness.portfolioReadiness}%)`)

// 8. Overall Weighted Readiness Arithmetic
// 100*0.30 + 100*0.20 + 100*0.20 + 100*0.15 + 100*0.15 = 100
const fullReadiness = calculateCareerReadiness({
  skills: fullSkills,
  resumes: [{ id: 'r1', sections: ['s1', 's2', 's3'] }],
  applications: Array(5).fill({ status: 'applied' }),
  practiceSessions: Array(10).fill({ status: 'practiced' }),
  profile: { bio: 'Experienced full stack developer' },
  portfolio: { is_published: true, projects: [{ is_public: true }, { is_public: true }] },
})
assert(fullReadiness.overallScore === 100, `Test 8: Fully satisfied metrics evaluate to exactly 100% (${fullReadiness.overallScore}%)`)

// 9. Score Lower Boundary = 0
assert(emptyRes.readiness.overallScore >= 0 && emptyRes.readiness.skillReadiness >= 0, 'Test 9: Lower boundary >= 0 verified')

// 10. Score Upper Boundary = 100
const overflowReadiness = calculateCareerReadiness({
  skills: fullSkills,
  resumes: Array(5).fill({ id: 'r1', sections: ['s1', 's2', 's3', 's4'] }),
  applications: Array(20).fill({ status: 'applied' }),
  practiceSessions: Array(30).fill({ status: 'practiced' }),
  profile: { bio: 'Experienced developer' },
  portfolio: { is_published: true, projects: Array(10).fill({ is_public: true }) },
})
assert(overflowReadiness.overallScore <= 100 && overflowReadiness.pipelineReadiness === 100, 'Test 10: Upper boundary <= 100 verified on overflow data')

// 11. Interview Attention Detection
const radarInterview = calculateApplicationAttentionRadar(
  [{ id: 'a1', job_id: 'j1', status: 'interview' }],
  [{ id: 'j1', title: 'Tech Lead', company: 'Google' }]
)
assert(radarInterview.some((a) => a.urgency === 'HIGH' && a.type === 'interview_prep'), 'Test 11: Interview stage triggers HIGH urgency radar alert')

// 12. Applied >7 Day Follow-Up Detection
const eightDaysAgo = new Date(Date.now() - 8 * 24 * 60 * 60 * 1000).toISOString()
const radarFollowUp = calculateApplicationAttentionRadar(
  [{ id: 'a2', job_id: 'j2', status: 'applied', applied_at: eightDaysAgo }],
  [{ id: 'j2', title: 'Full Stack Dev', company: 'Meta' }]
)
assert(radarFollowUp.some((a) => a.urgency === 'MEDIUM' && a.type === 'follow_up'), 'Test 12: Applied >7d triggers follow-up alert')

// 13. Saved Deadline Warning
const threeDaysFuture = new Date(Date.now() + 3 * 24 * 60 * 60 * 1000).toISOString()
const radarDeadline = calculateApplicationAttentionRadar(
  [{ id: 'a3', job_id: 'j3', status: 'saved' }],
  [{ id: 'j3', title: 'Staff Engineer', company: 'Stripe', deadline: threeDaysFuture }]
)
assert(radarDeadline.some((a) => a.type === 'deadline_warning'), 'Test 13: Saved job nearing deadline triggers warning alert')

// 14. Missing Deadline Safety
const radarNoDeadline = calculateApplicationAttentionRadar(
  [{ id: 'a4', job_id: 'j4', status: 'saved' }],
  [{ id: 'j4', title: 'Developer', company: 'Acme', deadline: null }]
)
assert(radarNoDeadline.length === 0, 'Test 14: Missing deadline handled gracefully without alert or crash')

// 15. Top ATS Match Ordering
const trackedJobsList = [
  { id: 'j1', title: 'Rust Backend Engineer', company: 'Acme', skills: ['Rust', 'Go', 'Kubernetes'] },
  { id: 'j2', title: 'Senior Full Stack', company: 'Beta', skills: ['React / Next.js', 'JavaScript (ESNext)', 'Node.js & Vite', 'Supabase & PostgreSQL'] },
]
const userSkillsList = [
  { name: 'React / Next.js', proficiency: 'Advanced' },
  { name: 'JavaScript (ESNext)', proficiency: 'Expert' },
  { name: 'Node.js & Vite', proficiency: 'Advanced' },
  { name: 'Supabase & PostgreSQL', proficiency: 'Advanced' },
]
const topMatches = calculateTopJobMatches({
  jobs: trackedJobsList,
  skills: userSkillsList,
})
assert(topMatches[0].jobId === 'j2' && topMatches[0].matchScore > topMatches[1].matchScore, 'Test 15: Top ATS matches sorted descending by match score')

// 16. Skill Blocker Prioritization
const gapMatrixTest = [
  { skill_name: 'Supabase & PostgreSQL', importance: 'High', status: 'Missing' },
  { skill_name: 'System Architecture', importance: 'Critical', status: 'Developing' },
]
const blockers = calculateSkillBlockers({
  gapMatrix: gapMatrixTest,
  userSkills: [{ name: 'System Architecture', proficiency: 'Intermediate' }],
})
assert(blockers.length === 2 && blockers[0].priorityScore >= blockers[1].priorityScore, 'Test 16: Skill blockers prioritized by career priority score')

// 17. Weekly Plan Deterministic Output
const plan = generateWeeklyPlan({
  skillBlockers: blockers,
  attentionItems: radarInterview,
  topJobMatches: topMatches,
})
assert(plan.length >= 3 && plan.some((p) => p.category === 'Interview Preparation'), 'Test 17: Weekly plan synthesizes active interview prep and skill progression')

// 18. No Irrelevant Weekly Tasks
const emptyPlan = generateWeeklyPlan({})
assert(emptyPlan.length > 0 && !emptyPlan.some((p) => p.title.includes('undefined')), 'Test 18: Fallback weekly plan contains clean deterministic items')

// 19. Next-Best-Action Ordering
const nextActions = generateNextBestActions({
  attentionItems: radarInterview,
  skillBlockers: blockers,
  topJobMatches: topMatches,
})
assert(nextActions.length > 0 && nextActions[0].priority === 'CRITICAL', 'Test 19: Critical interview attention item ranked #1 in queue')

// 20. No NaN in Full Output
const fullCC = calculateFullCommandCenterData({
  skills: userSkillsList,
  jobs: trackedJobsList,
  applications: [{ id: 'a1', job_id: 'j2', status: 'applied' }],
})
assert(!isNaN(fullCC.readiness.overallScore) && !isNaN(fullCC.summary.topMatchScore), 'Test 20: No NaN values in full command center data bundle')

// 21. No Undefined Critical Output
assert(fullCC.primaryAction && typeof fullCC.primaryAction.title === 'string', 'Test 21: Primary next best action title is string without undefined')

// 22. Repeated Identical Input Produces Identical Output (100% Determinism)
const runA = JSON.stringify(calculateFullCommandCenterData({ skills: userSkillsList, jobs: trackedJobsList }))
const runB = JSON.stringify(calculateFullCommandCenterData({ skills: userSkillsList, jobs: trackedJobsList }))
assert(runA === runB, 'Test 22: Identical inputs produce bit-for-bit identical outputs')

// 23. Missing Profile Fields
const missingProfileCC = calculateFullCommandCenterData({
  profile: {},
})
assert(missingProfileCC.targetRole === 'Senior Full Stack Engineer / Technical Lead', 'Test 23: Default target role applied when profile is empty')

// 24. Missing Jobs/Applications/Resumes/Interview/Portfolio Data
const emptyAllCC = calculateFullCommandCenterData({
  profile: null,
  skills: [],
  experience: [],
  education: [],
  resumes: [],
  jobs: [],
  applications: [],
  practiceSessions: [],
  portfolio: null,
})
assert(emptyAllCC.topJobMatches.length === 0 && emptyAllCC.readiness.overallScore === 0, 'Test 24: Missing entire dataset handles safely with clean empty state')

console.log(`\nResults: ${passed} passed, ${failed} failed`)
if (failed > 0) process.exit(1)
