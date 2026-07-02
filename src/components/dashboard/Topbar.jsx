import { ArrowLeft, Bell, ShieldCheck } from 'lucide-react'
import { useWorkspace } from '../../hooks/useWorkspace.js'
import { navigateTo } from '../../utils/routes.js'
import UserMenu from './UserMenu.jsx'

function getWorkspaceBadge({ workspaceStatus, currentOrganization, source }) {
  if (workspaceStatus === 'empty_catalog') {
    return 'Empty catalog'
  }

  if (currentOrganization) {
    return `Workspace: ${currentOrganization.name}`
  }

  if (source === 'no_organization') {
    return 'No organization'
  }

  return 'Sample catalog'
}

export default function Topbar({ title, eyebrow, showBack = false, workspaceStatus }) {
  const { currentOrganization, source } = useWorkspace()
  const workspaceBadge = getWorkspaceBadge({ workspaceStatus, currentOrganization, source })

  return (
    <header className="sticky top-0 z-30 border-b border-slate-200 bg-lightBg/92 px-4 py-4 backdrop-blur sm:px-6">
      <div className="flex flex-col gap-4 xl:flex-row xl:items-center xl:justify-between">
        <div className="flex min-w-0 items-center gap-3">
          {showBack && (
            <button
              type="button"
              onClick={() => navigateTo('/dashboard')}
              className="focus-ring flex h-10 w-10 shrink-0 items-center justify-center rounded-md border border-slate-200 bg-white text-primary transition hover:bg-slate-50"
              aria-label="Back to dashboard"
            >
              <ArrowLeft size={18} aria-hidden="true" />
            </button>
          )}
          <div className="min-w-0">
            <p className="text-xs font-semibold uppercase tracking-[0.14em] text-accentBlue">{eyebrow}</p>
            <h1 className="mt-1 truncate text-2xl font-semibold text-primary sm:text-3xl">{title}</h1>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <div className="hidden min-h-10 items-center gap-2 rounded-md border border-slate-200 bg-white px-3 text-sm font-semibold text-slate-500 md:flex">
            <ShieldCheck size={17} aria-hidden="true" />
            <span>{workspaceBadge}</span>
          </div>
          <UserMenu compact />
          <button
            type="button"
            className="focus-ring flex h-10 w-10 items-center justify-center rounded-md border border-slate-200 bg-white text-slate-600 transition hover:text-primary"
            aria-label="Notifications"
          >
            <Bell size={18} aria-hidden="true" />
          </button>
        </div>
      </div>
    </header>
  )
}
