import { ArrowLeft, ArrowRight, Save } from 'lucide-react'

export default function WorkspaceFooter({ activeStep, totalSteps, canSave, saving, saveLabel = 'Save Workspace', onBack, onNext, onSave }) {
  const isLastStep = activeStep === totalSteps - 1

  return (
    <footer className="mt-4 flex flex-col gap-3 rounded-lg border border-slate-200 bg-white p-3.5 shadow-sm sm:flex-row sm:items-center sm:justify-between">
      <button
        type="button"
        onClick={onBack}
        disabled={activeStep === 0}
        className="focus-ring inline-flex min-h-10 items-center justify-center gap-2 rounded-md border border-slate-200 bg-white px-4 text-sm font-semibold text-slate-600 transition hover:text-primary disabled:cursor-not-allowed disabled:opacity-50"
      >
        <ArrowLeft size={16} aria-hidden="true" />
        Back
      </button>

      <div className="flex flex-col gap-3 sm:flex-row">
        <button
          type="button"
          onClick={onSave}
          disabled={!canSave || saving}
          className="focus-ring inline-flex min-h-9 items-center justify-center gap-2 rounded-md bg-accentTeal px-3 text-sm font-semibold text-white transition hover:bg-teal-800 disabled:cursor-not-allowed disabled:bg-slate-100 disabled:text-slate-400 disabled:opacity-60"
        >
          <Save size={16} aria-hidden="true" />
          {saving ? 'Saving' : saveLabel}
        </button>
        {!isLastStep && (
          <button
            type="button"
            onClick={onNext}
            className="focus-ring inline-flex min-h-10 items-center justify-center gap-2 rounded-md border border-slate-200 bg-white px-4 text-sm font-semibold text-slate-600 transition hover:text-primary"
          >
            Next
            <ArrowRight size={16} aria-hidden="true" />
          </button>
        )}
      </div>
    </footer>
  )
}
