import { useState } from 'react'

export function PortfolioProjectEditor({ project, onSave, onCancel }) {
  const [title, setTitle] = useState(project?.title || '')
  const [shortDescription, setShortDescription] = useState(project?.short_description || '')
  const [detailedDescription, setDetailedDescription] = useState(project?.detailed_description || '')
  const [projectType, setProjectType] = useState(project?.project_type || 'Full Stack App')
  const [role, setRole] = useState(project?.role || 'Lead Developer')
  const [technologies, setTechnologies] = useState(
    Array.isArray(project?.technologies) ? project.technologies.join(', ') : ''
  )
  const [projectUrl, setProjectUrl] = useState(project?.project_url || '')
  const [repositoryUrl, setRepositoryUrl] = useState(project?.repository_url || '')
  const [achievements, setAchievements] = useState(project?.achievements || '')
  const [featured, setFeatured] = useState(Boolean(project?.featured))
  const [isPublic, setIsPublic] = useState(project?.is_public !== false)

  function handleSubmit(e) {
    e.preventDefault()
    if (!title.trim()) return

    const techArray = technologies
      .split(',')
      .map((t) => t.trim())
      .filter(Boolean)

    onSave({
      title: title.trim(),
      short_description: shortDescription.trim(),
      detailed_description: detailedDescription.trim(),
      project_type: projectType,
      role: role.trim(),
      technologies: techArray,
      project_url: projectUrl.trim(),
      repository_url: repositoryUrl.trim(),
      achievements: achievements.trim(),
      featured,
      is_public: isPublic,
    })
  }

  return (
    <form onSubmit={handleSubmit} className="rounded-xl border border-teal-300 bg-white p-6 shadow-lg">
      <div className="border-b border-slate-100 pb-3">
        <h4 className="text-sm font-bold text-slate-900">
          {project ? 'Edit Portfolio Project' : 'Add New Portfolio Project'}
        </h4>
        <p className="text-xs text-slate-500">Showcase your technical accomplishments and live systems.</p>
      </div>

      <div className="mt-4 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        <div className="sm:col-span-2">
          <label className="block text-xs font-semibold text-slate-700">Project Title *</label>
          <input
            type="text"
            required
            placeholder="e.g. Project Atlas — Multi-Suite Platform"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            className="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2 text-xs outline-none focus:border-teal-500"
          />
        </div>

        <div>
          <label className="block text-xs font-semibold text-slate-700">Project Type</label>
          <select
            value={projectType}
            onChange={(e) => setProjectType(e.target.value)}
            className="mt-1 w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-xs outline-none focus:border-teal-500"
          >
            <option value="Full Stack App">Full Stack App</option>
            <option value="Frontend UI">Frontend UI</option>
            <option value="Backend API">Backend API</option>
            <option value="Automation Tool">Automation Tool</option>
            <option value="System Architecture">System Architecture</option>
            <option value="Open Source">Open Source</option>
            <option value="Case Study">Case Study</option>
          </select>
        </div>

        <div>
          <label className="block text-xs font-semibold text-slate-700">Your Role</label>
          <input
            type="text"
            placeholder="e.g. Lead Architect / Full Stack"
            value={role}
            onChange={(e) => setRole(e.target.value)}
            className="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2 text-xs outline-none focus:border-teal-500"
          />
        </div>

        <div className="sm:col-span-2">
          <label className="block text-xs font-semibold text-slate-700">Technologies (Comma-separated)</label>
          <input
            type="text"
            placeholder="React, PostgreSQL, Supabase, Tailwind CSS"
            value={technologies}
            onChange={(e) => setTechnologies(e.target.value)}
            className="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2 text-xs outline-none focus:border-teal-500"
          />
        </div>

        <div>
          <label className="block text-xs font-semibold text-slate-700">Live Demo / Product URL</label>
          <input
            type="url"
            placeholder="https://..."
            value={projectUrl}
            onChange={(e) => setProjectUrl(e.target.value)}
            className="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2 text-xs outline-none focus:border-teal-500"
          />
        </div>

        <div>
          <label className="block text-xs font-semibold text-slate-700">Source Code / Repository URL</label>
          <input
            type="url"
            placeholder="https://github.com/..."
            value={repositoryUrl}
            onChange={(e) => setRepositoryUrl(e.target.value)}
            className="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2 text-xs outline-none focus:border-teal-500"
          />
        </div>

        <div>
          <label className="block text-xs font-semibold text-slate-700">Key Measurable Achievement / Impact</label>
          <input
            type="text"
            placeholder="e.g. Processed 50k+ docs with 99.9% uptime"
            value={achievements}
            onChange={(e) => setAchievements(e.target.value)}
            className="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2 text-xs outline-none focus:border-teal-500"
          />
        </div>

        <div className="sm:col-span-2 lg:col-span-3">
          <label className="block text-xs font-semibold text-slate-700">Short Summary / Description *</label>
          <textarea
            rows={2}
            required
            placeholder="Describe what the system accomplishes and why it matters..."
            value={shortDescription}
            onChange={(e) => setShortDescription(e.target.value)}
            className="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2 text-xs outline-none focus:border-teal-500"
          />
        </div>

        <div className="sm:col-span-2 flex items-center gap-6">
          <label className="flex items-center gap-2 text-xs font-semibold text-slate-700 cursor-pointer">
            <input
              type="checkbox"
              checked={featured}
              onChange={(e) => setFeatured(e.target.checked)}
              className="rounded border-slate-300 text-teal-600 focus:ring-teal-500"
            />
            Mark as Featured Project
          </label>

          <label className="flex items-center gap-2 text-xs font-semibold text-slate-700 cursor-pointer">
            <input
              type="checkbox"
              checked={isPublic}
              onChange={(e) => setIsPublic(e.target.checked)}
              className="rounded border-slate-300 text-teal-600 focus:ring-teal-500"
            />
            Visible on Public Career Profile
          </label>
        </div>
      </div>

      <div className="mt-5 flex items-center justify-end gap-2 border-t border-slate-100 pt-3">
        <button
          type="button"
          onClick={onCancel}
          className="rounded-lg px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100"
        >
          Cancel
        </button>
        <button
          type="submit"
          className="rounded-lg bg-teal-600 px-4 py-2 text-xs font-semibold text-white shadow hover:bg-teal-700"
        >
          {project ? 'Save Changes' : 'Create Project'}
        </button>
      </div>
    </form>
  )
}
