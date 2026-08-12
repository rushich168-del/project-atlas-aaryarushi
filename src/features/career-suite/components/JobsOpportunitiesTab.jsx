import { useState, useMemo } from 'react'
import {
  Search,
  Plus,
  Trash2,
  ExternalLink,
  Briefcase,
  Clock,
  CheckCircle2,
  Loader2,
  RefreshCw,
  AlertCircle,
  FileText,
  Building,
  MapPin,
  Tag,
  DollarSign,
  ChevronRight,
  Filter,
  RotateCw,
  Target,
  Sparkles,
  TrendingUp,
} from 'lucide-react'
import { useJobs } from '../hooks/useJobs.js'
import { useResumes } from '../hooks/useResumes.js'
import { useCareerProfile } from '../hooks/useCareerProfile.js'
import { useJobMatch } from '../hooks/useJobMatch.js'
import { useApplicationAnalytics } from '../hooks/useApplicationAnalytics.js'
import { JobMatchAnalyzer } from './JobMatchAnalyzer.jsx'
import { ApplicationAssistantModal } from './ApplicationAssistantModal.jsx'
import { ApplicationIntelligenceView } from './ApplicationIntelligenceView.jsx'

const statusStages = [
  { id: 'saved', label: 'Saved', color: 'border-slate-300 bg-slate-50 text-slate-700' },
  { id: 'applied', label: 'Applied', color: 'border-blue-300 bg-blue-50 text-blue-700' },
  { id: 'screening', label: 'Screening', color: 'border-purple-300 bg-purple-50 text-purple-700' },
  { id: 'interview', label: 'Interview', color: 'border-amber-300 bg-amber-50 text-amber-700' },
  { id: 'offer', label: 'Offer', color: 'border-emerald-300 bg-emerald-50 text-emerald-700' },
  { id: 'rejected', label: 'Rejected', color: 'border-red-300 bg-red-50 text-red-700' },
]

export function JobsOpportunitiesTab() {
  const {
    jobs,
    applications,
    loading,
    isSyncing,
    error,
    metrics,
    syncStatusSummary,
    loadAll,
    retrySync,
    createJob,
    deleteJob,
    createApplication,
    updateApplicationStatus,
    deleteApplication,
  } = useJobs()

  const { resumes } = useResumes()
  const { profile } = useCareerProfile()
  const { analyzeJob, analysis } = useJobMatch()
  const { analytics } = useApplicationAnalytics()
  const [analyzingModalJob, setAnalyzingModalJob] = useState(null)
  const [assistantJob, setAssistantJob] = useState(null)
  const [assistantApp, setAssistantApp] = useState(null)

  const [activeView, setActiveView] = useState('jobs') // 'jobs' | 'tracker' | 'analytics'
  const [statusFilter, setStatusFilter] = useState('all')

  // Add Job Form State
  const [isAddJobOpen, setIsAddJobOpen] = useState(false)
  const [jobTitle, setJobTitle] = useState('')
  const [jobCompany, setJobCompany] = useState('')
  const [jobLocation, setJobLocation] = useState('')
  const [jobWorkType, setJobWorkType] = useState('Full-time')
  const [jobEmpType, setJobEmpType] = useState('Remote')
  const [jobSalary, setJobSalary] = useState('')
  const [jobSourceUrl, setJobSourceUrl] = useState('')
  const [jobDeadline, setJobDeadline] = useState('')
  const [jobSkills, setJobSkills] = useState('')
  const [jobDescription, setJobDescription] = useState('')

  // Apply / Track Modal State
  const [trackingJob, setTrackingJob] = useState(null)
  const [selectedResumeId, setSelectedResumeId] = useState('')
  const [appStatus, setAppStatus] = useState('applied')
  const [appNotes, setAppNotes] = useState('')

  async function handleAddJobSubmit(e) {
    e.preventDefault()
    if (!jobTitle.trim() || !jobCompany.trim()) return

    const skillsArray = jobSkills
      .split(',')
      .map((s) => s.trim())
      .filter(Boolean)

    await createJob({
      title: jobTitle.trim(),
      company: jobCompany.trim(),
      location: jobLocation.trim() || 'Remote / Hybrid',
      work_type: jobWorkType,
      employment_type: jobEmpType,
      salary_range: jobSalary.trim(),
      source_url: jobSourceUrl.trim(),
      deadline: jobDeadline.trim(),
      skills: skillsArray,
      description: jobDescription.trim(),
    })

    setIsAddJobOpen(false)
    setJobTitle('')
    setJobCompany('')
    setJobLocation('')
    setJobSalary('')
    setJobSourceUrl('')
    setJobDeadline('')
    setJobSkills('')
    setJobDescription('')
  }

  async function handleTrackSubmit(e) {
    e.preventDefault()
    if (!trackingJob) return

    await createApplication({
      job_id: trackingJob.id,
      resume_id: selectedResumeId || null,
      status: appStatus,
      applied_at: new Date().toISOString(),
      notes: appNotes.trim(),
    })

    setTrackingJob(null)
    setSelectedResumeId('')
    setAppNotes('')
    setActiveView('tracker')
  }

  const filteredApplications = useMemo(() => {
    if (statusFilter === 'all') return applications
    return applications.filter((app) => app.status === statusFilter)
  }, [applications, statusFilter])

  if (loading && !jobs.length) {
    return (
      <div className="flex min-h-[300px] items-center justify-center rounded-xl border border-slate-200 bg-white p-8">
        <div className="flex items-center gap-3 text-slate-600">
          <Loader2 size={24} className="animate-spin text-teal-600" />
          <span className="text-sm font-semibold">Loading Jobs & Opportunities...</span>
        </div>
      </div>
    )
  }

  if (error && !jobs.length) {
    return (
      <div className="rounded-xl border border-red-200 bg-red-50 p-6 text-red-700">
        <div className="flex items-center gap-3">
          <AlertCircle size={20} />
          <p className="text-sm font-semibold">{error}</p>
        </div>
        <button
          type="button"
          onClick={loadAll}
          className="mt-4 inline-flex items-center gap-2 rounded-lg bg-red-600 px-3.5 py-2 text-xs font-semibold text-white transition hover:bg-red-700"
        >
          <RefreshCw size={14} />
          Retry Loading
        </button>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Sync Status Banner */}
      {(syncStatusSummary.hasPending || syncStatusSummary.hasErrors) && (
        <div className={`flex items-center justify-between rounded-lg border px-4 py-3 text-xs font-semibold ${
          syncStatusSummary.hasErrors
            ? 'border-red-200 bg-red-50 text-red-800'
            : 'border-amber-200 bg-amber-50 text-amber-800'
        }`}>
          <div className="flex items-center gap-2">
            <AlertCircle size={16} />
            <span>
              {syncStatusSummary.hasErrors
                ? `${syncStatusSummary.errorCount} item(s) encountered sync errors.`
                : `${syncStatusSummary.pendingCount} offline job/application record(s) queued for sync.`}
            </span>
          </div>
          <button
            type="button"
            onClick={retrySync}
            disabled={isSyncing}
            className="inline-flex items-center gap-1.5 rounded bg-amber-200 px-2.5 py-1 text-[11px] font-bold text-amber-900 hover:bg-amber-300 disabled:opacity-50"
          >
            <RotateCw size={12} className={isSyncing ? 'animate-spin' : ''} />
            {isSyncing ? 'Syncing...' : 'Sync to Cloud'}
          </button>
        </div>
      )}

      {/* 1. Top Metrics Overview */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold uppercase tracking-wider text-slate-500">Tracked Jobs</span>
            <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-teal-50 text-teal-700">
              <Briefcase size={16} />
            </span>
          </div>
          <p className="mt-2 text-2xl font-extrabold text-slate-900">{metrics.savedCount}</p>
          <p className="mt-1 text-[11px] text-slate-500">Active opportunity records</p>
        </div>

        <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold uppercase tracking-wider text-slate-500">Applied</span>
            <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-blue-50 text-blue-700">
              <Clock size={16} />
            </span>
          </div>
          <p className="mt-2 text-2xl font-extrabold text-blue-700">{metrics.appliedCount}</p>
          <p className="mt-1 text-[11px] text-slate-500">Under review / Screening</p>
        </div>

        <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold uppercase tracking-wider text-slate-500">Interviews</span>
            <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-amber-50 text-amber-700">
              <CheckCircle2 size={16} />
            </span>
          </div>
          <p className="mt-2 text-2xl font-extrabold text-amber-700">{metrics.interviewCount}</p>
          <p className="mt-1 text-[11px] text-slate-500">Active interview rounds</p>
        </div>

        <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold uppercase tracking-wider text-slate-500">Offers</span>
            <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-emerald-50 text-emerald-700">
              <DollarSign size={16} />
            </span>
          </div>
          <p className="mt-2 text-2xl font-extrabold text-emerald-700">{metrics.offerCount}</p>
          <p className="mt-1 text-[11px] text-slate-500">Secured offers</p>
        </div>
      </div>

      {/* 2. Controls & View Selector */}
      <div className="flex flex-col gap-4 rounded-xl border border-slate-200 bg-white p-5 shadow-sm sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => setActiveView('jobs')}
            className={`focus-ring inline-flex items-center gap-2 rounded-lg px-4 py-2 text-xs font-semibold transition ${
              activeView === 'jobs'
                ? 'bg-teal-600 text-white shadow-sm'
                : 'border border-slate-200 bg-slate-50 text-slate-700 hover:bg-slate-100'
            }`}
          >
            <Briefcase size={14} />
            Opportunity Records ({jobs.length})
          </button>
          <button
            type="button"
            onClick={() => setActiveView('tracker')}
            className={`focus-ring inline-flex items-center gap-2 rounded-lg px-4 py-2 text-xs font-semibold transition ${
              activeView === 'tracker'
                ? 'bg-teal-600 text-white shadow-sm'
                : 'border border-slate-200 bg-slate-50 text-slate-700 hover:bg-slate-100'
            }`}
          >
            <Clock size={14} />
            Application Tracker ({applications.length})
          </button>
          <button
            type="button"
            onClick={() => setActiveView('analytics')}
            className={`focus-ring inline-flex items-center gap-2 rounded-lg px-4 py-2 text-xs font-semibold transition ${
              activeView === 'analytics'
                ? 'bg-teal-600 text-white shadow-sm'
                : 'border border-slate-200 bg-slate-50 text-slate-700 hover:bg-slate-100'
            }`}
          >
            <TrendingUp size={14} />
            Application Intelligence
          </button>
        </div>

        <div className="flex items-center gap-2">
          {activeView === 'tracker' && (
            <div className="flex items-center gap-1.5 rounded-lg border border-slate-200 bg-slate-50 px-2.5 py-1.5 text-xs text-slate-700">
              <Filter size={12} className="text-slate-400" />
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="bg-transparent text-xs font-semibold outline-none"
              >
                <option value="all">All Stages</option>
                <option value="saved">Saved</option>
                <option value="applied">Applied</option>
                <option value="screening">Screening</option>
                <option value="interview">Interview</option>
                <option value="offer">Offer</option>
                <option value="rejected">Rejected</option>
                <option value="withdrawn">Withdrawn</option>
              </select>
            </div>
          )}

          <button
            type="button"
            onClick={() => setIsAddJobOpen(true)}
            className="focus-ring inline-flex items-center gap-1.5 rounded-lg bg-teal-600 px-4 py-2 text-xs font-semibold text-white shadow-sm transition hover:bg-teal-700"
          >
            <Plus size={14} />
            Add Job Opportunity
          </button>
        </div>
      </div>

      {/* 3. Add Job Modal / Drawer */}
      {isAddJobOpen && (
        <form onSubmit={handleAddJobSubmit} className="rounded-xl border border-teal-200 bg-teal-50/40 p-6 shadow-sm">
          <div className="flex items-center justify-between border-b border-teal-200/60 pb-3">
            <div>
              <h4 className="text-sm font-bold text-teal-950">Add Job / Opportunity Entry</h4>
              <p className="text-xs text-slate-600">Save a discovered role manually into your integrated Career Suite.</p>
            </div>
          </div>

          <div className="mt-4 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            <div>
              <label className="block text-xs font-semibold text-slate-700">Job Title *</label>
              <input
                type="text"
                required
                placeholder="e.g. Senior Full Stack Engineer"
                value={jobTitle}
                onChange={(e) => setJobTitle(e.target.value)}
                className="mt-1 w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-xs outline-none focus:border-teal-500"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700">Company Name *</label>
              <input
                type="text"
                required
                placeholder="e.g. Acme Corp"
                value={jobCompany}
                onChange={(e) => setJobCompany(e.target.value)}
                className="mt-1 w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-xs outline-none focus:border-teal-500"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700">Location</label>
              <input
                type="text"
                placeholder="e.g. Bengaluru / Remote"
                value={jobLocation}
                onChange={(e) => setJobLocation(e.target.value)}
                className="mt-1 w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-xs outline-none focus:border-teal-500"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700">Work Type</label>
              <select
                value={jobWorkType}
                onChange={(e) => setJobWorkType(e.target.value)}
                className="mt-1 w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-xs outline-none focus:border-teal-500"
              >
                <option value="Full-time">Full-time</option>
                <option value="Part-time">Part-time</option>
                <option value="Internship">Internship</option>
                <option value="Contract">Contract</option>
                <option value="Freelance">Freelance</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700">Employment Setting</label>
              <select
                value={jobEmpType}
                onChange={(e) => setJobEmpType(e.target.value)}
                className="mt-1 w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-xs outline-none focus:border-teal-500"
              >
                <option value="Remote">Remote</option>
                <option value="Hybrid">Hybrid</option>
                <option value="On-site">On-site</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700">Salary / Compensation</label>
              <input
                type="text"
                placeholder="e.g. ₹24L - ₹30L / yr"
                value={jobSalary}
                onChange={(e) => setJobSalary(e.target.value)}
                className="mt-1 w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-xs outline-none focus:border-teal-500"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700">Source URL / Link</label>
              <input
                type="url"
                placeholder="https://..."
                value={jobSourceUrl}
                onChange={(e) => setJobSourceUrl(e.target.value)}
                className="mt-1 w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-xs outline-none focus:border-teal-500"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700">Application Deadline</label>
              <input
                type="date"
                value={jobDeadline}
                onChange={(e) => setJobDeadline(e.target.value)}
                className="mt-1 w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-xs outline-none focus:border-teal-500"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700">Key Skills (Comma-separated)</label>
              <input
                type="text"
                placeholder="React, PostgreSQL, Node.js"
                value={jobSkills}
                onChange={(e) => setJobSkills(e.target.value)}
                className="mt-1 w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-xs outline-none focus:border-teal-500"
              />
            </div>

            <div className="sm:col-span-2 lg:col-span-3">
              <label className="block text-xs font-semibold text-slate-700">Job Description & Notes</label>
              <textarea
                rows={3}
                placeholder="Paste key responsibilities, role notes, or qualifications..."
                value={jobDescription}
                onChange={(e) => setJobDescription(e.target.value)}
                className="mt-1 w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-xs outline-none focus:border-teal-500"
              />
            </div>
          </div>

          <div className="mt-5 flex items-center justify-end gap-2">
            <button
              type="button"
              onClick={() => setIsAddJobOpen(false)}
              className="rounded-lg px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-200"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="rounded-lg bg-teal-600 px-4 py-2 text-xs font-semibold text-white shadow hover:bg-teal-700"
            >
              Save Job Opportunity
            </button>
          </div>
        </form>
      )}

      {/* 4. Track Application Modal */}
      {trackingJob && (
        <form onSubmit={handleTrackSubmit} className="rounded-xl border border-teal-300 bg-white p-6 shadow-lg">
          <div className="border-b border-slate-100 pb-3">
            <h4 className="text-sm font-bold text-slate-900">Track Application for {trackingJob.title}</h4>
            <p className="text-xs text-slate-500">{trackingJob.company} • {trackingJob.location}</p>
          </div>

          <div className="mt-4 grid gap-4 sm:grid-cols-2">
            <div>
              <label className="block text-xs font-semibold text-slate-700">Initial Application Stage</label>
              <select
                value={appStatus}
                onChange={(e) => setAppStatus(e.target.value)}
                className="mt-1 w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-xs outline-none focus:border-teal-500"
              >
                <option value="applied">Applied (Submitted)</option>
                <option value="saved">Saved (Planning)</option>
                <option value="screening">Screening</option>
                <option value="interview">Interviewing</option>
                <option value="offer">Offer Received</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700">Resume Version Used</label>
              <select
                value={selectedResumeId}
                onChange={(e) => setSelectedResumeId(e.target.value)}
                className="mt-1 w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-xs outline-none focus:border-teal-500"
              >
                <option value="">Default Profile / No specific resume</option>
                {resumes.map((res) => (
                  <option key={res.id} value={res.id}>
                    {res.title} ({res.template_id})
                  </option>
                ))}
              </select>
            </div>

            <div className="sm:col-span-2">
              <label className="block text-xs font-semibold text-slate-700">Application Notes / Contact Info</label>
              <textarea
                rows={2}
                placeholder="e.g. Applied via referral, recruiter contact, interview date..."
                value={appNotes}
                onChange={(e) => setAppNotes(e.target.value)}
                className="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2 text-xs outline-none focus:border-teal-500"
              />
            </div>
          </div>

          <div className="mt-5 flex items-center justify-end gap-2">
            <button
              type="button"
              onClick={() => setTrackingJob(null)}
              className="rounded-lg px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="rounded-lg bg-teal-600 px-4 py-2 text-xs font-semibold text-white shadow hover:bg-teal-700"
            >
              Confirm & Add to Tracker
            </button>
          </div>
        </form>
      )}

      {/* 5. VIEW A: Job Opportunities Grid */}
      {activeView === 'jobs' && (
        <div>
          {jobs.length === 0 ? (
            <div className="rounded-xl border border-slate-200 bg-white p-12 text-center shadow-sm">
              <Briefcase size={32} className="mx-auto text-slate-400" />
              <h4 className="mt-3 text-base font-bold text-slate-900">No Job Opportunities Saved Yet</h4>
              <p className="mt-1 text-xs text-slate-500">
                Click "Add Job Opportunity" to track a role, match with your Career Profile, and manage applications.
              </p>
            </div>
          ) : (
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {jobs.map((job) => {
                const isAlreadyTracked = applications.some((a) => a.job_id === job.id)
                return (
                  <div
                    key={job.id}
                    className="flex flex-col justify-between rounded-xl border border-slate-200 bg-white p-5 shadow-sm transition hover:border-teal-500/50 hover:shadow-md"
                  >
                    <div>
                      <div className="flex items-start justify-between">
                        <div>
                          <div className="flex items-center gap-1.5">
                            <span className="inline-block rounded border border-teal-200 bg-teal-50 px-2 py-0.5 text-[10px] font-bold text-teal-700 uppercase">
                              {job.work_type} • {job.employment_type}
                            </span>
                            <span className={`rounded border px-1.5 py-0.5 text-[9px] font-bold uppercase ${
                              job.syncStatus === 'cloud_saved'
                                ? 'border-emerald-200 bg-emerald-50 text-emerald-700'
                                : job.syncStatus === 'pending_sync'
                                ? 'border-amber-400 bg-amber-100 text-amber-900'
                                : job.syncStatus === 'sync_error'
                                ? 'border-red-300 bg-red-50 text-red-700'
                                : 'border-slate-200 bg-slate-100 text-slate-700'
                            }`}>
                              {job.syncStatus === 'cloud_saved'
                                ? 'CLOUD SAVED'
                                : job.syncStatus === 'pending_sync'
                                ? 'PENDING SYNC'
                                : job.syncStatus === 'sync_error'
                                ? 'SYNC ERROR'
                                : 'LOCAL OFFLINE'}
                            </span>
                          </div>

                          <h4 className="mt-2 text-base font-bold text-slate-900">{job.title}</h4>
                          <div className="mt-1 flex items-center gap-1.5 text-xs font-semibold text-slate-700">
                            <Building size={13} className="text-slate-400" />
                            <span>{job.company}</span>
                          </div>
                          <div className="mt-1 flex items-center gap-1.5 text-xs text-slate-500">
                            <MapPin size={13} className="text-slate-400" />
                            <span>{job.location}</span>
                          </div>
                        </div>

                        <button
                          type="button"
                          onClick={() => deleteJob(job.id)}
                          className="rounded p-1 text-slate-400 hover:bg-red-50 hover:text-red-600"
                          title="Delete Job"
                        >
                          <Trash2 size={15} />
                        </button>
                      </div>

                      {job.salary_range && (
                        <p className="mt-3 text-xs font-semibold text-emerald-700">
                          {job.salary_range}
                        </p>
                      )}

                      {job.description && (
                        <p className="mt-2 text-xs leading-5 text-slate-600 line-clamp-3">
                          {job.description}
                        </p>
                      )}

                      {job.skills && job.skills.length > 0 && (
                        <div className="mt-3 flex flex-wrap gap-1">
                          {job.skills.map((skill, idx) => (
                            <span
                              key={idx}
                              className="rounded border border-slate-200 bg-slate-50 px-2 py-0.5 text-[10px] font-medium text-slate-700"
                            >
                              {skill}
                            </span>
                          ))}
                        </div>
                      )}

                      {job.deadline && (
                        <p className="mt-3 text-[11px] font-medium text-amber-700">
                          Deadline: {job.deadline}
                        </p>
                      )}
                    </div>

                    <div className="mt-5 flex items-center gap-2 border-t border-slate-100 pt-3">
                      {job.source_url && (
                        <a
                          href={job.source_url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="rounded-lg border border-slate-200 bg-slate-50 p-2 text-slate-600 transition hover:bg-slate-100"
                          title="Open Original Job Link"
                        >
                          <ExternalLink size={14} />
                        </a>
                      )}

                      <button
                        type="button"
                        onClick={() => {
                          analyzeJob(job)
                          setAnalyzingModalJob(job)
                        }}
                        className="focus-ring inline-flex items-center justify-center gap-1.5 rounded-lg border border-teal-200 bg-teal-50 px-2.5 py-2 text-xs font-bold text-teal-800 transition hover:bg-teal-100"
                        title="Analyze deterministic ATS Match Score"
                      >
                        <Target size={14} className="text-teal-600" />
                        <span>ATS Match</span>
                      </button>

                      <button
                        type="button"
                        onClick={() => {
                          setAssistantJob(job)
                          const linkedApp = applications.find((a) => a.job_id === job.id)
                          setAssistantApp(linkedApp || null)
                        }}
                        className="focus-ring inline-flex items-center justify-center gap-1.5 rounded-lg border border-teal-200 bg-teal-50 px-2.5 py-2 text-xs font-bold text-teal-800 transition hover:bg-teal-100"
                        title="Open Application Assistant (Tailored Bullets & Cover Letter)"
                      >
                        <Sparkles size={14} className="text-teal-600" />
                        <span>Assistant</span>
                      </button>

                      {isAlreadyTracked ? (
                        <button
                          type="button"
                          onClick={() => setActiveView('tracker')}
                          className="focus-ring flex-1 inline-flex items-center justify-center gap-1.5 rounded-lg border border-emerald-300 bg-emerald-50 py-2 text-xs font-semibold text-emerald-800 transition hover:bg-emerald-100"
                        >
                          <CheckCircle2 size={14} />
                          Tracking in Pipeline
                        </button>
                      ) : (
                        <button
                          type="button"
                          onClick={() => setTrackingJob(job)}
                          className="focus-ring flex-1 inline-flex items-center justify-center gap-1.5 rounded-lg bg-teal-600 py-2 text-xs font-semibold text-white transition hover:bg-teal-700"
                        >
                          <Plus size={14} />
                          Track Application
                        </button>
                      )}
                    </div>
                  </div>
                )
              })}
            </div>
          )}
        </div>
      )}

      {/* 6. VIEW B: Application Tracker (Pipeline View) */}
      {activeView === 'tracker' && (
        <div className="space-y-4">
          {filteredApplications.length === 0 ? (
            <div className="rounded-xl border border-slate-200 bg-white p-12 text-center shadow-sm">
              <Clock size={32} className="mx-auto text-slate-400" />
              <h4 className="mt-3 text-base font-bold text-slate-900">No Applications in this Stage</h4>
              <p className="mt-1 text-xs text-slate-500">
                Track a job opportunity to start managing your active interview and offer pipeline.
              </p>
            </div>
          ) : (
            <div className="space-y-3">
              {filteredApplications.map((app) => {
                const job = jobs.find((j) => j.id === app.job_id) || {
                  title: 'Linked Job Record',
                  company: 'Company',
                  location: 'Remote',
                }
                const resume = resumes.find((r) => r.id === app.resume_id)
                const currentStage = statusStages.find((s) => s.id === app.status) || statusStages[1]

                return (
                  <div
                    key={app.id}
                    className="flex flex-col justify-between gap-4 rounded-xl border border-slate-200 bg-white p-5 shadow-sm transition hover:shadow-md md:flex-row md:items-center"
                  >
                    <div className="max-w-xl">
                      <div className="flex items-center gap-2">
                        <span className={`rounded border px-2 py-0.5 text-[11px] font-bold uppercase ${currentStage.color}`}>
                          {currentStage.label}
                        </span>
                        <span className={`rounded border px-1.5 py-0.5 text-[9px] font-bold uppercase ${
                          app.syncStatus === 'cloud_saved'
                            ? 'border-emerald-200 bg-emerald-50 text-emerald-700'
                            : app.syncStatus === 'pending_sync'
                            ? 'border-amber-400 bg-amber-100 text-amber-900'
                            : app.syncStatus === 'sync_error'
                            ? 'border-red-300 bg-red-50 text-red-700'
                            : 'border-slate-200 bg-slate-100 text-slate-700'
                        }`}>
                          {app.syncStatus === 'cloud_saved'
                            ? 'CLOUD SAVED'
                            : app.syncStatus === 'pending_sync'
                            ? 'PENDING SYNC'
                            : app.syncStatus === 'sync_error'
                            ? 'SYNC ERROR'
                            : 'LOCAL OFFLINE'}
                        </span>
                        {app.applied_at && (
                          <span className="text-[11px] text-slate-400">
                            Applied {new Date(app.applied_at).toLocaleDateString()}
                          </span>
                        )}
                      </div>

                      <h4 className="mt-2 text-base font-bold text-slate-900">{job.title}</h4>
                      <p className="text-xs font-semibold text-teal-800">{job.company} • {job.location}</p>

                      {app.notes && (
                        <p className="mt-2 rounded bg-slate-50 p-2 text-xs leading-5 text-slate-600">
                          {app.notes}
                        </p>
                      )}

                      {resume && (
                        <div className="mt-2 inline-flex items-center gap-1.5 rounded-full border border-teal-200 bg-teal-50/70 px-2.5 py-0.5 text-[11px] font-semibold text-teal-700">
                          <FileText size={12} />
                          Resume: {resume.title}
                        </div>
                      )}
                    </div>

                    <div className="flex flex-wrap items-center gap-2">
                      <button
                        type="button"
                        onClick={() => {
                          setAssistantJob(job)
                          setAssistantApp(app)
                        }}
                        className="focus-ring inline-flex items-center gap-1 rounded-lg border border-teal-200 bg-teal-50 px-2.5 py-1.5 text-xs font-bold text-teal-800 transition hover:bg-teal-100"
                        title="Open Application Assistant"
                      >
                        <Sparkles size={13} className="text-teal-600" />
                        <span>Assistant</span>
                      </button>

                      <div className="flex items-center gap-1 rounded-lg border border-slate-200 bg-slate-50 px-2 py-1 text-xs">
                        <span className="text-[11px] font-semibold text-slate-500">Stage:</span>
                        <select
                          value={app.status}
                          onChange={(e) => updateApplicationStatus(app.id, e.target.value)}
                          className="bg-transparent text-xs font-bold text-slate-800 outline-none"
                        >
                          <option value="saved">Saved</option>
                          <option value="applied">Applied</option>
                          <option value="screening">Screening</option>
                          <option value="interview">Interview</option>
                          <option value="offer">Offer</option>
                          <option value="rejected">Rejected</option>
                          <option value="withdrawn">Withdrawn</option>
                        </select>
                      </div>

                      <button
                        type="button"
                        onClick={() => deleteApplication(app.id)}
                        className="rounded-lg p-2 text-slate-400 hover:bg-red-50 hover:text-red-600"
                        title="Remove Application"
                      >
                        <Trash2 size={16} />
                      </button>
                    </div>
                  </div>
                )
              })}
            </div>
          )}
        </div>
      )}

      {/* 6. View C: Application Intelligence & Analytics */}
      {activeView === 'analytics' && (
        <ApplicationIntelligenceView
          analytics={analytics}
          onNavigateToTrack={() => setActiveView('jobs')}
        />
      )}

      {/* 7. ATS Match Modal Analyzer */}
      {analyzingModalJob && analysis && (
        <JobMatchAnalyzer
          job={analyzingModalJob}
          analysis={analysis}
          onClose={() => setAnalyzingModalJob(null)}
          onAttachResume={(resumeId) => {
            setTrackingJob(analyzingModalJob)
            setSelectedResumeId(resumeId)
            setAnalyzingModalJob(null)
          }}
        />
      )}

      {/* 7. Application Assistant Modal */}
      {assistantJob && (
        <ApplicationAssistantModal
          job={assistantJob}
          application={assistantApp}
          onClose={() => {
            setAssistantJob(null)
            setAssistantApp(null)
          }}
          onAttachResume={(resumeId) => {
            setTrackingJob(assistantJob)
            setSelectedResumeId(resumeId)
            setAssistantJob(null)
            setAssistantApp(null)
          }}
        />
      )}
    </div>
  )
}
