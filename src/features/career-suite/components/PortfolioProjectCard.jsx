import { ExternalLink, Github, Star, Edit3, Trash2, Globe, Lock } from 'lucide-react'

export function PortfolioProjectCard({ project, onEdit, onDelete }) {
  return (
    <div className="flex flex-col justify-between rounded-xl border border-slate-200 bg-white p-5 shadow-sm transition hover:border-teal-500/50 hover:shadow-md">
      <div>
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-1.5 flex-wrap">
            <span className="rounded border border-teal-200 bg-teal-50 px-2 py-0.5 text-[10px] font-bold text-teal-700 uppercase">
              {project.project_type || 'Full Stack App'}
            </span>
            {project.featured && (
              <span className="inline-flex items-center gap-1 rounded border border-amber-200 bg-amber-50 px-2 py-0.5 text-[10px] font-bold text-amber-700 uppercase">
                <Star size={10} className="fill-amber-500 text-amber-500" />
                Featured
              </span>
            )}
            <span className={`inline-flex items-center gap-1 rounded border px-1.5 py-0.5 text-[9px] font-bold uppercase ${
              project.is_public !== false
                ? 'border-emerald-200 bg-emerald-50 text-emerald-700'
                : 'border-slate-200 bg-slate-100 text-slate-600'
            }`}>
              {project.is_public !== false ? <Globe size={9} /> : <Lock size={9} />}
              {project.is_public !== false ? 'Public' : 'Private'}
            </span>
          </div>

          <div className="flex items-center gap-1">
            <button
              type="button"
              onClick={() => onEdit(project)}
              className="rounded p-1 text-slate-400 hover:bg-slate-100 hover:text-slate-700"
              title="Edit Project"
            >
              <Edit3 size={14} />
            </button>
            <button
              type="button"
              onClick={() => onDelete(project.id)}
              className="rounded p-1 text-slate-400 hover:bg-red-50 hover:text-red-600"
              title="Delete Project"
            >
              <Trash2 size={14} />
            </button>
          </div>
        </div>

        <h4 className="mt-2.5 text-base font-bold text-slate-900">{project.title}</h4>
        {project.role && <p className="text-xs font-semibold text-teal-800">{project.role}</p>}

        <p className="mt-2 text-xs leading-5 text-slate-600">
          {project.short_description || project.detailed_description}
        </p>

        {project.achievements && (
          <p className="mt-2 rounded bg-slate-50 p-2 text-[11px] font-medium text-slate-700 border-l-2 border-teal-500">
            <span className="font-bold text-slate-900">Impact: </span>{project.achievements}
          </p>
        )}

        {project.technologies && project.technologies.length > 0 && (
          <div className="mt-3 flex flex-wrap gap-1">
            {project.technologies.map((tech, idx) => (
              <span
                key={idx}
                className="rounded border border-slate-200 bg-slate-50 px-2 py-0.5 text-[10px] font-medium text-slate-700"
              >
                {tech}
              </span>
            ))}
          </div>
        )}
      </div>

      <div className="mt-5 flex items-center gap-2 border-t border-slate-100 pt-3">
        {project.project_url && (
          <a
            href={project.project_url}
            target="_blank"
            rel="noopener noreferrer"
            className="flex-1 inline-flex items-center justify-center gap-1.5 rounded-lg bg-teal-600 py-1.5 text-xs font-semibold text-white shadow-sm transition hover:bg-teal-700"
          >
            <ExternalLink size={13} />
            Live Demo
          </a>
        )}

        {project.repository_url && (
          <a
            href={project.repository_url}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center justify-center gap-1.5 rounded-lg border border-slate-200 bg-slate-50 px-3 py-1.5 text-xs font-semibold text-slate-700 hover:bg-slate-100"
          >
            <Github size={13} />
            Code Repo
          </a>
        )}
      </div>
    </div>
  )
}
