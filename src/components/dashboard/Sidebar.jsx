import { FileStack, History, LayoutDashboard, Package, Settings, Sparkles, UploadCloud } from 'lucide-react'
import { useWorkspace } from '../../hooks/useWorkspace.js'
import { navigateTo } from '../../utils/routes.js'
import UserMenu from './UserMenu.jsx'

export const moduleNavItems = [
  { id: 'dashboard', label: 'Dashboard', path: '/dashboard', icon: LayoutDashboard },
  { id: 'products', label: 'Products', path: '/dashboard/products', icon: Package },
  { id: 'templates', label: 'Templates', path: '/dashboard/templates', icon: FileStack },
  { id: 'uploads', label: 'Uploads', path: '/dashboard/uploads', icon: UploadCloud },
  { id: 'history', label: 'History', path: '/dashboard/history', icon: History },
  { id: 'settings', label: 'Settings', path: '/dashboard/settings', icon: Settings },
]

export default function Sidebar({ currentView = 'dashboard' }) {
  const {
    organizations,
    currentOrganization,
    currentOrganizationId,
    setCurrentOrganizationId,
    loading,
  } = useWorkspace()
  const workspaceName = loading ? 'Loading workspace' : currentOrganization?.name || 'Static Workspace'

  return (
    <aside className="hidden min-h-screen w-72 shrink-0 border-r border-slate-200 bg-white px-4 py-5 lg:sticky lg:top-0 lg:block">
      <div className="flex min-h-[calc(100vh-2.5rem)] flex-col">
      <button
        type="button"
        onClick={() => navigateTo('/')}
        className="focus-ring flex w-full items-center gap-3 rounded-md px-3 py-2 text-left"
      >
        <span className="flex h-10 w-10 items-center justify-center rounded-md bg-primary text-white">
          <Sparkles size={19} aria-hidden="true" />
        </span>
        <span>
          <span className="block text-sm font-bold text-primary">Project Atlas</span>
          <span className="block max-w-[180px] truncate text-xs font-medium text-slate-500">{workspaceName}</span>
        </span>
      </button>

      {organizations.length > 1 && (
        <label className="mt-5 grid gap-2 px-3">
          <span className="text-xs font-semibold uppercase tracking-[0.14em] text-slate-400">Organization</span>
          <select
            value={currentOrganizationId || ''}
            onChange={(event) => setCurrentOrganizationId(event.target.value)}
            className="min-h-10 rounded-md border border-slate-200 bg-lightBg px-3 text-sm font-semibold text-primary outline-none"
          >
            {organizations.map((organization) => (
              <option key={organization.id} value={organization.id}>
                {organization.name}
              </option>
            ))}
          </select>
        </label>
      )}

      <nav className="mt-8 grid gap-1">
        <p className="px-3 text-xs font-semibold uppercase tracking-[0.14em] text-slate-400">Workspace</p>
        {moduleNavItems.map((item) => {
          const Icon = item.icon
          return (
            <button
              key={item.id}
              type="button"
              onClick={() => navigateTo(item.path)}
              className={`focus-ring flex min-h-11 items-center gap-3 rounded-md px-3 text-sm font-semibold transition ${currentView === item.id ? 'bg-primary text-white' : 'text-slate-600 hover:bg-slate-100 hover:text-primary'}`}
            >
              <Icon size={18} aria-hidden="true" />
              {item.label}
            </button>
          )
        })}
      </nav>
      <div className="mt-auto pt-6">
        <UserMenu />
      </div>
      </div>
    </aside>
  )
}
