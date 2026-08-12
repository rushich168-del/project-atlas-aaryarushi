import { useState } from 'react'
import {
  Save,
  Plus,
  Trash2,
  Edit3,
  RefreshCw,
  AlertCircle,
  Loader2,
  Check,
  RotateCw,
  AlertTriangle,
  Cloud,
  HardDrive,
} from 'lucide-react'
import { useCareerProfile } from '../hooks/useCareerProfile.js'

export function CareerProfileTab() {
  const {
    profile,
    setProfile,
    education,
    experience,
    skills,
    loading,
    saving,
    error,
    saveResult,
    conflictState,
    loadData,
    saveIdentity,
    saveEducation,
    deleteEducation,
    saveExperience,
    deleteExperience,
    addSkill,
    deleteSkill,
    retrySync,
    resolveConflict,
  } = useCareerProfile()

  const [editingEdu, setEditingEdu] = useState(null)
  const [editingExp, setEditingExp] = useState(null)
  const [newSkillName, setNewSkillName] = useState('')
  const [newSkillCategory, setNewSkillCategory] = useState('Technical')
  const [newSkillProficiency, setNewSkillProficiency] = useState('Intermediate')

  async function handleSaveIdentity(e) {
    e.preventDefault()
    await saveIdentity(profile)
  }

  async function handleSaveEducation(eduData) {
    await saveEducation(eduData)
    setEditingEdu(null)
  }

  async function handleSaveExperience(expData) {
    await saveExperience(expData)
    setEditingExp(null)
  }

  async function handleAddSkill(e) {
    e.preventDefault()
    if (!newSkillName.trim()) return
    await addSkill({
      name: newSkillName.trim(),
      category: newSkillCategory,
      proficiency: newSkillProficiency,
    })
    setNewSkillName('')
  }

  if (loading) {
    return (
      <div className="flex min-h-[300px] items-center justify-center rounded-xl border border-slate-200 bg-white p-8">
        <div className="flex items-center gap-3 text-slate-600">
          <Loader2 size={24} className="animate-spin text-teal-600" />
          <span className="text-sm font-semibold">Loading Career Profile...</span>
        </div>
      </div>
    )
  }

  if (error && !profile.full_name) {
    return (
      <div className="rounded-xl border border-red-200 bg-red-50 p-6 text-red-700">
        <div className="flex items-center gap-3">
          <AlertCircle size={20} />
          <p className="text-sm font-semibold">{error}</p>
        </div>
        <button
          type="button"
          onClick={loadData}
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
      {/* Conflict Resolution Banner */}
      {conflictState?.hasConflict && (
        <div className="rounded-xl border border-amber-300 bg-amber-50 p-5 text-amber-900 shadow-sm">
          <div className="flex items-start gap-3">
            <AlertTriangle size={20} className="mt-0.5 shrink-0 text-amber-600" />
            <div className="flex-1">
              <div className="flex items-center justify-between">
                <h4 className="text-sm font-bold">Sync Conflict Detected</h4>
                <span className="rounded border border-amber-400 bg-amber-200 px-2 py-0.5 text-[10px] font-bold uppercase text-amber-900">
                  SYNC CONFLICT
                </span>
              </div>
              <p className="mt-1 text-xs leading-5 text-amber-800">
                Your profile was modified on another device while you were working offline. Choose which version you would like to keep:
              </p>
              
              <div className="mt-4 grid gap-3 sm:grid-cols-2 text-xs">
                <div className="rounded-lg border border-amber-200 bg-white/90 p-3">
                  <div className="flex items-center gap-1.5 font-bold text-slate-900">
                    <Cloud size={14} className="text-teal-600" />
                    Cloud Version
                  </div>
                  <p className="mt-1 text-slate-600 font-medium">{conflictState.cloudVersion?.headline || 'No headline'}</p>
                  <p className="mt-0.5 text-[11px] text-slate-500 line-clamp-2">{conflictState.cloudVersion?.summary || 'No summary'}</p>
                  <button
                    type="button"
                    onClick={() => resolveConflict('cloud')}
                    disabled={saving}
                    className="focus-ring mt-3 w-full rounded-md border border-slate-300 bg-white py-1.5 text-xs font-semibold text-slate-800 hover:bg-slate-50"
                  >
                    Keep Cloud Version
                  </button>
                </div>

                <div className="rounded-lg border border-amber-200 bg-white/90 p-3">
                  <div className="flex items-center gap-1.5 font-bold text-slate-900">
                    <HardDrive size={14} className="text-amber-600" />
                    My Offline Changes
                  </div>
                  <p className="mt-1 text-slate-600 font-medium">{conflictState.localVersion?.headline || 'No headline'}</p>
                  <p className="mt-0.5 text-[11px] text-slate-500 line-clamp-2">{conflictState.localVersion?.summary || 'No summary'}</p>
                  <button
                    type="button"
                    onClick={() => resolveConflict('local')}
                    disabled={saving}
                    className="focus-ring mt-3 w-full rounded-md bg-amber-600 py-1.5 text-xs font-semibold text-white hover:bg-amber-700 shadow-sm"
                  >
                    Keep My Offline Changes
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Sync Status Toast / Bar */}
      {saveResult && !conflictState?.hasConflict && (
        <div className={`flex items-center justify-between rounded-lg border px-4 py-3 text-xs font-semibold ${
          saveResult.status === 'pending_sync' || saveResult.status === 'local_offline'
            ? 'border-amber-200 bg-amber-50 text-amber-800'
            : saveResult.status === 'sync_error'
            ? 'border-red-200 bg-red-50 text-red-800'
            : 'border-emerald-200 bg-emerald-50 text-emerald-800'
        }`}>
          <div className="flex items-center gap-2">
            {saveResult.status === 'sync_error' ? <AlertCircle size={16} /> : <Check size={16} />}
            <span>{saveResult.message}</span>
          </div>
          <div className="flex items-center gap-2">
            {saveResult.pendingSync && (
              <button
                type="button"
                onClick={retrySync}
                className="inline-flex items-center gap-1 rounded bg-amber-200 px-2 py-0.5 text-[10px] font-bold text-amber-900 hover:bg-amber-300"
              >
                <RotateCw size={10} />
                Sync to Cloud
              </button>
            )}
            <span className={`rounded border px-2 py-0.5 text-[10px] font-bold uppercase ${
              saveResult.status === 'pending_sync'
                ? 'border-amber-400 bg-amber-100 text-amber-900'
                : saveResult.status === 'local_offline'
                ? 'border-amber-300 bg-amber-100 text-amber-900'
                : saveResult.status === 'sync_error'
                ? 'border-red-300 bg-red-100 text-red-900'
                : 'border-emerald-300 bg-emerald-100 text-emerald-900'
            }`}>
              {saveResult.status === 'pending_sync'
                ? 'PENDING CLOUD SYNC'
                : saveResult.status === 'local_offline'
                ? 'LOCAL OFFLINE CACHE'
                : saveResult.status === 'sync_error'
                ? 'SYNC ERROR'
                : 'CLOUD SAVED'}
            </span>
          </div>
        </div>
      )}

      {/* Basic Identity & Summary Section */}
      <form onSubmit={handleSaveIdentity} className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
        <div className="flex items-center justify-between border-b border-slate-100 pb-4">
          <div>
            <h3 className="text-lg font-bold text-slate-900">Career Identity & Summary</h3>
            <p className="text-xs text-slate-500">Maintain your primary baseline details for applications and resume generation.</p>
          </div>
          <button
            type="submit"
            disabled={saving}
            className="focus-ring inline-flex items-center gap-2 rounded-lg bg-teal-600 px-4 py-2 text-xs font-semibold text-white shadow-sm transition hover:bg-teal-700 disabled:opacity-50"
          >
            {saving ? <Loader2 size={14} className="animate-spin" /> : <Save size={14} />}
            Save Identity
          </button>
        </div>

        <div className="mt-5 grid gap-4 sm:grid-cols-2">
          <div>
            <label className="block text-xs font-semibold text-slate-700">Full Name</label>
            <input
              type="text"
              value={profile.full_name || ''}
              onChange={(e) => setProfile({ ...profile, full_name: e.target.value })}
              className="mt-1.5 w-full rounded-lg border border-slate-200 px-3 py-2 text-sm text-slate-900 outline-none focus:border-teal-500 focus:ring-1 focus:ring-teal-500"
              placeholder="e.g. Aarya Rushi"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700">Professional Headline</label>
            <input
              type="text"
              value={profile.headline || ''}
              onChange={(e) => setProfile({ ...profile, headline: e.target.value })}
              className="mt-1.5 w-full rounded-lg border border-slate-200 px-3 py-2 text-sm text-slate-900 outline-none focus:border-teal-500 focus:ring-1 focus:ring-teal-500"
              placeholder="e.g. Senior Full Stack Engineer"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700">Location</label>
            <input
              type="text"
              value={profile.location || ''}
              onChange={(e) => setProfile({ ...profile, location: e.target.value })}
              className="mt-1.5 w-full rounded-lg border border-slate-200 px-3 py-2 text-sm text-slate-900 outline-none focus:border-teal-500 focus:ring-1 focus:ring-teal-500"
              placeholder="e.g. Mumbai, India"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700">Phone / Contact Number</label>
            <input
              type="text"
              value={profile.phone || ''}
              onChange={(e) => setProfile({ ...profile, phone: e.target.value })}
              className="mt-1.5 w-full rounded-lg border border-slate-200 px-3 py-2 text-sm text-slate-900 outline-none focus:border-teal-500 focus:ring-1 focus:ring-teal-500"
              placeholder="e.g. +91 98765 43210"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700">Target Role</label>
            <input
              type="text"
              value={profile.target_role || ''}
              onChange={(e) => setProfile({ ...profile, target_role: e.target.value })}
              className="mt-1.5 w-full rounded-lg border border-slate-200 px-3 py-2 text-sm text-slate-900 outline-none focus:border-teal-500 focus:ring-1 focus:ring-teal-500"
              placeholder="e.g. Technical Lead / Software Architect"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700">Career Level</label>
            <select
              value={profile.career_level || 'Mid'}
              onChange={(e) => setProfile({ ...profile, career_level: e.target.value })}
              className="mt-1.5 w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-900 outline-none focus:border-teal-500 focus:ring-1 focus:ring-teal-500"
            >
              <option value="Entry">Entry Level</option>
              <option value="Mid">Mid Level</option>
              <option value="Senior">Senior Level</option>
              <option value="Lead">Lead / Staff</option>
              <option value="Executive">Executive</option>
            </select>
          </div>

          <div className="sm:col-span-2">
            <label className="block text-xs font-semibold text-slate-700">Professional Summary</label>
            <textarea
              rows={3}
              value={profile.summary || ''}
              onChange={(e) => setProfile({ ...profile, summary: e.target.value })}
              className="mt-1.5 w-full rounded-lg border border-slate-200 px-3 py-2 text-sm text-slate-900 outline-none focus:border-teal-500 focus:ring-1 focus:ring-teal-500"
              placeholder="Summarize your professional background and core strengths..."
            />
          </div>
        </div>
      </form>

      {/* Education Section */}
      <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
        <div className="flex items-center justify-between border-b border-slate-100 pb-4">
          <div>
            <h3 className="text-lg font-bold text-slate-900">Education History</h3>
            <p className="text-xs text-slate-500">Degrees, academic credentials, and certifications.</p>
          </div>
          <button
            type="button"
            onClick={() => setEditingEdu({ institution: '', degree: '', field_of_study: '', start_date: '', end_date: '', grade: '', description: '' })}
            className="focus-ring inline-flex items-center gap-1.5 rounded-lg border border-slate-200 bg-slate-50 px-3 py-1.5 text-xs font-semibold text-slate-700 transition hover:bg-slate-100"
          >
            <Plus size={14} />
            Add Education
          </button>
        </div>

        <div className="mt-4 space-y-3">
          {education.length === 0 ? (
            <p className="py-4 text-center text-xs text-slate-500">No education entries added yet.</p>
          ) : (
            education.map((edu) => (
              <div key={edu.id} className="flex items-start justify-between rounded-lg border border-slate-100 bg-slate-50/60 p-4">
                <div>
                  <h4 className="text-sm font-bold text-slate-900">{edu.institution}</h4>
                  <p className="text-xs font-medium text-teal-700">
                    {edu.degree} {edu.field_of_study ? `in ${edu.field_of_study}` : ''}
                  </p>
                  <p className="mt-1 text-[11px] text-slate-500">
                    {edu.start_date || 'N/A'} — {edu.end_date || 'Present'} {edu.grade ? `| ${edu.grade}` : ''}
                  </p>
                  {edu.description && <p className="mt-2 text-xs leading-5 text-slate-600">{edu.description}</p>}
                </div>
                <div className="flex items-center gap-1">
                  <button
                    type="button"
                    onClick={() => setEditingEdu(edu)}
                    className="rounded p-1.5 text-slate-400 hover:bg-slate-200 hover:text-slate-700"
                  >
                    <Edit3 size={14} />
                  </button>
                  <button
                    type="button"
                    onClick={() => deleteEducation(edu.id)}
                    className="rounded p-1.5 text-slate-400 hover:bg-red-50 hover:text-red-600"
                  >
                    <Trash2 size={14} />
                  </button>
                </div>
              </div>
            ))
          )}
        </div>

        {editingEdu && (
          <div className="mt-4 rounded-lg border border-teal-200 bg-teal-50/30 p-4">
            <h4 className="text-xs font-bold text-teal-900">{editingEdu.id ? 'Edit Education' : 'Add New Education'}</h4>
            <div className="mt-3 grid gap-3 sm:grid-cols-2">
              <input
                type="text"
                placeholder="Institution (e.g. University of Technology)"
                value={editingEdu.institution || ''}
                onChange={(e) => setEditingEdu({ ...editingEdu, institution: e.target.value })}
                className="rounded-md border border-slate-200 px-3 py-1.5 text-xs text-slate-900 outline-none"
              />
              <input
                type="text"
                placeholder="Degree (e.g. Bachelor of Technology)"
                value={editingEdu.degree || ''}
                onChange={(e) => setEditingEdu({ ...editingEdu, degree: e.target.value })}
                className="rounded-md border border-slate-200 px-3 py-1.5 text-xs text-slate-900 outline-none"
              />
              <input
                type="text"
                placeholder="Field of Study (e.g. Computer Science)"
                value={editingEdu.field_of_study || ''}
                onChange={(e) => setEditingEdu({ ...editingEdu, field_of_study: e.target.value })}
                className="rounded-md border border-slate-200 px-3 py-1.5 text-xs text-slate-900 outline-none"
              />
              <input
                type="text"
                placeholder="Grade / CGPA (e.g. 8.8 CGPA)"
                value={editingEdu.grade || ''}
                onChange={(e) => setEditingEdu({ ...editingEdu, grade: e.target.value })}
                className="rounded-md border border-slate-200 px-3 py-1.5 text-xs text-slate-900 outline-none"
              />
              <input
                type="text"
                placeholder="Start Date (e.g. 2020-08)"
                value={editingEdu.start_date || ''}
                onChange={(e) => setEditingEdu({ ...editingEdu, start_date: e.target.value })}
                className="rounded-md border border-slate-200 px-3 py-1.5 text-xs text-slate-900 outline-none"
              />
              <input
                type="text"
                placeholder="End Date (e.g. 2024-05)"
                value={editingEdu.end_date || ''}
                onChange={(e) => setEditingEdu({ ...editingEdu, end_date: e.target.value })}
                className="rounded-md border border-slate-200 px-3 py-1.5 text-xs text-slate-900 outline-none"
              />
            </div>
            <div className="mt-3 flex items-center justify-end gap-2">
              <button
                type="button"
                onClick={() => setEditingEdu(null)}
                className="rounded px-3 py-1 text-xs font-semibold text-slate-600 hover:bg-slate-200"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={() => handleSaveEducation(editingEdu)}
                className="rounded bg-teal-600 px-3 py-1 text-xs font-semibold text-white hover:bg-teal-700"
              >
                Save Entry
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Experience Section */}
      <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
        <div className="flex items-center justify-between border-b border-slate-100 pb-4">
          <div>
            <h3 className="text-lg font-bold text-slate-900">Work & Experience</h3>
            <p className="text-xs text-slate-500">Employment history, roles, responsibilities, and key achievements.</p>
          </div>
          <button
            type="button"
            onClick={() => setEditingExp({ company: '', job_title: '', start_date: '', end_date: '', currently_working: false, description: '', achievements: '' })}
            className="focus-ring inline-flex items-center gap-1.5 rounded-lg border border-slate-200 bg-slate-50 px-3 py-1.5 text-xs font-semibold text-slate-700 transition hover:bg-slate-100"
          >
            <Plus size={14} />
            Add Experience
          </button>
        </div>

        <div className="mt-4 space-y-3">
          {experience.length === 0 ? (
            <p className="py-4 text-center text-xs text-slate-500">No experience entries added yet.</p>
          ) : (
            experience.map((exp) => (
              <div key={exp.id} className="flex items-start justify-between rounded-lg border border-slate-100 bg-slate-50/60 p-4">
                <div>
                  <h4 className="text-sm font-bold text-slate-900">{exp.job_title}</h4>
                  <p className="text-xs font-medium text-teal-700">{exp.company}</p>
                  <p className="mt-1 text-[11px] text-slate-500">
                    {exp.start_date || 'N/A'} — {exp.currently_working ? 'Present (Currently Working)' : exp.end_date || 'N/A'}
                  </p>
                  {exp.description && <p className="mt-2 text-xs leading-5 text-slate-600">{exp.description}</p>}
                  {exp.achievements && (
                    <p className="mt-1 text-xs font-medium text-slate-700">
                      <span className="font-semibold text-teal-800">Key Impact:</span> {exp.achievements}
                    </p>
                  )}
                </div>
                <div className="flex items-center gap-1">
                  <button
                    type="button"
                    onClick={() => setEditingExp(exp)}
                    className="rounded p-1.5 text-slate-400 hover:bg-slate-200 hover:text-slate-700"
                  >
                    <Edit3 size={14} />
                  </button>
                  <button
                    type="button"
                    onClick={() => deleteExperience(exp.id)}
                    className="rounded p-1.5 text-slate-400 hover:bg-red-50 hover:text-red-600"
                  >
                    <Trash2 size={14} />
                  </button>
                </div>
              </div>
            ))
          )}
        </div>

        {editingExp && (
          <div className="mt-4 rounded-lg border border-teal-200 bg-teal-50/30 p-4">
            <h4 className="text-xs font-bold text-teal-900">{editingExp.id ? 'Edit Experience' : 'Add New Experience'}</h4>
            <div className="mt-3 grid gap-3 sm:grid-cols-2">
              <input
                type="text"
                placeholder="Company Name"
                value={editingExp.company || ''}
                onChange={(e) => setEditingExp({ ...editingExp, company: e.target.value })}
                className="rounded-md border border-slate-200 px-3 py-1.5 text-xs text-slate-900 outline-none"
              />
              <input
                type="text"
                placeholder="Job Title / Role"
                value={editingExp.job_title || ''}
                onChange={(e) => setEditingExp({ ...editingExp, job_title: e.target.value })}
                className="rounded-md border border-slate-200 px-3 py-1.5 text-xs text-slate-900 outline-none"
              />
              <input
                type="text"
                placeholder="Start Date (e.g. 2024-01)"
                value={editingExp.start_date || ''}
                onChange={(e) => setEditingExp({ ...editingExp, start_date: e.target.value })}
                className="rounded-md border border-slate-200 px-3 py-1.5 text-xs text-slate-900 outline-none"
              />
              <input
                type="text"
                placeholder="End Date (e.g. 2024-12)"
                disabled={editingExp.currently_working}
                value={editingExp.end_date || ''}
                onChange={(e) => setEditingExp({ ...editingExp, end_date: e.target.value })}
                className="rounded-md border border-slate-200 px-3 py-1.5 text-xs text-slate-900 outline-none disabled:bg-slate-100"
              />
              <label className="flex items-center gap-2 text-xs font-semibold text-slate-700 sm:col-span-2">
                <input
                  type="checkbox"
                  checked={Boolean(editingExp.currently_working)}
                  onChange={(e) => setEditingExp({ ...editingExp, currently_working: e.target.checked })}
                  className="rounded border-slate-300 text-teal-600 focus:ring-teal-500"
                />
                I am currently working in this role
              </label>
              <textarea
                placeholder="Role Description"
                rows={2}
                value={editingExp.description || ''}
                onChange={(e) => setEditingExp({ ...editingExp, description: e.target.value })}
                className="rounded-md border border-slate-200 px-3 py-1.5 text-xs text-slate-900 outline-none sm:col-span-2"
              />
            </div>
            <div className="mt-3 flex items-center justify-end gap-2">
              <button
                type="button"
                onClick={() => setEditingExp(null)}
                className="rounded px-3 py-1 text-xs font-semibold text-slate-600 hover:bg-slate-200"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={() => handleSaveExperience(editingExp)}
                className="rounded bg-teal-600 px-3 py-1 text-xs font-semibold text-white hover:bg-teal-700"
              >
                Save Entry
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Skills Section */}
      <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
        <div className="border-b border-slate-100 pb-4">
          <h3 className="text-lg font-bold text-slate-900">Skills Matrix</h3>
          <p className="text-xs text-slate-500">Categorized technical and domain competencies with proficiency levels.</p>
        </div>

        <form onSubmit={handleAddSkill} className="mt-4 flex flex-wrap items-center gap-2">
          <input
            type="text"
            placeholder="Skill Name (e.g. PostgreSQL)"
            value={newSkillName}
            onChange={(e) => setNewSkillName(e.target.value)}
            className="flex-1 rounded-lg border border-slate-200 px-3 py-1.5 text-xs text-slate-900 outline-none"
          />
          <select
            value={newSkillCategory}
            onChange={(e) => setNewSkillCategory(e.target.value)}
            className="rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-xs text-slate-900 outline-none"
          >
            <option value="Technical">Technical</option>
            <option value="Domain">Domain</option>
            <option value="Soft Skill">Soft Skill</option>
          </select>
          <select
            value={newSkillProficiency}
            onChange={(e) => setNewSkillProficiency(e.target.value)}
            className="rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-xs text-slate-900 outline-none"
          >
            <option value="Beginner">Beginner</option>
            <option value="Intermediate">Intermediate</option>
            <option value="Advanced">Advanced</option>
            <option value="Expert">Expert</option>
          </select>
          <button
            type="submit"
            className="focus-ring inline-flex items-center gap-1.5 rounded-lg bg-teal-600 px-3.5 py-1.5 text-xs font-semibold text-white transition hover:bg-teal-700"
          >
            <Plus size={14} />
            Add Skill
          </button>
        </form>

        <div className="mt-5 flex flex-wrap gap-2">
          {skills.map((skill) => (
            <div
              key={skill.id}
              className="inline-flex items-center gap-2 rounded-lg border border-slate-200 bg-slate-50 px-3 py-1.5 text-xs font-medium text-slate-800"
            >
              <span>{skill.name}</span>
              <span className="rounded bg-teal-100 px-1.5 py-0.5 text-[10px] font-semibold text-teal-800">
                {skill.proficiency}
              </span>
              <button
                type="button"
                onClick={() => deleteSkill(skill.id)}
                className="text-slate-400 hover:text-red-600"
              >
                &times;
              </button>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
