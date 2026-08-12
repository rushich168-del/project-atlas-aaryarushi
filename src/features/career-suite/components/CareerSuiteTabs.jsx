import { Compass, UserCheck, FileText, Search, BrainCircuit, Award } from 'lucide-react'

export const tabs = [
  { id: 'overview', label: 'Command Center', icon: Compass },
  { id: 'profile', label: 'Career Profile', icon: UserCheck },
  { id: 'resume', label: 'Resume Builder', icon: FileText },
  { id: 'jobs', label: 'Jobs & Pipeline', icon: Search },
  { id: 'skills', label: 'Skills & Interview', icon: BrainCircuit },
  { id: 'portfolio', label: 'Career Portfolio', icon: Award },
]

export function CareerSuiteTabs({ activeTab, onSelectTab }) {
  return (
    <div className="mt-6 flex flex-wrap gap-2 border-t border-slate-700/80 pt-4">
      {tabs.map((tab) => {
        const Icon = tab.icon
        const isActive = activeTab === tab.id
        return (
          <button
            key={tab.id}
            type="button"
            onClick={() => onSelectTab(tab.id)}
            className={`focus-ring inline-flex items-center gap-2 rounded-lg px-3.5 py-2 text-sm font-semibold transition ${
              isActive
                ? 'bg-teal-500 text-white shadow-sm'
                : 'bg-slate-800/60 text-slate-300 hover:bg-slate-700/80 hover:text-white'
            }`}
          >
            <Icon size={16} />
            {tab.label}
          </button>
        )
      })}
    </div>
  )
}
