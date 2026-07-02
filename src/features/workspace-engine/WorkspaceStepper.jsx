import { CheckCircle2 } from 'lucide-react'

export default function WorkspaceStepper({ steps, activeStep, completedSteps, onStepChange }) {
  return (
    <nav className="rounded-lg border border-slate-200 bg-white p-3 shadow-sm">
      <div className="flex gap-2 overflow-x-auto">
        {steps.map((step, index) => {
          const isActive = activeStep === index
          const isComplete = completedSteps[step.id]

          return (
            <button
              key={step.id}
              type="button"
              onClick={() => onStepChange(index)}
              className={`focus-ring inline-flex min-h-11 shrink-0 items-center gap-2 rounded-md border px-3 text-sm font-semibold transition ${
                isActive
                  ? 'border-primary bg-primary text-white'
                  : 'border-slate-200 bg-white text-slate-600 hover:border-slate-300 hover:text-primary'
              }`}
            >
              {isComplete ? <CheckCircle2 size={16} className={isActive ? 'text-white' : 'text-accentTeal'} aria-hidden="true" /> : null}
              {step.label}
            </button>
          )
        })}
      </div>
    </nav>
  )
}
