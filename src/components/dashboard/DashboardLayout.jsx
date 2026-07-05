import { useEffect } from 'react'
import Sidebar from './Sidebar.jsx'
import Topbar from './Topbar.jsx'
import { moduleNavItems } from './Sidebar.jsx'
import { navigateTo } from '../../utils/routes.js'
import { installScrollRestoration } from '../../utils/scrollRestoration.js'

export default function DashboardLayout({ children, title, eyebrow, showBack = false, currentView, workspaceStatus }) {
  // Install the app-wide scroll restoration manager once. It is a route-event
  // driven singleton (idempotent), so calling it from every DashboardLayout
  // mount is safe and it keeps working across page remounts and back/forward.
  useEffect(() => {
    installScrollRestoration()
  }, [])

  return (
    <main className="min-h-screen bg-lightBg font-sans text-slateText">
      <div className="flex min-h-screen lg:gap-4 lg:p-4">
        <Sidebar currentView={currentView} />
        <div className="min-w-0 flex-1 bg-white lg:overflow-hidden lg:rounded-xl lg:border lg:border-slate-200 lg:shadow-sm">
          <Topbar title={title} eyebrow={eyebrow} showBack={showBack} workspaceStatus={workspaceStatus} />
          <div className="border-b border-slate-200 bg-white px-4 py-3 lg:hidden">
            <div className="flex gap-2 overflow-x-auto">
              {moduleNavItems.map((item) => (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => navigateTo(item.path)}
                  className={`focus-ring inline-flex min-h-9 shrink-0 items-center rounded-md border px-3 text-sm font-semibold ${currentView === item.id ? 'border-accentTeal bg-accentTeal text-white' : 'border-slate-200 text-slate-600'}`}
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
