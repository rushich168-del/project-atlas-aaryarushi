import { useEffect, useState } from 'react'
import {
  FileText,
  Plus,
  Trash2,
  CheckCircle2,
  Loader2,
  Eye,
  ArrowLeft,
  RotateCw,
  AlertCircle,
} from 'lucide-react'
import { useAuth } from '../../../context/AuthContext.jsx'
import { fetchCareerProfile } from '../../../services/careerProfileService.js'
import { useResumes } from '../hooks/useResumes.js'

export function ResumeApplicationsTab() {
  const { user } = useAuth()
  const {
    resumes,
    loading: resumesLoading,
    selectedResumeId,
    activeResume,
    setActiveResume,
    loadResumes,
    openResume,
    createResume,
    updateResume,
    deleteResume,
    closeEditor,
  } = useResumes()

  const [profile, setProfile] = useState(null)
  const [profileLoading, setProfileLoading] = useState(true)

  const [isCreateOpen, setIsCreateOpen] = useState(false)
  const [newTitle, setNewTitle] = useState('')
  const [newTargetRole, setNewTargetRole] = useState('')
  const [newTemplateId, setNewTemplateId] = useState('modern_tech')

  useEffect(() => {
    async function loadProfile() {
      setProfileLoading(true)
      try {
        const data = await fetchCareerProfile(user?.id, user)
        setProfile(data)
      } catch (err) {
        console.warn('Failed to load profile for resume preview:', err)
      } finally {
        setProfileLoading(false)
      }
    }
    loadProfile()
  }, [user?.id])

  async function handleCreate(e) {
    e.preventDefault()
    if (!newTitle.trim()) return

    await createResume({
      title: newTitle.trim(),
      target_role: newTargetRole.trim() || 'Software Engineer',
      template_id: newTemplateId,
    })

    setIsCreateOpen(false)
    setNewTitle('')
    setNewTargetRole('')
  }

  if (resumesLoading && !resumes.length) {
    return (
      <div className="flex min-h-[300px] items-center justify-center rounded-xl border border-slate-200 bg-white p-8">
        <div className="flex items-center gap-3 text-slate-600">
          <Loader2 size={24} className="animate-spin text-teal-600" />
          <span className="text-sm font-semibold">Loading Resumes & Applications...</span>
        </div>
      </div>
    )
  }

  if (selectedResumeId && activeResume) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={closeEditor}
              className="rounded-lg border border-slate-200 bg-slate-50 p-2 text-slate-600 transition hover:bg-slate-100"
            >
              <ArrowLeft size={18} />
            </button>
            <div>
              <h3 className="text-lg font-bold text-slate-900">{activeResume.title}</h3>
              <p className="text-xs text-slate-500">Target Role: <span className="font-semibold text-teal-700">{activeResume.target_role}</span> | Template: <span className="font-semibold text-slate-700">{activeResume.template_id}</span></p>
            </div>
          </div>
          <span className="inline-flex items-center gap-1.5 rounded-full bg-teal-50 px-3 py-1 text-xs font-semibold text-teal-700 border border-teal-200">
            <CheckCircle2 size={14} />
            Reusing Career Profile Data
          </span>
        </div>

        {/* Live Resume Editor Preview — Demonstrating Profile Data Reuse */}
        <div className="grid gap-6 lg:grid-cols-[1fr_320px]">
          <div className="rounded-xl border border-slate-200 bg-white p-8 shadow-md font-sans">
            <div className="border-b border-slate-200 pb-6 text-center">
              <h2 className="text-2xl font-extrabold text-slate-900">{profile?.profile?.full_name || 'Aarya Rushi'}</h2>
              <p className="mt-1 text-sm font-bold text-teal-600">{activeResume.custom_headline || profile?.profile?.headline || 'Senior Full Stack Engineer'}</p>
              <p className="mt-1 text-xs text-slate-500">
                {profile?.profile?.email} | {profile?.profile?.phone} | {profile?.profile?.location}
              </p>
            </div>

            <div className="mt-6">
              <h4 className="text-xs font-bold uppercase tracking-wider text-teal-800">Professional Summary</h4>
              <p className="mt-2 text-xs leading-6 text-slate-700">
                {activeResume.custom_summary || profile?.profile?.summary || 'Experienced software professional with expertise in scalable frontend systems and backend automation engines.'}
              </p>
            </div>

            <div className="mt-6">
              <h4 className="text-xs font-bold uppercase tracking-wider text-teal-800">Work Experience (From Career Profile)</h4>
              <div className="mt-3 space-y-4">
                {profile?.experience?.map((exp) => (
                  <div key={exp.id} className="border-l-2 border-teal-500 pl-3">
                    <div className="flex items-center justify-between text-xs">
                      <span className="font-bold text-slate-900">{exp.job_title} — <span className="text-teal-700">{exp.company}</span></span>
                      <span className="text-[11px] text-slate-500">{exp.start_date} — {exp.currently_working ? 'Present' : exp.end_date}</span>
                    </div>
                    {exp.description && <p className="mt-1 text-xs text-slate-600">{exp.description}</p>}
                    {exp.achievements && <p className="mt-1 text-[11px] font-medium text-slate-800">Key Impact: {exp.achievements}</p>}
                  </div>
                ))}
              </div>
            </div>

            <div className="mt-6">
              <h4 className="text-xs font-bold uppercase tracking-wider text-teal-800">Education (From Career Profile)</h4>
              <div className="mt-3 space-y-3">
                {profile?.education?.map((edu) => (
                  <div key={edu.id} className="flex items-start justify-between text-xs">
                    <div>
                      <p className="font-bold text-slate-900">{edu.institution}</p>
                      <p className="text-[11px] text-slate-600">{edu.degree} in {edu.field_of_study}</p>
                    </div>
                    <span className="text-[11px] text-slate-500">{edu.start_date} — {edu.end_date}</span>
                  </div>
                ))}
              </div>
            </div>

            <div className="mt-6">
              <h4 className="text-xs font-bold uppercase tracking-wider text-teal-800">Skills Matrix (From Career Profile)</h4>
              <div className="mt-3 flex flex-wrap gap-1.5">
                {profile?.skills?.map((sk) => (
                  <span key={sk.id} className="rounded border border-slate-200 bg-slate-50 px-2 py-1 text-[11px] font-medium text-slate-800">
                    {sk.name} <span className="text-teal-600 font-semibold">({sk.proficiency})</span>
                  </span>
                ))}
              </div>
            </div>
          </div>

          <div className="space-y-4">
            <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
              <h4 className="text-sm font-bold text-slate-900">Resume Configuration</h4>
              <p className="mt-1 text-xs text-slate-500">Tailor this version specifically for {activeResume.target_role}.</p>
              
              <div className="mt-4 space-y-3">
                <div>
                  <label className="block text-[11px] font-semibold text-slate-700">Resume Title</label>
                  <input
                    type="text"
                    value={activeResume.title}
                    onChange={(e) => setActiveResume({ ...activeResume, title: e.target.value })}
                    className="mt-1 w-full rounded border border-slate-200 px-2.5 py-1.5 text-xs"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-semibold text-slate-700">Target Role</label>
                  <input
                    type="text"
                    value={activeResume.target_role || ''}
                    onChange={(e) => setActiveResume({ ...activeResume, target_role: e.target.value })}
                    className="mt-1 w-full rounded border border-slate-200 px-2.5 py-1.5 text-xs"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-semibold text-slate-700">Template Layout</label>
                  <select
                    value={activeResume.template_id || 'modern_tech'}
                    onChange={(e) => setActiveResume({ ...activeResume, template_id: e.target.value })}
                    className="mt-1 w-full rounded border border-slate-200 bg-white px-2.5 py-1.5 text-xs"
                  >
                    <option value="modern_tech">Modern Tech Template</option>
                    <option value="classic_executive">Classic Executive Template</option>
                    <option value="clean_compact">Clean Compact Template</option>
                  </select>
                </div>

                <button
                  type="button"
                  onClick={async () => {
                    await updateResume(activeResume.id, activeResume)
                  }}
                  className="mt-2 w-full rounded-lg bg-teal-600 py-2 text-xs font-semibold text-white shadow hover:bg-teal-700"
                >
                  Save Version Settings
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
        <div>
          <h3 className="text-lg font-bold text-slate-900">Resume & Applications Manager</h3>
          <p className="text-xs text-slate-500">Create target resumes reusing your single Career Profile source of truth.</p>
        </div>
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={loadResumes}
            className="rounded-lg border border-slate-200 bg-slate-50 p-2 text-slate-600 transition hover:bg-slate-100"
            title="Refresh & Sync Resumes"
          >
            <RotateCw size={14} />
          </button>
          <button
            type="button"
            onClick={() => setIsCreateOpen(true)}
            className="focus-ring inline-flex items-center gap-1.5 rounded-lg bg-teal-600 px-4 py-2 text-xs font-semibold text-white shadow-sm transition hover:bg-teal-700"
          >
            <Plus size={14} />
            Create New Resume
          </button>
        </div>
      </div>

      {isCreateOpen && (
        <form onSubmit={handleCreate} className="rounded-xl border border-teal-200 bg-teal-50/40 p-6 shadow-sm">
          <h4 className="text-sm font-bold text-teal-900">Create Target Resume Version</h4>
          <div className="mt-4 grid gap-4 sm:grid-cols-3">
            <div>
              <label className="block text-xs font-semibold text-slate-700">Resume Name / Title</label>
              <input
                type="text"
                placeholder="e.g. Lead Full Stack Resume"
                value={newTitle}
                onChange={(e) => setNewTitle(e.target.value)}
                className="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2 text-xs outline-none"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-700">Target Role</label>
              <input
                type="text"
                placeholder="e.g. Software Architect"
                value={newTargetRole}
                onChange={(e) => setNewTargetRole(e.target.value)}
                className="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2 text-xs outline-none"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-700">Template</label>
              <select
                value={newTemplateId}
                onChange={(e) => setNewTemplateId(e.target.value)}
                className="mt-1 w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-xs outline-none"
              >
                <option value="modern_tech">Modern Tech</option>
                <option value="classic_executive">Classic Executive</option>
                <option value="clean_compact">Clean Compact</option>
              </select>
            </div>
          </div>
          <div className="mt-4 flex items-center justify-end gap-2">
            <button
              type="button"
              onClick={() => setIsCreateOpen(false)}
              className="rounded-lg px-3.5 py-1.5 text-xs font-semibold text-slate-600 hover:bg-slate-200"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="rounded-lg bg-teal-600 px-4 py-1.5 text-xs font-semibold text-white shadow hover:bg-teal-700"
            >
              Create Resume
            </button>
          </div>
        </form>
      )}

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {resumes.map((res) => (
          <div
            key={res.id}
            className="flex flex-col justify-between rounded-xl border border-slate-200 bg-white p-5 shadow-sm transition hover:border-teal-500/50 hover:shadow-md"
          >
            <div>
              <div className="flex items-center justify-between">
                <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-teal-500/10 text-teal-600">
                  <FileText size={18} />
                </span>
                <span className={`rounded border px-2 py-0.5 text-[10px] font-bold uppercase ${
                  res.syncStatus === 'cloud_saved'
                    ? 'border-emerald-200 bg-emerald-50 text-emerald-700'
                    : res.syncStatus === 'pending_sync'
                    ? 'border-amber-400 bg-amber-100 text-amber-900'
                    : res.syncStatus === 'sync_error'
                    ? 'border-red-300 bg-red-50 text-red-700'
                    : 'border-slate-200 bg-slate-100 text-slate-700'
                }`}>
                  {res.syncStatus === 'cloud_saved'
                    ? 'CLOUD SAVED'
                    : res.syncStatus === 'pending_sync'
                    ? 'PENDING SYNC'
                    : res.syncStatus === 'sync_error'
                    ? 'SYNC ERROR'
                    : 'LOCAL OFFLINE'}
                </span>
              </div>
              <h4 className="mt-4 text-base font-bold text-slate-900">{res.title}</h4>
              <p className="mt-1 text-xs text-slate-500">Target: <span className="font-semibold text-slate-700">{res.target_role || 'General'}</span></p>
              <p className="mt-2 text-[11px] text-slate-400">Template: {res.template_id}</p>
            </div>

            <div className="mt-5 flex items-center gap-2 border-t border-slate-100 pt-3">
              <button
                type="button"
                onClick={() => openResume(res.id)}
                className="focus-ring flex-1 inline-flex items-center justify-center gap-1.5 rounded-lg border border-slate-200 bg-slate-50 py-2 text-xs font-semibold text-slate-700 transition hover:bg-teal-600 hover:text-white hover:border-teal-600"
              >
                <Eye size={14} />
                Open Editor
              </button>
              <button
                type="button"
                onClick={() => deleteResume(res.id)}
                className="rounded-lg p-2 text-slate-400 hover:bg-red-50 hover:text-red-600"
              >
                <Trash2 size={16} />
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
