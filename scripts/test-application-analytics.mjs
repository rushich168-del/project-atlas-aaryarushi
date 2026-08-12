import {
  calculateApplicationOverview,
  calculateConversionMetrics,
  calculateApplicationFunnel,
  calculateTimeMetrics,
  calculateAtsOutcomeAnalysis,
  calculateResumePerformance,
  calculateSourcePerformance,
  calculateWorkTypePerformance,
  calculateSkillOpportunityAnalysis,
  calculateCareerRecommendations,
  calculateFullAnalytics,
} from '../src/services/applicationAnalyticsService.js'

console.log('--- Testing Career Application Intelligence & Analytics Engine ---')

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

// 1. Empty Dataset
const emptyOverview = calculateApplicationOverview([], [])
assert(emptyOverview.trackedJobs === 0 && emptyOverview.totalApplications === 0 && emptyOverview.hasData === false, 'Test 1: Empty dataset handled gracefully')

// 2. Single Application
const singleApp = [{ id: 'app-1', job_id: 'job-1', status: 'applied', applied_at: '2026-08-10T00:00:00Z' }]
const singleJob = [{ id: 'job-1', title: 'Engineer', skills: ['React'] }]
const singleOverview = calculateApplicationOverview(singleJob, singleApp)
assert(singleOverview.trackedJobs === 1 && singleOverview.appliedCount === 1 && singleOverview.hasData === true, 'Test 2: Single application metrics')

// 3. Complete Successful Funnel (Applied -> Screening -> Interview -> Offer)
const fullFunnelApps = [
  { id: 'a1', job_id: 'j1', status: 'offer', applied_at: '2026-08-01T00:00:00Z' },
  { id: 'a2', job_id: 'j2', status: 'interview', applied_at: '2026-08-02T00:00:00Z' },
  { id: 'a3', job_id: 'j3', status: 'screening', applied_at: '2026-08-03T00:00:00Z' },
  { id: 'a4', job_id: 'j4', status: 'applied', applied_at: '2026-08-04T00:00:00Z' },
]
const fullFunnel = calculateApplicationFunnel([{ id: 'j1' }, { id: 'j2' }, { id: 'j3' }, { id: 'j4' }], fullFunnelApps)
assert(fullFunnel.stages.find((s) => s.id === 'offer').count === 1, 'Test 3: Offer count in funnel is 1')

// 4. Rejected Applications
const rejApps = [{ id: 'a1', job_id: 'j1', status: 'rejected' }]
const rejFunnel = calculateApplicationFunnel([{ id: 'j1' }], rejApps)
assert(rejFunnel.rejectedCount === 1, 'Test 4: Rejected applications counted in dropoffs')

// 5. Withdrawn Applications
const withApps = [{ id: 'a1', job_id: 'j1', status: 'withdrawn' }]
const withFunnel = calculateApplicationFunnel([{ id: 'j1' }], withApps)
assert(withFunnel.withdrawnCount === 1, 'Test 5: Withdrawn applications counted in dropoffs')

// 6. Mixed Application Statuses
const mixedApps = [
  { id: 'a1', job_id: 'j1', status: 'applied' },
  { id: 'a2', job_id: 'j2', status: 'screening' },
  { id: 'a3', job_id: 'j3', status: 'interview' },
  { id: 'a4', job_id: 'j4', status: 'offer' },
  { id: 'a5', job_id: 'j5', status: 'rejected' },
  { id: 'a6', job_id: 'j6', status: 'withdrawn' },
]
const mixedOverview = calculateApplicationOverview(new Array(6).fill({}), mixedApps)
assert(mixedOverview.activeApplicationsCount === 4, 'Test 6: Active applications exclude rejected/withdrawn')

// 7. Missing applied_at
const missingDateApps = [{ id: 'a1', job_id: 'j1', status: 'applied' }]
const timeMetrics = calculateTimeMetrics(missingDateApps)
assert(timeMetrics.hasTimeData === false && timeMetrics.averageDaysInPipeline === 0, 'Test 7: Missing applied_at does not throw NaN')

// 8. Missing ATS Analysis
const atsAnalysis = calculateAtsOutcomeAnalysis([{ id: 'j1' }], [{ id: 'a1', job_id: 'j1', status: 'interview' }], {})
assert(atsAnalysis.hasAtsData === false && atsAnalysis.averageAtsScore === 0, 'Test 8: Missing ATS analysis returns safe defaults')

// 9. Multiple Resumes Performance
const resumeApps = [
  { id: 'a1', job_id: 'j1', resume_id: 'res-1', status: 'interview' },
  { id: 'a2', job_id: 'j2', resume_id: 'res-1', status: 'offer' },
  { id: 'a3', job_id: 'j3', resume_id: 'res-2', status: 'applied' },
]
const resumes = [{ id: 'res-1', title: 'Senior Architect' }, { id: 'res-2', title: 'General Resume' }]
const resumePerf = calculateResumePerformance(resumeApps, resumes)
assert(resumePerf.resumes[0].resumeId === 'res-1' && resumePerf.resumes[0].interviewRate === 100, 'Test 9: Resume performance rates accurate')

// 10. Multiple Job Sources Performance
const sourceJobs = [
  { id: 'j1', source: 'LinkedIn' },
  { id: 'j2', source: 'LinkedIn' },
  { id: 'j3', source: 'Company Portal' },
]
const sourceApps = [
  { id: 'a1', job_id: 'j1', status: 'interview' },
  { id: 'a2', job_id: 'j2', status: 'applied' },
  { id: 'a3', job_id: 'j3', status: 'offer' },
]
const sourcePerf = calculateSourcePerformance(sourceJobs, sourceApps)
assert(sourcePerf.sources.length === 2, 'Test 10: Sources categorized correctly')

// 11. Multiple Work Types Performance
const wtJobs = [
  { id: 'j1', work_type: 'Full-time', employment_type: 'Remote' },
  { id: 'j2', work_type: 'Contract', employment_type: 'Hybrid' },
]
const wtApps = [
  { id: 'a1', job_id: 'j1', status: 'interview' },
  { id: 'a2', job_id: 'j2', status: 'applied' },
]
const wtPerf = calculateWorkTypePerformance(wtJobs, wtApps)
assert(wtPerf.workTypes.length === 2, 'Test 11: Work type performance parsed')

// 12. ATS Score Band Calculations
const atsBandJobs = [{ id: 'j1' }, { id: 'j2' }, { id: 'j3' }]
const atsBandApps = [
  { id: 'a1', job_id: 'j1', status: 'offer' },
  { id: 'a2', job_id: 'j2', status: 'interview' },
  { id: 'a3', job_id: 'j3', status: 'rejected' },
]
const mockAnalyses = {
  j1: { matchScore: 92 },
  j2: { matchScore: 74 },
  j3: { matchScore: 45 },
}
const atsBandResult = calculateAtsOutcomeAnalysis(atsBandJobs, atsBandApps, mockAnalyses)
assert(atsBandResult.averageAtsScore === 70, `Test 12: Average ATS score is ${atsBandResult.averageAtsScore}`)
assert(atsBandResult.scoreBands.find((b) => b.name.includes('80–100%')).offers === 1, 'Test 12B: High band offer recorded')

// 13. Skill Frequency Analysis
const skillJobs = [
  { id: 'j1', skills: ['PostgreSQL', 'React', 'Node.js'] },
  { id: 'j2', skills: ['PostgreSQL', 'AWS', 'Docker'] },
  { id: 'j3', skills: ['PostgreSQL', 'React', 'Kubernetes'] },
]
const userSkills = [
  { name: 'PostgreSQL', proficiency: 'Expert' },
  { name: 'React', proficiency: 'Intermediate' },
]
const skillAnalysis = calculateSkillOpportunityAnalysis(skillJobs, userSkills)
assert(skillAnalysis.frequentlyRequested[0].name === 'PostgreSQL' && skillAnalysis.frequentlyRequested[0].jobCount === 3, 'Test 13: Frequently requested skills ranked')

// 14. Developing Skill Detection
assert(skillAnalysis.developingSkills.some((s) => s.name === 'React'), 'Test 14: Developing skill React identified')

// 15. Missing Skill Detection
assert(skillAnalysis.missingSkills.some((s) => s.name === 'Docker' || s.name === 'AWS'), 'Test 15: Missing skills Docker/AWS identified')

// 16. Recommendation Generation
const recs = calculateCareerRecommendations(
  { hasData: true, totalApplications: 8, appliedCount: 8, savedCount: 4 },
  { interviewRate: 12 },
  atsBandResult,
  skillAnalysis,
  resumePerf
)
assert(recs.length >= 2, 'Test 16: Recommendations generated based on data')

// 17. 0 Denominator Protection
const zeroConversion = calculateConversionMetrics([], [])
assert(
  zeroConversion.applicationRate === 0 &&
  zeroConversion.interviewRate === 0 &&
  zeroConversion.offerRate === 0,
  'Test 17: Zero denominator rates evaluate to 0 without NaN'
)

// 18. Percentage Boundaries (0 <= rate <= 100)
const boundedConversion = calculateConversionMetrics(new Array(10).fill({ status: 'offer' }), [{ id: 'j1' }])
assert(boundedConversion.offerRate <= 100 && boundedConversion.offerRate >= 0, 'Test 18: Conversion rates clamped between 0 and 100')

// 19. Malformed Records
const malformedResult = calculateFullAnalytics([null, undefined, {}], [null, { status: null }, { applied_at: 'bad-date' }], null, null, null)
assert(malformedResult.overview.trackedJobs === 1 && malformedResult.overview.totalApplications === 2 && !isNaN(malformedResult.conversion.applicationRate), 'Test 19: Malformed items handled gracefully without crash')

// 20. Randomized Dataset Boundary Tests
const randJobs = Array.from({ length: 50 }, (_, i) => ({
  id: `rand-j-${i}`,
  skills: ['TypeScript', 'Go', 'GraphQL'].slice(0, (i % 3) + 1),
  source: ['LinkedIn', 'Referral', 'Indeed'][i % 3],
  work_type: ['Full-time', 'Contract'][i % 2],
  employment_type: ['Remote', 'Hybrid', 'Onsite'][i % 3],
}))
const randApps = Array.from({ length: 30 }, (_, i) => ({
  id: `rand-a-${i}`,
  job_id: `rand-j-${i % 20}`,
  status: ['saved', 'applied', 'screening', 'interview', 'offer', 'rejected', 'withdrawn'][i % 7],
  applied_at: new Date(Date.now() - i * 86400000).toISOString(),
}))
const fullAnalytics = calculateFullAnalytics(randJobs, randApps, {}, [], [])
assert(fullAnalytics.overview.totalApplications === 30, 'Test 20: Full analytics computed on randomized dataset')
assert(fullAnalytics.conversion.applicationRate >= 0 && fullAnalytics.conversion.applicationRate <= 100, 'Test 20B: Random dataset rate boundaries hold')

console.log(`\nResults: ${passed} passed, ${failed} failed`)
if (failed > 0) process.exit(1)
