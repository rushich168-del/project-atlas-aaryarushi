import { calculateJobMatch, extractKeywords, DEFAULT_ATS_WEIGHTS } from '../src/services/jobMatchService.js'

console.log('--- Testing ATS Match Engine ---')

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

// Test 1: Keyword extraction
const sampleText = 'Looking for a Senior React Developer with PostgreSQL, Node.js, and Docker experience.'
const keywords = extractKeywords(sampleText)
assert(keywords.includes('react') && keywords.includes('postgresql') && keywords.includes('docker'), 'Keyword extraction includes core technologies')

// Test 2: Perfect Match
const fullSkills = [
  { name: 'React', proficiency: 'Expert' },
  { name: 'Node.js', proficiency: 'Advanced' },
  { name: 'PostgreSQL', proficiency: 'Advanced' },
  { name: 'System Architecture', proficiency: 'Expert' },
]
const fullExp = [
  { title: 'Senior Software Engineer', achievements: 'Scaled React and PostgreSQL systems' },
  { title: 'Fullstack Lead Architect', achievements: 'Led Node.js microservices team' },
  { title: 'Software Developer', achievements: 'Built high throughput REST APIs' },
]
const fullEdu = [{ degree: 'B.Tech in Computer Science', institution: 'Tech University' }]
const fullResumes = [
  { id: 'res-1', title: 'Senior Software Engineer', target_role: 'Senior React Developer', skills: ['React', 'Node.js', 'PostgreSQL', 'System Architecture'], sections: [1, 2, 3, 4] },
  { id: 'res-2', title: 'Frontend Developer', target_role: 'Frontend Engineer', skills: ['React', 'CSS'], sections: [1, 2] },
]
const job1 = {
  id: 'job-1',
  title: 'Senior React Developer',
  company: 'TechCorp',
  description: 'Looking for a Senior React Developer with PostgreSQL and Node.js skills.',
  skills: ['React', 'Node.js', 'PostgreSQL', 'System Architecture'],
}

const match1 = calculateJobMatch(job1, { headline: 'Senior React Developer', summary: 'Expert in PostgreSQL and Node.js' }, fullSkills, fullExp, fullEdu, fullResumes)
assert(match1.matchScore >= 90 && match1.matchScore <= 100, `Perfect match score is high (Score: ${match1.matchScore})`)
assert(match1.recommendedResume?.id === 'res-1', 'Correctly recommended res-1 as top matching resume')
assert(match1.matchedSkills.length === 4, 'All 4 skills classified as matched')

// Test 3: Missing Critical Skills
const lowSkills = [{ name: 'CSS', proficiency: 'Beginner' }]
const match2 = calculateJobMatch(job1, {}, lowSkills, [], [], [])
assert(match2.matchScore >= 0 && match2.matchScore <= 60, `Low skill score reflects missing requirements (Score: ${match2.matchScore})`)
assert(match2.missingSkills.length === 4, 'Correctly identified 4 missing skills')

// Test 4: Developing Skills Classification
const devSkills = [{ name: 'React', proficiency: 'Beginner' }, { name: 'Node.js', proficiency: 'Intermediate' }]
const match3 = calculateJobMatch(job1, {}, devSkills, fullExp, fullEdu, fullResumes)
assert(match3.developingSkills.length === 2, 'Correctly identified 2 developing skills')

// Test 5: Empty / Malformed Job
const matchEmpty = calculateJobMatch({}, {}, [], [], [], [])
assert(!isNaN(matchEmpty.matchScore), 'Empty job returns valid non-NaN score')
assert(matchEmpty.matchScore >= 0 && matchEmpty.matchScore <= 100, `Score is safely bounded (Score: ${matchEmpty.matchScore})`)

// Test 6: Bounded check across 50 iterations
for (let i = 0; i < 50; i++) {
  const randScore = calculateJobMatch(
    { title: 'Role ' + i, skills: ['SkillA', 'SkillB'] },
    { headline: 'Candidate ' + i },
    i % 2 === 0 ? [{ name: 'SkillA', proficiency: 'Expert' }] : [],
    [],
    [],
    []
  )
  if (randScore.matchScore < 0 || randScore.matchScore > 100 || isNaN(randScore.matchScore)) {
    assert(false, `Score out of bounds: ${randScore.matchScore}`)
  }
}
assert(true, '50 boundary randomized tests passed 0-100 check')

console.log(`\nResults: ${passed} passed, ${failed} failed`)
if (failed > 0) process.exit(1)
