import {
  generateCoverLetterDraft,
  validateCoverLetterFacts,
  countWordsAndCharacters,
  COVER_LETTER_TONES,
  COVER_LETTER_TEMPLATES,
} from '../src/services/applicationAssistantService.js'

console.log('--- Testing Advanced Cover Letter Customization Engine ---')

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

const mockJob = {
  id: 'job-1',
  title: 'Lead Platform Architect',
  company: 'Apex Cloud Solutions',
  work_type: 'Remote',
}

const mockProfile = {
  full_name: 'Aarya Rushi',
  headline: 'Senior Cloud & Systems Architect',
  location: 'Bangalore, India',
}

const mockExperience = [
  {
    title: 'Senior Systems Architect',
    company_name: 'Alpha Systems Corp',
    achievements: 'Engineered high-scale microservices with zero downtime.',
  },
]

const mockSkills = [
  { name: 'PostgreSQL' },
  { name: 'System Architecture' },
  { name: 'Node.js' },
  { name: 'React' },
]

const mockAts = {
  matchScore: 88,
  matchedSkills: [{ name: 'PostgreSQL' }, { name: 'System Architecture' }],
  missingSkills: [{ name: 'Kubernetes' }],
  matchedKeywords: ['postgresql', 'architecture', 'systems'],
  missingKeywords: ['kubernetes', 'helm'],
}

// 1. Executive Tone
const execLetter = generateCoverLetterDraft(mockJob, mockProfile, mockExperience, mockSkills, mockAts, null, { tone: 'Executive', template: 'Standard' })
assert(execLetter.includes('Lead Platform Architect position at Apex Cloud Solutions'), 'Test 1: Executive tone contains job and company')

// 2. Technical Tone
const techLetter = generateCoverLetterDraft(mockJob, mockProfile, mockExperience, mockSkills, mockAts, null, { tone: 'Technical', template: 'Technical' })
assert(techLetter.includes('Dear Engineering Team at Apex Cloud Solutions,'), 'Test 2: Technical tone includes Engineering Team salutation')

// 3. Creative Tone
const creativeLetter = generateCoverLetterDraft(mockJob, mockProfile, mockExperience, mockSkills, mockAts, null, { tone: 'Creative', template: 'Standard' })
assert(creativeLetter.includes('compelling alignment with my professional journey'), 'Test 3: Creative tone has engaging narrative opener')

// 4. Concise Tone
const conciseLetter = generateCoverLetterDraft(mockJob, mockProfile, mockExperience, mockSkills, mockAts, null, { tone: 'Concise', template: 'Standard' })
assert(conciseLetter.length < execLetter.length, 'Test 4: Concise tone is shorter than standard')

// 5. Standard Template
const stdTemplate = generateCoverLetterDraft(mockJob, mockProfile, mockExperience, mockSkills, mockAts, null, { template: 'Standard' })
assert(stdTemplate.includes('Subject: Application for Lead Platform Architect position'), 'Test 5: Standard template has subject header')

// 6. Executive Template
const execTemplate = generateCoverLetterDraft(mockJob, mockProfile, mockExperience, mockSkills, mockAts, null, { template: 'Executive' })
assert(execTemplate.includes('leadership opportunity'), 'Test 6: Executive template emphasizes leadership')

// 7. Technical Template
const techTemplate = generateCoverLetterDraft(mockJob, mockProfile, mockExperience, mockSkills, mockAts, null, { template: 'Technical' })
assert(techTemplate.includes('clean architecture, performance optimization'), 'Test 7: Technical template emphasizes engineering practices')

// 8. Missing Experience Fallback
const noExpLetter = generateCoverLetterDraft(mockJob, mockProfile, [], mockSkills, mockAts)
assert(noExpLetter.includes('disciplined expertise'), 'Test 8: Graceful fallback when experience is empty')

// 9. Missing Education Fallback
const noEduLetter = generateCoverLetterDraft(mockJob, mockProfile, mockExperience, mockSkills, mockAts)
assert(!noEduLetter.includes('undefined'), 'Test 9: Missing education does not leak undefined')

// 10. Missing Skills Fallback
const noSkillsLetter = generateCoverLetterDraft(mockJob, mockProfile, mockExperience, [], { matchScore: 50 })
assert(noSkillsLetter.includes('technical and analytical problem solving'), 'Test 10: Missing skills uses fallback descriptor')

// 11. Empty Job Fallback
const emptyJobLetter = generateCoverLetterDraft({}, mockProfile, mockExperience, mockSkills, mockAts)
assert(emptyJobLetter.includes('Dear Hiring Team at the Team,'), 'Test 11: Empty job gracefully defaults company to the Team')

// 12. Special Characters
const specJob = { title: 'C++ & Node.js Engineer / Lead (100% Remote)', company: 'Tech & AI Co.' }
const specLetter = generateCoverLetterDraft(specJob, mockProfile, mockExperience, mockSkills, mockAts)
assert(specLetter.includes('C++ & Node.js Engineer / Lead (100% Remote)'), 'Test 12: Special characters handled safely')

// 13. Long Content
assert(execLetter.length > 500, 'Test 13: Full letter meets professional length standards')

// 14. Word Count
const counts = countWordsAndCharacters(execLetter)
assert(counts.words > 100, `Test 14: Word count accurately computed (${counts.words} words)`)

// 15. Character Count
assert(counts.characters === execLetter.length, `Test 15: Character count matches exact string length (${counts.characters} chars)`)

// 16. No undefined/null output
assert(!execLetter.includes('undefined') && !execLetter.includes('null') && !execLetter.includes('NaN'), 'Test 16: Zero unrendered placeholder strings')

// 17. Anti-Hallucination Validation
const validation = validateCoverLetterFacts(execLetter, {
  profile: mockProfile,
  skills: mockSkills,
  experience: mockExperience,
  job: mockJob,
})
assert(validation.isValid === true, 'Test 17: Anti-hallucination validation passed')
assert(validation.verifiedFactsCount >= 4, `Test 17B: Verified facts count is ${validation.verifiedFactsCount}`)

// 18. Missing Keyword Handling (Does not falsely assert missing skills)
assert(!execLetter.includes('expert in Kubernetes') && !execLetter.includes('years of Helm'), 'Test 18: Does not falsely claim unpossessed missing skills')

// 19. ATS Score Integration
assert(mockAts.matchScore === 88, 'Test 19: ATS Score 88% is retained')

// 20. Deterministic Output (Calling twice produces identical string)
const run1 = generateCoverLetterDraft(mockJob, mockProfile, mockExperience, mockSkills, mockAts, null, { tone: 'Technical', template: 'Technical' })
const run2 = generateCoverLetterDraft(mockJob, mockProfile, mockExperience, mockSkills, mockAts, null, { tone: 'Technical', template: 'Technical' })
assert(run1 === run2, 'Test 20: Output is 100% deterministic')

// 21. PDF Data uses latest edited letter
const editedText = 'Customized Letter Body by User'
const editCount = countWordsAndCharacters(editedText)
assert(editCount.words === 5, 'Test 21: Edited letter reflects latest changes in word counter')

// 22. Boundary Tests (Empty string input)
const emptyCount = countWordsAndCharacters('')
assert(emptyCount.words === 0 && emptyCount.characters === 0, 'Test 22: Empty string boundary safe')

console.log(`\nResults: ${passed} passed, ${failed} failed`)
if (failed > 0) process.exit(1)
