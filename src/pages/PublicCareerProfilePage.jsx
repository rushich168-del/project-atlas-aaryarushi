import { useEffect, useState } from 'react'
import {
  Briefcase,
  ExternalLink,
  Github,
  MapPin,
  GraduationCap,
  Sparkles,
  Layers,
  ArrowLeft,
  CheckCircle2,
  Lock,
  Loader2,
  Share2,
  Printer,
  Globe,
} from 'lucide-react'
import { fetchPublishedPublicProfile } from '../services/portfolioService.js'
import { navigateTo } from '../utils/routes.js'

export default function PublicCareerProfilePage({ slug }) {
  const [data, setData] = useState(null)
  const [loading, setLoading] = useState(true)
  const [copiedLink, setCopiedLink] = useState(false)

  useEffect(() => {
    async function loadPublic() {
      setLoading(true)
      try {
        const res = await fetchPublishedPublicProfile(slug)
        setData(res)
      } catch (err) {
        setData({ status: 'not_found' })
      } finally {
        setLoading(false)
      }
    }
    loadPublic()
  }, [slug])

  function handleShare() {
    navigator.clipboard.writeText(window.location.href)
    setCopiedLink(true)
    setTimeout(() => setCopiedLink(false), 2000)
  }

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-slate-50 px-4">
        <div className="flex items-center gap-3 text-slate-600">
          <Loader2 size={28} className="animate-spin text-teal-600" />
          <span className="text-sm font-semibold">Loading Career Profile...</span>
        </div>
      </div>
    )
  }

  if (!data || data.status !== 'published') {
    return (
      <div className="flex min-h-screen items-center justify-center bg-slate-50 px-4">
        <div className="max-w-md rounded-2xl border border-slate-200 bg-white p-8 text-center shadow-lg">
          <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-slate-100 text-slate-500">
            <Lock size={22} />
          </div>
          <h2 className="mt-4 text-lg font-bold text-slate-900">Career Profile Unavailable</h2>
          <p className="mt-2 text-xs leading-5 text-slate-600">
            The profile for <span className="font-mono font-semibold text-slate-800">@{slug}</span> is currently private, unpublished, or does not exist.
          </p>
          <div className="mt-6">
            <button
              type="button"
              onClick={() => navigateTo('/')}
              className="inline-flex items-center gap-1.5 rounded-lg bg-teal-600 px-4 py-2 text-xs font-semibold text-white transition hover:bg-teal-700 shadow-sm"
            >
              <ArrowLeft size={14} />
              Return to Project Atlas Home
            </button>
          </div>
        </div>
      </div>
    )
  }

  const { profile, skills, experience, education, projects } = data

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900">
      {/* Top Recruiter Nav */}
      <header className="sticky top-0 z-20 border-b border-slate-200/80 bg-white/90 backdrop-blur-md">
        <div className="mx-auto flex max-w-5xl items-center justify-between px-4 py-3 sm:px-6">
          <button
            type="button"
            onClick={() => navigateTo('/')}
            className="flex items-center gap-2 text-xs font-bold text-teal-800 hover:text-teal-900"
          >
            <span className="flex h-6 w-6 items-center justify-center rounded-md bg-teal-600 text-white font-extrabold text-[11px]">
              A
            </span>
            <span>AaryaRushi Automation Labs</span>
          </button>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={handleShare}
              className="inline-flex items-center gap-1.5 rounded-lg border border-slate-200 bg-slate-50 px-3 py-1.5 text-xs font-semibold text-slate-700 hover:bg-slate-100"
            >
              <Share2 size={13} />
              {copiedLink ? 'Link Copied!' : 'Share Profile'}
            </button>
            <button
              type="button"
              onClick={() => window.print()}
              className="hidden sm:inline-flex items-center gap-1.5 rounded-lg bg-teal-600 px-3.5 py-1.5 text-xs font-semibold text-white shadow-sm hover:bg-teal-700"
            >
              <Printer size={13} />
              Print Portfolio
            </button>
          </div>
        </div>
      </header>

      {/* Main Public Profile Content */}
      <main className="mx-auto max-w-5xl px-4 py-8 sm:px-6 space-y-8">
        {/* 1. Hero Card */}
        <section className="rounded-2xl border border-slate-200 bg-white p-6 sm:p-8 shadow-sm">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between border-b border-slate-100 pb-6">
            <div>
              <div className="inline-flex items-center gap-1.5 rounded-full bg-teal-50 px-3 py-0.5 text-[11px] font-bold text-teal-800 border border-teal-200">
                <CheckCircle2 size={12} className="text-teal-600" />
                Verified Candidate Profile
              </div>
              <h1 className="mt-3 text-2xl sm:text-3xl font-black text-slate-900">{profile.full_name}</h1>
              <p className="mt-1 text-sm sm:text-base font-bold text-teal-700">{profile.headline}</p>

              {profile.location && (
                <div className="mt-2 flex items-center gap-1.5 text-xs text-slate-500">
                  <MapPin size={13} className="text-slate-400" />
                  <span>{profile.location}</span>
                </div>
              )}
            </div>

            {profile.custom_links && profile.custom_links.length > 0 && (
              <div className="flex flex-wrap items-center gap-2">
                {profile.custom_links.map((link, idx) => (
                  <a
                    key={idx}
                    href={link.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1 rounded-lg border border-slate-200 bg-slate-50 px-3 py-1.5 text-xs font-semibold text-slate-700 hover:bg-teal-50 hover:text-teal-800"
                  >
                    <span>{link.title}</span>
                    <ExternalLink size={11} />
                  </a>
                ))}
              </div>
            )}
          </div>

          {profile.bio && (
            <div className="mt-6">
              <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400">Professional Bio</h3>
              <p className="mt-2 text-xs sm:text-sm leading-6 text-slate-700 max-w-4xl">
                {profile.bio}
              </p>
            </div>
          )}
        </section>

        {/* 2. Skills Competencies */}
        {skills && skills.length > 0 && (
          <section className="rounded-2xl border border-slate-200 bg-white p-6 sm:p-8 shadow-sm">
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400">Core Technical Competencies</h3>
            <div className="mt-4 flex flex-wrap gap-2">
              {skills.map((skill, idx) => (
                <div
                  key={idx}
                  className="inline-flex items-center gap-1.5 rounded-xl border border-slate-200 bg-slate-50 px-3.5 py-1.5 text-xs font-semibold text-slate-800"
                >
                  <span>{skill.name}</span>
                  <span className="rounded bg-teal-100 px-1.5 py-0.2 text-[10px] font-bold text-teal-800">
                    {skill.proficiency}
                  </span>
                </div>
              ))}
            </div>
          </section>
        )}

        {/* 3. Featured Projects Showcase */}
        {projects && projects.length > 0 && (
          <section className="rounded-2xl border border-slate-200 bg-white p-6 sm:p-8 shadow-sm">
            <div className="flex items-center justify-between border-b border-slate-100 pb-4">
              <div>
                <h3 className="text-base font-bold text-slate-900">Featured Systems & Projects</h3>
                <p className="text-xs text-slate-500">Production web applications, automation tools, and technical architectures.</p>
              </div>
              <span className="rounded-full bg-teal-50 px-2.5 py-0.5 text-[11px] font-bold text-teal-700 border border-teal-200">
                {projects.length} Showcases
              </span>
            </div>

            <div className="mt-6 grid gap-6 sm:grid-cols-2">
              {projects.map((project) => (
                <div
                  key={project.id}
                  className="flex flex-col justify-between rounded-xl border border-slate-200 bg-slate-50/60 p-5 transition hover:bg-white hover:shadow-md"
                >
                  <div>
                    <div className="flex items-center justify-between">
                      <span className="rounded bg-teal-100 px-2 py-0.5 text-[10px] font-bold text-teal-800 uppercase">
                        {project.project_type || 'Full Stack App'}
                      </span>
                      {project.role && (
                        <span className="text-[11px] font-semibold text-slate-500">{project.role}</span>
                      )}
                    </div>

                    <h4 className="mt-2.5 text-base font-bold text-slate-900">{project.title}</h4>
                    <p className="mt-1.5 text-xs leading-5 text-slate-600">
                      {project.short_description || project.detailed_description}
                    </p>

                    {project.achievements && (
                      <p className="mt-2 rounded bg-white p-2 text-[11px] font-medium text-slate-700 border-l-2 border-teal-500 shadow-2xs">
                        <span className="font-bold text-slate-900">Impact: </span>{project.achievements}
                      </p>
                    )}

                    {project.technologies && project.technologies.length > 0 && (
                      <div className="mt-3 flex flex-wrap gap-1">
                        {project.technologies.map((tech, idx) => (
                          <span
                            key={idx}
                            className="rounded border border-slate-200 bg-white px-2 py-0.5 text-[10px] font-medium text-slate-700"
                          >
                            {tech}
                          </span>
                        ))}
                      </div>
                    )}
                  </div>

                  <div className="mt-5 flex items-center gap-2 border-t border-slate-200/60 pt-3">
                    {project.project_url && (
                      <a
                        href={project.project_url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex-1 inline-flex items-center justify-center gap-1.5 rounded-lg bg-teal-600 py-1.5 text-xs font-semibold text-white transition hover:bg-teal-700 shadow-2xs"
                      >
                        <ExternalLink size={12} />
                        Live Demo
                      </a>
                    )}
                    {project.repository_url && (
                      <a
                        href={project.repository_url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center justify-center gap-1.5 rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-xs font-semibold text-slate-700 hover:bg-slate-100"
                      >
                        <Github size={12} />
                        Source
                      </a>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </section>
        )}

        {/* 4. Professional Experience */}
        {experience && experience.length > 0 && (
          <section className="rounded-2xl border border-slate-200 bg-white p-6 sm:p-8 shadow-sm">
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400">Professional Experience</h3>
            <div className="mt-6 space-y-6">
              {experience.map((exp, idx) => (
                <div key={idx} className="relative pl-6 border-l-2 border-teal-500/40">
                  <div className="absolute -left-[5px] top-1.5 h-2 w-2 rounded-full bg-teal-600" />
                  <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between">
                    <h4 className="text-sm font-bold text-slate-900">{exp.title}</h4>
                    <span className="text-[11px] font-medium text-slate-400">
                      {exp.start_date} – {exp.is_current ? 'Present' : exp.end_date}
                    </span>
                  </div>
                  <p className="text-xs font-semibold text-teal-800">{exp.company} • {exp.location}</p>
                  {exp.achievements && (
                    <p className="mt-2 text-xs leading-5 text-slate-600">{exp.achievements}</p>
                  )}
                </div>
              ))}
            </div>
          </section>
        )}

        {/* 5. Education */}
        {education && education.length > 0 && (
          <section className="rounded-2xl border border-slate-200 bg-white p-6 sm:p-8 shadow-sm">
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400">Education & Degrees</h3>
            <div className="mt-4 grid gap-4 sm:grid-cols-2">
              {education.map((edu, idx) => (
                <div key={idx} className="rounded-xl border border-slate-200 bg-slate-50 p-4">
                  <div className="flex items-center gap-2">
                    <GraduationCap size={16} className="text-teal-700" />
                    <span className="font-bold text-xs text-slate-900">{edu.degree}</span>
                  </div>
                  <p className="mt-1 text-xs text-slate-600">{edu.field_of_study}</p>
                  <div className="mt-2 flex items-center justify-between text-[11px] text-slate-500 border-t border-slate-200/60 pt-2">
                    <span>{edu.institution}</span>
                    <span className="font-semibold">{edu.graduation_year}</span>
                  </div>
                </div>
              ))}
            </div>
          </section>
        )}
      </main>

      {/* Public Footer */}
      <footer className="border-t border-slate-200 bg-white py-6 text-center text-xs text-slate-400">
        <p>Verified Candidate Career Profile • Powered by AaryaRushi Automation Labs</p>
      </footer>
    </div>
  )
}
