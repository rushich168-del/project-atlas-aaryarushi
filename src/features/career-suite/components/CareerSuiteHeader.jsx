import { Sparkles } from 'lucide-react'

export function CareerSuiteHeader({ children }) {
  return (
    <section className="rounded-xl border border-slate-200 bg-gradient-to-r from-slate-900 via-slate-800 to-teal-950 p-6 text-white shadow-md">
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div className="max-w-3xl">
          <div className="inline-flex items-center gap-2 rounded-full border border-teal-500/30 bg-teal-500/10 px-3 py-1 text-xs font-semibold text-teal-300">
            <Sparkles size={14} />
            Career Platform Suite — Integrated Workspace
          </div>
          <h2 className="mt-3 text-2xl font-bold tracking-tight sm:text-3xl">
            One Integrated Career Workspace
          </h2>
          <p className="mt-2 text-sm leading-6 text-slate-300">
            Build your professional profile, craft target job applications, explore opportunities, elevate skills, and showcase your portfolio — all inside one unified system.
          </p>
        </div>
        <div className="shrink-0 rounded-lg border border-slate-700 bg-slate-800/80 p-4 text-center">
          <p className="text-xs font-semibold uppercase tracking-wider text-slate-400">Readiness Score</p>
          <p className="mt-1 text-3xl font-extrabold text-teal-400">85<span className="text-lg text-slate-400">/100</span></p>
          <span className="mt-1 inline-block rounded border border-teal-500/30 bg-teal-500/20 px-2 py-0.5 text-[11px] font-semibold text-teal-300">
            Planning Blueprint
          </span>
        </div>
      </div>
      {children}
    </section>
  )
}
