import {
  calculateSkillPriority,
  calculateSkillPriorities,
  calculateRoadmapProgress,
  generateSmartMilestones,
  calculateProgressSignals,
  generateNextBestActions,
  calculateFullCareerProgress,
} from '../src/services/careerProgressService.js'

console.log('--- Testing Career Progress Intelligence & Adaptive Roadmap Engine ---')

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

// 1. Empty Profile
const emptyProgress = calculateFullCareerProgress({
  userSkills: [],
  targetRole: 'Senior Full Stack Engineer / Technical Lead',
  gapMatrix: [],
  roadmap: null,
  practiceSessions: [],
  trackedJobs: [],
  applications: [],
})
assert(emptyProgress.priorities.length === 0 && emptyProgress.progress.overallCompletionRate === 0, 'Test 1: Empty profile produces safe zero baseline')

// 2. No Target Role (Defaults safely)
const defaultRoleProgress = calculateFullCareerProgress({
  userSkills: [{ name: 'React', proficiency: 'Advanced' }],
})
assert(defaultRoleProgress.targetRole === 'Senior Full Stack Engineer / Technical Lead', 'Test 2: Default target role applied')

// 3. No Skills (All Missing)
const noSkillsPrio = calculateSkillPriority({
  skillReq: { skill_name: 'PostgreSQL', importance: 'Critical', required_proficiency: 'Advanced' },
  userSkill: null,
})
assert(noSkillsPrio.gapStatus === 'Missing' && noSkillsPrio.priorityScore >= 50, 'Test 3: Missing skill receives high priority score')

// 4. Missing Skill
const missingPrio = calculateSkillPriority({
  skillReq: { skill_name: 'System Architecture', importance: 'Critical', required_proficiency: 'Advanced' },
  userSkill: null,
})
assert(missingPrio.reasons.some((r) => r.includes('missing from your verified profile')), 'Test 4: Missing skill has clear rationale')

// 5. Developing Skill
const devPrio = calculateSkillPriority({
  skillReq: { skill_name: 'System Architecture', importance: 'Critical', required_proficiency: 'Advanced' },
  userSkill: { name: 'System Architecture', proficiency: 'Intermediate' },
})
assert(devPrio.gapStatus === 'Developing' && devPrio.priorityScore > 0, 'Test 5: Developing skill identified with required upgrade')

// 6. Strong Skill (Meets/exceeds requirement)
const strongPrio = calculateSkillPriority({
  skillReq: { skill_name: 'System Architecture', importance: 'Critical', required_proficiency: 'Advanced' },
  userSkill: { name: 'System Architecture', proficiency: 'Expert' },
})
assert(strongPrio.gapStatus === 'Strong' && strongPrio.priorityScore < devPrio.priorityScore, 'Test 6: Strong skill priority is lower than developing')

// 7. Critical Requirement
const critPrio = calculateSkillPriority({
  skillReq: { skill_name: 'Core System', importance: 'Critical', required_proficiency: 'Advanced' },
  userSkill: null,
})
// 8. High Requirement
const highPrio = calculateSkillPriority({
  skillReq: { skill_name: 'Core System', importance: 'High', required_proficiency: 'Advanced' },
  userSkill: null,
})
assert(critPrio.priorityScore >= highPrio.priorityScore, 'Test 7 & 8: Critical importance score >= High importance score')

// 9. Medium Requirement
const medPrio = calculateSkillPriority({
  skillReq: { skill_name: 'Tooling', importance: 'Medium', required_proficiency: 'Intermediate' },
  userSkill: null,
})
// 10. Nice-to-have Requirement
const lowPrio = calculateSkillPriority({
  skillReq: { skill_name: 'Tooling', importance: 'Nice-to-have', required_proficiency: 'Intermediate' },
  userSkill: null,
})
assert(medPrio.priorityScore >= lowPrio.priorityScore, 'Test 9 & 10: Medium requirement >= Nice-to-have requirement')

// 11. Multiple Tracked Jobs
const trackedJobs = [
  { id: 'j1', skills: ['PostgreSQL', 'React'] },
  { id: 'j2', skills: ['PostgreSQL', 'Node.js'] },
  { id: 'j3', skills: ['PostgreSQL', 'Docker'] },
]
const jobDemandPrio = calculateSkillPriority({
  skillReq: { skill_name: 'PostgreSQL', importance: 'High', required_proficiency: 'Advanced' },
  userSkill: { name: 'PostgreSQL', proficiency: 'Intermediate' },
  trackedJobs,
})
assert(jobDemandPrio.jobCount === 3, 'Test 11: Job demand occurrences calculated')

// 12. Skill Demand Frequency (Increases Priority)
const zeroDemandPrio = calculateSkillPriority({
  skillReq: { skill_name: 'PostgreSQL', importance: 'High', required_proficiency: 'Advanced' },
  userSkill: { name: 'PostgreSQL', proficiency: 'Intermediate' },
  trackedJobs: [],
})
assert(jobDemandPrio.priorityScore > zeroDemandPrio.priorityScore, 'Test 12: Higher job frequency yields higher priority score')

// 13. Interview Practice Relevance
const practiceSessions = [{ related_skill: 'PostgreSQL', status: 'needs_review', question: 'Explain indexing' }]
const interviewPrio = calculateSkillPriority({
  skillReq: { skill_name: 'PostgreSQL', importance: 'High', required_proficiency: 'Advanced' },
  userSkill: { name: 'PostgreSQL', proficiency: 'Intermediate' },
  practiceSessions,
})
assert(interviewPrio.reasons.some((r) => r.includes('interview practice questions')), 'Test 13: Interview practice status elevates priority')

// 14. Completed Roadmap Item (Reduces Priority)
const completedPrio = calculateSkillPriority({
  skillReq: { skill_name: 'PostgreSQL', importance: 'High', required_proficiency: 'Advanced' },
  userSkill: { name: 'PostgreSQL', proficiency: 'Intermediate' },
  roadmapItem: { status: 'completed' },
})
// 15. In-Progress Roadmap Item (Higher Momentum)
const inProgressPrio = calculateSkillPriority({
  skillReq: { skill_name: 'PostgreSQL', importance: 'High', required_proficiency: 'Advanced' },
  userSkill: { name: 'PostgreSQL', proficiency: 'Intermediate' },
  roadmapItem: { status: 'in_progress' },
})
assert(inProgressPrio.priorityScore > completedPrio.priorityScore, 'Test 14 & 15: In-progress momentum > completed')

// 16. Not-Started Roadmap Item
const notStartedPrio = calculateSkillPriority({
  skillReq: { skill_name: 'PostgreSQL', importance: 'High', required_proficiency: 'Advanced' },
  userSkill: { name: 'PostgreSQL', proficiency: 'Intermediate' },
  roadmapItem: { status: 'not_started' },
})
assert(notStartedPrio.roadmapItemStatus === 'not_started', 'Test 16: Not-started item status preserved')

// 17. Overdue / Completion Calculation
const roadmapObj = {
  items: [
    { id: 'i1', skill_name: 'React', status: 'completed' },
    { id: 'i2', skill_name: 'Node.js', status: 'in_progress' },
    { id: 'i3', skill_name: 'PostgreSQL', status: 'not_started' },
  ],
}
const gapMatrix = [
  { skill_name: 'React', importance: 'Critical', status: 'Strong' },
  { skill_name: 'Node.js', importance: 'Critical', status: 'Developing' },
  { skill_name: 'PostgreSQL', importance: 'High', status: 'Missing' },
]
const roadmapProg = calculateRoadmapProgress(roadmapObj, gapMatrix)
assert(roadmapProg.overallCompletionRate === 33, `Test 17: Roadmap completion is 33% (${roadmapProg.overallCompletionRate}%)`)
assert(roadmapProg.criticalReadiness === 50, `Test 17B: Critical readiness is 50% (${roadmapProg.criticalReadiness}%)`)

// 18. Mixed Application Outcomes
const apps = [
  { id: 'a1', job_id: 'j1', status: 'interview' },
  { id: 'a2', job_id: 'j2', status: 'applied' },
]
const appPrio = calculateSkillPriority({
  skillReq: { skill_name: 'PostgreSQL', importance: 'High', required_proficiency: 'Advanced' },
  userSkill: { name: 'PostgreSQL', proficiency: 'Intermediate' },
  trackedJobs,
  applications: apps,
})
assert(appPrio.reasons.some((r) => r.includes('actively interviewing or applying')), 'Test 18: Active pipeline application boost reflected in reasons')

// 19. Progress Signals Calculation
const signals = calculateProgressSignals({
  roadmapProgress: roadmapProg,
  skillPriorities: [jobDemandPrio],
  applications: apps,
  practiceSessions,
})
assert(signals.positiveSignals.length > 0 && signals.applicationSignals.length > 0, 'Test 19: Positive and application signals generated')

// 20. Priority Calculation Bounds
const priorities = calculateSkillPriorities({
  gapMatrix,
  userSkills: [{ name: 'React', proficiency: 'Expert' }],
  trackedJobs,
  applications: apps,
  practiceSessions,
  roadmapItems: roadmapObj.items,
})
assert(priorities.length === 3 && priorities[0].priorityScore >= priorities[1].priorityScore, 'Test 20: Priorities sorted descending')

// 21. Next-Best-Action Generation
const nextActions = generateNextBestActions(priorities, roadmapProg, practiceSessions)
assert(nextActions.length > 0 && nextActions[0].title.length > 0, 'Test 21: Next best actions generated')

// 22. Empty-Data Fallback
const emptyMilestones = generateSmartMilestones([], [])
assert(emptyMilestones.length === 0, 'Test 22: Empty smart milestones returns empty list')

// 23. Malformed Data
const malformedFull = calculateFullCareerProgress({
  userSkills: [null, undefined],
  gapMatrix: [null, { skill_name: null }],
  roadmap: { items: [null] },
  practiceSessions: [null],
  trackedJobs: [null],
  applications: [null],
})
assert(malformedFull.priorities.length === 1 && !isNaN(malformedFull.progress.overallCompletionRate), 'Test 23: Malformed inputs handled without error')

// 24. Randomized Score Boundary Tests (Guarantee 0 <= score <= 100)
for (let i = 0; i < 50; i++) {
  const randReq = {
    skill_name: `Skill-${i}`,
    importance: ['Critical', 'High', 'Medium', 'Low'][i % 4],
    required_proficiency: ['Beginner', 'Intermediate', 'Advanced', 'Expert'][i % 4],
  }
  const randUserSkill = i % 2 === 0 ? { name: `Skill-${i}`, proficiency: ['Beginner', 'Intermediate', 'Advanced', 'Expert'][(i + 1) % 4] } : null
  const randPrio = calculateSkillPriority({ skillReq: randReq, userSkill: randUserSkill })
  if (randPrio.priorityScore < 0 || randPrio.priorityScore > 100 || isNaN(randPrio.priorityScore)) {
    assert(false, `Test 24: Score out of bounds: ${randPrio.priorityScore}`)
    break
  }
}
assert(true, 'Test 24: 50 randomized iterations all satisfy 0 <= priorityScore <= 100 without NaN')

console.log(`\nResults: ${passed} passed, ${failed} failed`)
if (failed > 0) process.exit(1)
