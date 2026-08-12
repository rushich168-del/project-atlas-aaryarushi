import { useState } from 'react'
import {
  Award,
  Plus,
  Globe,
  FileText,
  Sparkles,
  Layers,
  Star,
  CheckCircle2,
  Lock,
  ExternalLink,
  Loader2,
  RefreshCw,
  AlertCircle,
} from 'lucide-react'
import { usePortfolio } from '../hooks/usePortfolio.js'
import { PortfolioProjectCard } from './PortfolioProjectCard.jsx'
import { PortfolioProjectEditor } from './PortfolioProjectEditor.jsx'
import { ProfessionalBioSection } from './ProfessionalBioSection.jsx'
import { LinkedInOptimizer } from './LinkedInOptimizer.jsx'
import { PublicProfilePreview } from './PublicProfilePreview.jsx'

export function CareerPortfolioTab() {
  const {
    projects,
    publicProfile,
    loading,
    isSaving,
    profile,
    skills,
    experience,
    education,
    bioOptions,
    linkedInRecs,
    loadAll,
    createProject,
    updateProject,
    deleteProject,
    savePublicSettings,
  } = usePortfolio()

  const [activeSubView, setActiveSubView] = useState('projects') // 'projects' | 'bio' | 'linkedin' | 'public'
  const [editingProject, setEditingProject] = useState(null)
  const [isAddingNew, setIsAddingNew] = useState(false)

  async function handleSaveProject(projectData) {
    if (editingProject) {
      await updateProject(editingProject.id, projectData)
      setEditingProject(null)
    } else {
      await createProject(projectData)
      setIsAddingNew(false)
    }
  }

  async function handleSaveBio(bioText) {
    await savePublicSettings({
      ...publicProfile,
      bio: bioText,
    })
  }

  if (loading && !projects.length) {
    return (
      <div className="flex min-h-[300px] items-center justify-center rounded-xl border border-slate-200 bg-white p-8">
        <div className="flex items-center gap-3 text-slate-600">
          <Loader2 size={24} className="animate-spin text-teal-600" />
          <span className="text-sm font-semibold">Loading Career Portfolio...</span>
        </div>
      </div>
    )
  }

  const featuredCount = projects.filter((p) => p.featured).length
  const publicCount = projects.filter((p) => p.is_public !== false).length

  return (
    <div className="space-y-6">
      {/* 1. Metrics & Overview */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold uppercase tracking-wider text-slate-500">Portfolio Projects</span>
            <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-teal-50 text-teal-700">
              <Layers size={16} />
            </span>
          </div>
          <p className="mt-2 text-2xl font-extrabold text-slate-900">{projects.length}</p>
          <p className="mt-1 text-[11px] text-slate-500">Verified project showcases</p>
        </div>

        <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold uppercase tracking-wider text-slate-500">Featured Highlights</span>
            <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-amber-50 text-amber-700">
              <Star size={16} />
            </span>
          </div>
          <p className="mt-2 text-2xl font-extrabold text-amber-700">{featuredCount}</p>
          <p className="mt-1 text-[11px] text-slate-500">Highlighted on top of profile</p>
        </div>

        <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold uppercase tracking-wider text-slate-500">Public Visibility</span>
            <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-emerald-50 text-emerald-700">
              <Globe size={16} />
            </span>
          </div>
          <p className="mt-2 text-2xl font-extrabold text-emerald-700">{publicCount}</p>
          <p className="mt-1 text-[11px] text-slate-500">
            {publicProfile?.is_published ? 'Live on public URL' : 'Ready for publishing'}
          </p>
        </div>

        <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold uppercase tracking-wider text-slate-500">Profile Completeness</span>
            <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-blue-50 text-blue-700">
              <CheckCircle2 size={16} />
            </span>
          </div>
          <p className="mt-2 text-2xl font-extrabold text-blue-700">{linkedInRecs.completenessScore}%</p>
          <div className="mt-2 h-1.5 w-full rounded-full bg-slate-100">
            <div
              className="h-1.5 rounded-full bg-blue-600 transition-all duration-500"
              style={{ width: `${linkedInRecs.completenessScore}%` }}
            />
          </div>
        </div>
      </div>

      {/* 2. Sub-View Switcher Bar */}
      <div className="flex flex-col gap-4 rounded-xl border border-slate-200 bg-white p-5 shadow-sm sm:flex-row sm:items-center sm:justify-between">
        <div className="flex flex-wrap items-center gap-2">
          <button
            type="button"
            onClick={() => {
              setActiveSubView('projects')
              setIsAddingNew(false)
              setEditingProject(null)
            }}
            className={`focus-ring inline-flex items-center gap-2 rounded-lg px-4 py-2 text-xs font-semibold transition ${
              activeSubView === 'projects'
                ? 'bg-teal-600 text-white shadow-sm'
                : 'border border-slate-200 bg-slate-50 text-slate-700 hover:bg-slate-100'
            }`}
          >
            <Layers size={14} />
            Projects Showcase ({projects.length})
          </button>

          <button
            type="button"
            onClick={() => setActiveSubView('bio')}
            className={`focus-ring inline-flex items-center gap-2 rounded-lg px-4 py-2 text-xs font-semibold transition ${
              activeSubView === 'bio'
                ? 'bg-teal-600 text-white shadow-sm'
                : 'border border-slate-200 bg-slate-50 text-slate-700 hover:bg-slate-100'
            }`}
          >
            <FileText size={14} />
            Professional Bio
          </button>

          <button
            type="button"
            onClick={() => setActiveSubView('linkedin')}
            className={`focus-ring inline-flex items-center gap-2 rounded-lg px-4 py-2 text-xs font-semibold transition ${
              activeSubView === 'linkedin'
                ? 'bg-teal-600 text-white shadow-sm'
                : 'border border-slate-200 bg-slate-50 text-slate-700 hover:bg-slate-100'
            }`}
          >
            <Sparkles size={14} />
            LinkedIn Optimizer
          </button>

          <button
            type="button"
            onClick={() => setActiveSubView('public')}
            className={`focus-ring inline-flex items-center gap-2 rounded-lg px-4 py-2 text-xs font-semibold transition ${
              activeSubView === 'public'
                ? 'bg-teal-600 text-white shadow-sm'
                : 'border border-slate-200 bg-slate-50 text-slate-700 hover:bg-slate-100'
            }`}
          >
            <Globe size={14} />
            Public Profile Link
          </button>
        </div>

        {activeSubView === 'projects' && !isAddingNew && !editingProject && (
          <button
            type="button"
            onClick={() => setIsAddingNew(true)}
            className="focus-ring inline-flex items-center gap-1.5 rounded-lg bg-teal-600 px-4 py-2 text-xs font-semibold text-white shadow-sm hover:bg-teal-700"
          >
            <Plus size={14} />
            Add Project
          </button>
        )}
      </div>

      {/* 3. Project Editor / Creation Modal */}
      {(isAddingNew || editingProject) && (
        <PortfolioProjectEditor
          project={editingProject}
          onSave={handleSaveProject}
          onCancel={() => {
            setIsAddingNew(false)
            setEditingProject(null)
          }}
        />
      )}

      {/* 4. SUB-VIEW A: Projects Showcase Grid */}
      {activeSubView === 'projects' && !isAddingNew && !editingProject && (
        <div>
          {projects.length === 0 ? (
            <div className="rounded-xl border border-slate-200 bg-white p-12 text-center shadow-sm">
              <Layers size={32} className="mx-auto text-slate-400" />
              <h4 className="mt-3 text-base font-bold text-slate-900">No Portfolio Projects Added Yet</h4>
              <p className="mt-1 text-xs text-slate-500">
                Showcase your applications, automation tools, open-source work, and case studies.
              </p>
              <button
                type="button"
                onClick={() => setIsAddingNew(true)}
                className="mt-4 inline-flex items-center gap-1.5 rounded-lg bg-teal-600 px-4 py-2 text-xs font-semibold text-white hover:bg-teal-700"
              >
                <Plus size={14} />
                Add Your First Project
              </button>
            </div>
          ) : (
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {projects.map((project) => (
                <PortfolioProjectCard
                  key={project.id}
                  project={project}
                  onEdit={(p) => setEditingProject(p)}
                  onDelete={(id) => deleteProject(id)}
                />
              ))}
            </div>
          )}
        </div>
      )}

      {/* 5. SUB-VIEW B: Professional Bio */}
      {activeSubView === 'bio' && (
        <ProfessionalBioSection
          bioOptions={bioOptions}
          currentBio={publicProfile?.bio}
          onSaveBio={handleSaveBio}
          isSaving={isSaving}
        />
      )}

      {/* 6. SUB-VIEW C: LinkedIn Optimizer */}
      {activeSubView === 'linkedin' && (
        <LinkedInOptimizer linkedInRecs={linkedInRecs} />
      )}

      {/* 7. SUB-VIEW D: Public Profile Preview & Publishing */}
      {activeSubView === 'public' && (
        <PublicProfilePreview
          publicProfile={publicProfile}
          profile={profile}
          skills={skills}
          experience={experience}
          education={education}
          projects={projects}
          onSaveSettings={savePublicSettings}
          isSaving={isSaving}
        />
      )}
    </div>
  )
}
