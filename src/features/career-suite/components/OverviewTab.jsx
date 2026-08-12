import {
  UserCheck,
  FileText,
  Search,
  BrainCircuit,
  Award,
  CheckCircle2,
  ChevronRight,
} from 'lucide-react'

export function OverviewTab({ onNavigate }) {
  const modules = [
    {
      id: 'profile',
      title: '1. Career Profile',
      icon: UserCheck,
      description: 'Education, Skills, Experience, Projects, Achievements, Certifications, Target Roles, and AI Career Summary.',
      capabilities: ['Basic Identity & Summary', 'Education & Academic History', 'Experience & Work Records', 'Skills Matrix & Categories'],
      status: 'Live & Connected',
    },
    {
      id: 'resume',
      title: '2. Resume & Applications',
      icon: FileText,
      description: 'Resume Builder, Multi-version manager, ATS Checker, Improvement suggestions, and Cover Letter Builder.',
      capabilities: ['Multi-version Resumes', 'Profile Reuse Engine', 'Target Role Customization', 'ATS Scanner Blueprint'],
      status: 'Live & Connected',
    },
    {
      id: 'jobs',
      title: '3. Jobs & Opportunities',
      icon: Search,
      description: 'Job & Internship search, Intelligent recommendations, Matching score, Application Tracker, and Deadlines.',
      capabilities: ['Deterministic ATS Match Engine', 'Opportunity Records', 'Application Tracker Pipeline', 'Stage Progression Engine'],
      status: 'Live & Connected',
    },
    {
      id: 'skills',
      title: '4. Skills & Interview',
      icon: BrainCircuit,
      description: 'Skill Gap Analysis, Personalized learning roadmaps, AI Mock Interviews (Technical & HR), and Evaluation.',
      capabilities: ['Skill Gap Analysis Matrix', 'Target Role Taxonomy', 'Dynamic Learning Roadmap', 'Interview Question Practice'],
      status: 'Live & Connected',
    },
    {
      id: 'portfolio',
      title: '5. Career Portfolio',
      icon: Award,
      description: 'Portfolio builder, Projects showcase, Professional bio, LinkedIn optimization, and Shareable Profile link.',
      capabilities: ['Portfolio Projects Showcase', 'Professional Bio Generator', 'LinkedIn Optimizer Blueprint', 'Public Shareable Link'],
      status: 'Live & Connected',
    },
  ]

  return (
    <div className="grid gap-6">
      <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
        <div className="flex items-start justify-between">
          <div>
            <h3 className="text-xl font-bold text-slate-900">Career Suite Workspace Overview</h3>
            <p className="mt-1 text-sm text-slate-600">
              Career Suite combines profile management, resume building, job discovery, skill preparation, and portfolio hosting into a single integrated platform.
            </p>
          </div>
          <span className="inline-flex items-center gap-1.5 rounded-full bg-teal-50 px-3 py-1 text-xs font-semibold text-teal-700 border border-teal-200">
            <CheckCircle2 size={14} />
            Phase 6 Ready
          </span>
        </div>

        <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {modules.map((mod) => {
            const Icon = mod.icon
            return (
              <div
                key={mod.id}
                className="group flex flex-col justify-between rounded-xl border border-slate-200 bg-slate-50/50 p-5 transition hover:border-teal-500/50 hover:bg-white hover:shadow-md"
              >
                <div>
                  <div className="flex items-center justify-between">
                    <span className="flex h-10 w-10 items-center justify-center rounded-lg bg-teal-500/10 text-teal-600">
                      <Icon size={20} />
                    </span>
                    <span className={`rounded border px-2 py-0.5 text-[11px] font-semibold ${
                      mod.status === 'Live & Connected'
                        ? 'border-teal-200 bg-teal-50 text-teal-700'
                        : 'border-slate-200 bg-white text-slate-600'
                    }`}>
                      {mod.status}
                    </span>
                  </div>
                  <h4 className="mt-4 text-base font-bold text-slate-900">{mod.title}</h4>
                  <p className="mt-1 text-xs leading-5 text-slate-600">{mod.description}</p>
                  <ul className="mt-4 space-y-1.5 border-t border-slate-200/60 pt-3">
                    {mod.capabilities.map((cap) => (
                      <li key={cap} className="flex items-center gap-2 text-xs text-slate-600">
                        <span className="h-1.5 w-1.5 rounded-full bg-teal-500" />
                        {cap}
                      </li>
                    ))}
                  </ul>
                </div>
                <button
                  type="button"
                  onClick={() => onNavigate(mod.id)}
                  className="focus-ring mt-5 inline-flex items-center justify-between rounded-lg border border-slate-200 bg-white px-3.5 py-2 text-xs font-semibold text-slate-700 transition group-hover:border-teal-500 group-hover:text-teal-700"
                >
                  Explore Module
                  <ChevronRight size={14} />
                </button>
              </div>
            )
          })}
        </div>
      </div>
    </div>
  )
}
