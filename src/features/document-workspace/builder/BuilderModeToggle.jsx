import { PencilRuler, UploadCloud } from 'lucide-react'

// Compact segmented control: choose between uploading content and building it
// automatically. Purely presentational — the parent owns the mode state.
export default function BuilderModeToggle({ mode, modes, onChange }) {
  const icons = { upload: UploadCloud, build: PencilRuler }

  return (
    <div className="inline-flex rounded-lg border border-slate-200 bg-slate-50 p-1" role="tablist" aria-label="Content mode">
      {modes.map((option) => {
        const active = mode === option.id
        const Icon = icons[option.id] || PencilRuler
        return (
          <button
            key={option.id}
            type="button"
            role="tab"
            aria-selected={active}
            onClick={() => onChange(option.id)}
            className={`focus-ring inline-flex min-h-9 items-center gap-2 rounded-md px-3 text-sm font-semibold transition ${
              active ? 'bg-white text-primary shadow-sm' : 'text-slate-500 hover:text-primary'
            }`}
          >
            <Icon size={15} aria-hidden="true" />
            {option.label}
          </button>
        )
      })}
    </div>
  )
}
