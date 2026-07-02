import Sidebar from './Sidebar.jsx'
import Topbar from './Topbar.jsx'
import { moduleNavItems } from './Sidebar.jsx'
import { navigateTo } from '../../utils/routes.js'

export default function DashboardLayout({ children, title, eyebrow, showBack = false, currentView, workspaceStatus }) {
  return (
    <main className="min-h-screen bg-lightBg font-sans text-slateText">
      <div className="flex min-h-screen">
        <Sidebar currentView={currentView} />
        <div className="min-w-0 flex-1">
          <Topbar title={title} eyebrow={eyebrow} showBack={showBack} workspaceStatus={workspaceStatus} />
          <div className="border-b border-slate-200 bg-white px-4 py-3 lg:hidden">
            <div className="flex gap-2 overflow-x-auto">
              {moduleNavItems.map((item) => (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => navigateTo(item.path)}
                  className={`focus-ring inline-flex min-h-9 shrink-0 items-center rounded-md border px-3 text-sm font-semibold ${currentView === item.id ? 'border-primary bg-primary text-white' : 'border-slate-200 text-slate-600'}`}
                >
                  {item.label}
                </button>
              ))}
            </div>
          </div>
          {children}
        </div>
      </div>
    </main>
  )
}
