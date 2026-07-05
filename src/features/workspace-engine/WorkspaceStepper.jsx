import { CheckCircle2, Trash2 } from 'lucide-react'

export default function WorkspaceStepper({ steps, activeStep, completedSteps, onStepChange, canClear = false, onClear }) {
  return (
    <nav className="rounded-lg border border-slate-200 bg-white p-2.5 shadow-sm" aria-label="Workspace steps">
      <div className="flex flex-col gap-2.5 lg:flex-row lg:items-center lg:justify-between">
        <div className="flex gap-1.5 overflow-x-auto pb-1 lg:flex-wrap lg:overflow-visible lg:pb-0">
          {steps.map((step, index) => {
            const isActive = activeStep === index
            const isComplete = completedSteps[step.id]

            return (
              <button
                key={step.id}
                type="button"
                onClick={() => onStepChange(index)}
                className={`focus-ring inline-flex min-h-10 min-w-[136px] shrink-0 items-center gap-1.5 rounded-md border px-2.5 text-left text-xs font-bold shadow-sm transition ${
                  isActive
                    ? 'border-accentTeal bg-accentTeal text-white shadow-md shadow-teal-100 hover:bg-teal-800'
                    : isComplete
                      ? 'border-teal-200 bg-teal-50 text-teal-800 hover:border-teal-300 hover:bg-teal-100'
                      : 'border-slate-200 bg-white text-primary hover:border-slate-300 hover:bg-slate-50'
                }`}
              >
                <span className={`flex h-6 w-6 shrink-0 items-center justify-center rounded-md border text-[11px] font-black ${
                  isActive
                    ? 'border-white/20 bg-white/15 text-white'
                    : isComplete
                      ? 'border-teal-200 bg-white text-teal-700'
                      : 'border-slate-200 bg-slate-50 text-slate-600'
                }`}>
                  {index + 1}
                </span>
                {isComplete ? <CheckCircle2 size={14} className={isActive ? 'text-white' : 'text-accentTeal'} aria-hidden="true" /> : null}
                <span className="leading-tight">{step.label}</span>
              </button>
            )
          })}
        </div>
        <button
          type="button"
          onClick={onClear}
          disabled={!canClear}
          className="focus-ring inline-flex min-h-7 shrink-0 items-center justify-center gap-1.5 rounded-md border border-red-200 bg-red-50 px-2 text-[11px] font-semibold text-red-700 transition hover:bg-red-100 disabled:cursor-not-allowed disabled:border-slate-200 disabled:bg-slate-100 disabled:text-slate-400 disabled:opacity-60"
        >
          <Trash2 size={13} aria-hidden="true" />
          Clear files
        </button>
      </div>
    </nav>
  )
}
