import { Sparkles, Check, X, RotateCcw, ArrowRight } from 'lucide-react'

export function TailoredBulletsSection({ bullets = [], onUpdateStatus, onRegenerate }) {
  if (bullets.length === 0) {
    return (
      <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
        <div className="flex items-center justify-between border-b border-slate-100 pb-3">
          <div>
            <h4 className="text-sm font-bold text-slate-900">Tailored Resume Bullets</h4>
            <p className="text-xs text-slate-500">Active phrasing improvements derived exclusively from your existing profile history.</p>
          </div>
        </div>
        <p className="mt-4 text-xs text-slate-400 italic">
          No experience achievements found on profile. Add work achievements in Career Profile to receive tailored phrasing suggestions.
        </p>
      </div>
    )
  }

  return (
    <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
      <div className="flex items-center justify-between border-b border-slate-100 pb-3">
        <div>
          <div className="flex items-center gap-2">
            <h4 className="text-sm font-bold text-slate-900">Tailored Resume Bullets</h4>
            <span className="rounded bg-slate-100 px-2 py-0.5 text-[10px] font-bold text-slate-600">
              Suggested wording
            </span>
          </div>
          <p className="text-xs text-slate-500">
            Active-voice phrasing traceable strictly to your verified experience records. Never hallucinates unverified metrics.
          </p>
        </div>

        <button
          type="button"
          onClick={onRegenerate}
          className="inline-flex items-center gap-1 rounded-lg border border-slate-200 px-2.5 py-1 text-xs font-semibold text-slate-600 hover:bg-slate-50 transition"
          title="Reset bullet suggestions"
        >
          <RotateCcw size={12} />
          Reset All
        </button>
      </div>

      <div className="mt-4 space-y-3">
        {bullets.map((bullet) => (
          <div
            key={bullet.id}
            className={`rounded-lg border p-4 transition ${
              bullet.status === 'used'
                ? 'border-emerald-200 bg-emerald-50/50'
                : bullet.status === 'discarded'
                ? 'border-slate-200 bg-slate-50 opacity-60'
                : 'border-slate-200 bg-white shadow-2xs'
            }`}
          >
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-bold text-slate-800">
                {bullet.roleTitle} • <span className="text-slate-500 font-normal">{bullet.company}</span>
              </span>
              <span className={`text-[10px] font-bold uppercase rounded px-1.5 py-0.5 ${
                bullet.status === 'used'
                  ? 'bg-emerald-100 text-emerald-800'
                  : bullet.status === 'discarded'
                  ? 'bg-slate-200 text-slate-600'
                  : 'bg-teal-50 text-teal-700'
              }`}>
                {bullet.status === 'used' ? 'Selected for Resume' : bullet.status === 'discarded' ? 'Discarded' : 'Suggestion'}
              </span>
            </div>

            {/* Original vs Suggested */}
            <div className="mt-2.5 space-y-1.5 text-xs">
              <div className="rounded border border-slate-100 bg-slate-50 p-2 text-slate-500 line-through">
                <span className="font-semibold text-[10px] uppercase block text-slate-400 not-italic">Original text:</span>
                {bullet.original}
              </div>
              <div className="rounded border border-teal-100 bg-teal-50/60 p-2 font-medium text-slate-800">
                <span className="font-bold text-[10px] uppercase block text-teal-700">Suggested phrasing:</span>
                {bullet.suggested}
              </div>
            </div>

            {/* Action Buttons */}
            <div className="mt-3 flex items-center justify-end gap-2 border-t border-slate-100 pt-2.5">
              {bullet.status !== 'used' && (
                <button
                  type="button"
                  onClick={() => onUpdateStatus(bullet.id, 'used')}
                  className="inline-flex items-center gap-1 rounded bg-teal-600 px-2.5 py-1 text-[11px] font-bold text-white hover:bg-teal-700 transition"
                >
                  <Check size={12} />
                  Use Phrasing
                </button>
              )}
              {bullet.status !== 'discarded' && (
                <button
                  type="button"
                  onClick={() => onUpdateStatus(bullet.id, 'discarded')}
                  className="inline-flex items-center gap-1 rounded border border-slate-200 px-2 py-1 text-[11px] font-semibold text-slate-500 hover:bg-slate-100 transition"
                >
                  <X size={12} />
                  Discard
                </button>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
