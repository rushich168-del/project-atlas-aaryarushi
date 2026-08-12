import { useState } from 'react'
import { Globe, Lock, ExternalLink, Github, Building, MapPin, GraduationCap, Briefcase, Check, Copy, RefreshCw } from 'lucide-react'

export function PublicProfilePreview({ publicProfile, profile, skills, experience, education, projects, onSaveSettings, isSaving }) {
  const [slug, setSlug] = useState(publicProfile?.slug || 'aaryarushi')
  const [isPublished, setIsPublished] = useState(Boolean(publicProfile?.is_published))
  const [copiedUrl, setCopiedUrl] = useState(false)

  const publicUrl = `${window.location.origin}/career/p/${slug}`

  async function handleTogglePublish() {
    const nextState = !isPublished
    setIsPublished(nextState)
    await onSaveSettings({
      ...publicProfile,
      slug,
      is_published: nextState,
    })
  }

  async function handleSaveSlug() {
    await onSaveSettings({
      ...publicProfile,
      slug: slug.toLowerCase().replace(/[^a-z0-9-_]/g, ''),
      is_published: isPublished,
    })
  }

  function handleCopyLink() {
    navigator.clipboard.writeText(publicUrl)
    setCopiedUrl(true)
    setTimeout(() => setCopiedUrl(false), 2000)
  }

  const publicProjects = projects.filter((p) => p.is_public !== false)

  return (
    <div className="space-y-6">
      {/* 1. Publishing Configuration Bar */}
      <div className="flex flex-col gap-4 rounded-xl border border-slate-200 bg-white p-5 shadow-sm sm:flex-row sm:items-center sm:justify-between">
        <div>
          <div className="flex items-center gap-2">
            <span className={`inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-[10px] font-bold uppercase ${
              isPublished ? 'bg-emerald-100 text-emerald-800' : 'bg-slate-100 text-slate-700'
            }`}>
              {isPublished ? <Globe size={11} /> : <Lock size={11} />}
              {isPublished ? 'Publicly Published' : 'Private / Unpublished'}
            </span>
            <span className="text-xs text-slate-400">Explicit Publishing Control</span>
          </div>
          <p className="mt-1 text-xs text-slate-600">
            {isPublished
              ? 'Your portfolio is live. Only explicitly public projects are visible.'
              : 'Your portfolio is completely private. Turn on publishing to generate a public link.'}
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={handleTogglePublish}
            disabled={isSaving}
            className={`inline-flex items-center gap-1.5 rounded-lg px-4 py-2 text-xs font-bold transition shadow-sm ${
              isPublished
                ? 'border border-red-200 bg-red-50 text-red-700 hover:bg-red-100'
                : 'bg-emerald-600 text-white hover:bg-emerald-700'
            }`}
          >
            {isSaving && <RefreshCw size={13} className="animate-spin" />}
            {isPublished ? 'Unpublish Profile' : 'Publish Portfolio to Web'}
          </button>
        </div>
      </div>

      {/* 2. Custom Slug & Link Sharing */}
      {isPublished && (
        <div className="rounded-xl border border-teal-200 bg-teal-50/50 p-4">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex-1 flex items-center gap-2">
              <span className="text-xs font-semibold text-slate-600">Public URL:</span>
              <span className="rounded bg-white px-2.5 py-1 text-xs font-mono font-bold text-teal-900 border border-teal-200 select-all">
                {publicUrl}
              </span>
            </div>

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={handleCopyLink}
                className="inline-flex items-center gap-1 rounded-lg bg-teal-600 px-3 py-1.5 text-xs font-semibold text-white hover:bg-teal-700 shadow-sm"
              >
                {copiedUrl ? <Check size={13} /> : <Copy size={13} />}
                {copiedUrl ? 'Copied Link' : 'Copy Link'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 3. Live Public Profile Layout Preview */}
      <div className="rounded-2xl border border-slate-200 bg-white p-8 shadow-sm">
        <div className="border-b border-slate-100 pb-6">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
            <div>
              <h2 className="text-2xl font-black text-slate-900">{profile.full_name || 'Aarya Rushi'}</h2>
              <p className="mt-1 text-sm font-bold text-teal-700">
                {publicProfile?.headline || profile.headline || profile.target_role || 'Senior Full Stack Engineer'}
              </p>
              {(publicProfile?.location || profile.location) && (
                <div className="mt-2 flex items-center gap-1.5 text-xs text-slate-500">
                  <MapPin size={13} className="text-slate-400" />
                  <span>{publicProfile?.location || profile.location}</span>
                </div>
              )}
            </div>

            <div className="flex items-center gap-2">
              {publicProfile?.custom_links?.map((link, idx) => (
                <a
                  key={idx}
                  href={link.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="rounded-lg border border-slate-200 bg-slate-50 px-3 py-1.5 text-xs font-semibold text-slate-700 hover:bg-slate-100"
                >
                  {link.title}
                </a>
              ))}
            </div>
          </div>

          <p className="mt-4 text-xs leading-6 text-slate-600 max-w-3xl">
            {publicProfile?.bio || profile.summary || 'Professional software engineer dedicated to building resilient systems.'}
          </p>
        </div>

        {/* Skills Section */}
        {skills && skills.length > 0 && (
          <div className="mt-6 border-b border-slate-100 pb-6">
            <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400">Core Competencies</h4>
            <div className="mt-3 flex flex-wrap gap-1.5">
              {skills.map((skill, idx) => (
                <span
                  key={idx}
                  className="rounded-lg border border-slate-200 bg-slate-50 px-3 py-1 text-xs font-medium text-slate-800"
                >
                  {skill.name} • <span className="text-slate-500">{skill.proficiency}</span>
                </span>
              ))}
            </div>
          </div>
        )}

        {/* Featured Projects Section */}
        <div className="mt-6 border-b border-slate-100 pb-6">
          <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400">Featured Projects</h4>
          <div className="mt-4 grid gap-4 sm:grid-cols-2">
            {publicProjects.map((p) => (
              <div key={p.id} className="rounded-xl border border-slate-200 bg-slate-50/50 p-4">
                <div className="flex items-center justify-between">
                  <span className="rounded bg-teal-100 px-2 py-0.5 text-[10px] font-bold text-teal-800 uppercase">
                    {p.project_type}
                  </span>
                  {p.project_url && (
                    <a
                      href={p.project_url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-xs font-semibold text-teal-700 hover:underline inline-flex items-center gap-1"
                    >
                      Demo <ExternalLink size={11} />
                    </a>
                  )}
                </div>
                <h5 className="mt-2 text-sm font-bold text-slate-900">{p.title}</h5>
                <p className="mt-1 text-xs leading-5 text-slate-600 line-clamp-2">{p.short_description}</p>
              </div>
            ))}
          </div>
        </div>

        {/* Experience Highlights */}
        {experience && experience.length > 0 && (
          <div className="mt-6 border-b border-slate-100 pb-6">
            <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400">Professional Experience</h4>
            <div className="mt-3 space-y-3">
              {experience.map((exp, idx) => (
                <div key={idx} className="flex items-start justify-between text-xs">
                  <div>
                    <h5 className="font-bold text-slate-900">{exp.title}</h5>
                    <p className="text-slate-600">{exp.company} • {exp.location}</p>
                    {exp.achievements && <p className="mt-1 text-[11px] text-slate-500">{exp.achievements}</p>}
                  </div>
                  <span className="text-[11px] font-medium text-slate-400">
                    {exp.start_date} – {exp.is_current ? 'Present' : exp.end_date}
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Education */}
        {education && education.length > 0 && (
          <div className="mt-6">
            <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400">Education & Qualifications</h4>
            <div className="mt-3 space-y-2">
              {education.map((edu, idx) => (
                <div key={idx} className="flex items-center justify-between text-xs">
                  <div>
                    <span className="font-bold text-slate-900">{edu.degree} in {edu.field_of_study}</span>
                    <p className="text-slate-500">{edu.institution}</p>
                  </div>
                  <span className="text-[11px] text-slate-400">{edu.graduation_year}</span>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
