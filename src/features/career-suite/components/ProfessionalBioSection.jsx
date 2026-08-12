import { useState, useEffect } from 'react'
import { FileText, Copy, Check, Sparkles, Save, RefreshCw } from 'lucide-react'

export function ProfessionalBioSection({ bioOptions, currentBio, onSaveBio, isSaving }) {
  const [activePreset, setActivePreset] = useState('technicalLeader')
  const [bioText, setBioText] = useState(currentBio || bioOptions.technicalLeader)
  const [copied, setCopied] = useState(false)
  const [savedSuccess, setSavedSuccess] = useState(false)

  useEffect(() => {
    if (currentBio) {
      setBioText(currentBio)
    } else if (bioOptions[activePreset]) {
      setBioText(bioOptions[activePreset])
    }
  }, [currentBio, activePreset, bioOptions])

  function handleSelectPreset(presetKey) {
    setActivePreset(presetKey)
    setBioText(bioOptions[presetKey] || '')
  }

  function handleCopy() {
    navigator.clipboard.writeText(bioText)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  async function handleSave() {
    setSavedSuccess(false)
    await onSaveBio(bioText)
    setSavedSuccess(true)
    setTimeout(() => setSavedSuccess(false), 3000)
  }

  return (
    <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
      <div className="flex flex-col gap-2 border-b border-slate-100 pb-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h3 className="text-base font-bold text-slate-900">Professional Bio Workspace</h3>
          <p className="text-xs text-slate-500">
            Synthesized from your primary Career Profile, Skills, and Experience records.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={handleCopy}
            className="inline-flex items-center gap-1.5 rounded-lg border border-slate-200 bg-slate-50 px-3 py-1.5 text-xs font-semibold text-slate-700 hover:bg-slate-100"
          >
            {copied ? <Check size={13} className="text-emerald-600" /> : <Copy size={13} />}
            {copied ? 'Copied' : 'Copy Bio'}
          </button>

          <button
            type="button"
            onClick={handleSave}
            disabled={isSaving}
            className="inline-flex items-center gap-1.5 rounded-lg bg-teal-600 px-3.5 py-1.5 text-xs font-semibold text-white shadow-sm hover:bg-teal-700 disabled:opacity-50"
          >
            {isSaving ? <RefreshCw size={13} className="animate-spin" /> : <Save size={13} />}
            {savedSuccess ? 'Saved to Profile!' : 'Save as Active Bio'}
          </button>
        </div>
      </div>

      {/* Preset Pickers */}
      <div className="mt-4 flex flex-wrap items-center gap-2">
        <span className="text-[11px] font-semibold text-slate-500">Draft Perspectives:</span>
        <button
          type="button"
          onClick={() => handleSelectPreset('technicalLeader')}
          className={`rounded-lg px-3 py-1 text-xs font-semibold transition ${
            activePreset === 'technicalLeader'
              ? 'bg-teal-50 text-teal-800 border border-teal-300'
              : 'border border-slate-200 bg-slate-50 text-slate-600 hover:bg-slate-100'
          }`}
        >
          Technical Lead
        </button>
        <button
          type="button"
          onClick={() => handleSelectPreset('productEngineer')}
          className={`rounded-lg px-3 py-1 text-xs font-semibold transition ${
            activePreset === 'productEngineer'
              ? 'bg-teal-50 text-teal-800 border border-teal-300'
              : 'border border-slate-200 bg-slate-50 text-slate-600 hover:bg-slate-100'
          }`}
        >
          Product Engineer
        </button>
        <button
          type="button"
          onClick={() => handleSelectPreset('conciseSummary')}
          className={`rounded-lg px-3 py-1 text-xs font-semibold transition ${
            activePreset === 'conciseSummary'
              ? 'bg-teal-50 text-teal-800 border border-teal-300'
              : 'border border-slate-200 bg-slate-50 text-slate-600 hover:bg-slate-100'
          }`}
        >
          Concise Executive
        </button>
      </div>

      {/* Bio Editor Area */}
      <div className="mt-4">
        <textarea
          rows={5}
          value={bioText}
          onChange={(e) => setBioText(e.target.value)}
          className="w-full rounded-xl border border-slate-200 p-4 text-xs leading-6 text-slate-800 outline-none focus:border-teal-500 focus:ring-1 focus:ring-teal-500"
          placeholder="Craft your professional narrative..."
        />
        <div className="mt-2 flex items-center justify-between text-[11px] text-slate-400">
          <span>{bioText.length} characters • {bioText.split(/\s+/).filter(Boolean).length} words</span>
          <span>Used in public portfolio and recruiter previews</span>
        </div>
      </div>
    </div>
  )
}
