import {
  getApplicationStrengthTier,
  generateApplicationStrategy,
  generateTailoredBulletSuggestions,
  generateCoverLetterDraft,
} from '../src/services/applicationAssistantService.js'

console.log('--- Testing Career Application Assistant ---')

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

// Test 1: Application Strength Tiers
assert(getApplicationStrengthTier(95).tier === 'Excellent Match', 'Tier 95 = Excellent Match')
assert(getApplicationStrengthTier(82).tier === 'Strong Match', 'Tier 82 = Strong Match')
assert(getApplicationStrengthTier(68).tier === 'Moderate Match', 'Tier 68 = Moderate Match')
assert(getApplicationStrengthTier(48).tier === 'Weak Match', 'Tier 48 = Weak Match')
assert(getApplicationStrengthTier(20).tier === 'Low Match', 'Tier 20 = Low Match')

// Test 2: Strategy Generation
const mockJob = {
  id: 'job-test-1',
  title: 'Fullstack Platform Engineer',
  company: 'CloudVentures',
  work_type: 'Remote',
}
const mockProfile = {
  full_name: 'Aarya Rushi',
  headline: 'Senior Fullstack Engineer',
  location: 'Bangalore, India',
}
const mockAts = {
  matchScore: 84,
  experienceScore: 90,
  matchedSkills: [{ name: 'React' }, { name: 'Node.js' }, { name: 'PostgreSQL' }],
  missingSkills: [{ name: 'Kubernetes' }],
  matchedKeywords: ['react', 'node.js', 'postgresql', 'apis'],
  missingKeywords: ['kubernetes', 'helm'],
}
const mockResume = {
  id: 'res-1',
  title: 'Senior Fullstack Resume',
  alignmentScore: 88,
}

const strategy = generateApplicationStrategy(mockJob, mockProfile, mockAts, mockResume)
assert(strategy.applicationStrength === 'Strong Match', 'Strategy calculates Strong Match')
assert(strategy.strongestPoints.length >= 2, 'Generated multiple verified strength points')
assert(strategy.missingRequirements.length >= 1, 'Identified missing requirements')

// Test 3: Tailored Bullet Suggestions (No Hallucinated Metrics)
const mockExperience = [
  {
    title: 'Lead Software Engineer',
    company_name: 'Alpha Systems',
    achievements: 'Responsible for building React frontend components.\nWorked on microservices architecture.',
  },
]
const bullets = generateTailoredBulletSuggestions(mockJob, mockExperience, [{ name: 'React' }], mockAts)
assert(bullets.length === 2, 'Generated 2 tailored bullet suggestions')
assert(bullets[0].suggested.startsWith('Led and executed building React frontend components'), 'Replaced passive phrasing with active voice')
assert(!bullets[0].suggested.includes('%') && !bullets[0].suggested.includes('40%'), 'Does not invent unverified percentage metrics')

// Test 4: Cover Letter Generation with Complete Profile
const coverLetter = generateCoverLetterDraft(mockJob, mockProfile, mockExperience, [{ name: 'React' }], mockAts, mockResume)
assert(coverLetter.includes('Dear Hiring Team at CloudVentures,'), 'Includes correct company salutation')
assert(coverLetter.includes('Fullstack Platform Engineer position at CloudVentures'), 'Includes target job title')
assert(coverLetter.includes('Lead Software Engineer at Alpha Systems'), 'Includes verified past experience')
assert(coverLetter.includes('React, Node.js, PostgreSQL'), 'Includes verified matching skills')
assert(coverLetter.includes('Aarya Rushi'), 'Signed with candidate name')

// Test 5: Cover Letter Generation with Incomplete Data (Graceful Fallback)
const incompleteLetter = generateCoverLetterDraft({ title: 'Software Engineer' }, {}, [], [], {})
assert(incompleteLetter.includes('Dear Hiring Team at the Team,'), 'Graceful salutation fallback')
assert(!incompleteLetter.includes('undefined') && !incompleteLetter.includes('null'), 'No undefined or null substrings in letter')

console.log(`\nResults: ${passed} passed, ${failed} failed`)
if (failed > 0) process.exit(1)
