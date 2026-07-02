import { LogOut, Mail, UserRound } from 'lucide-react'
import { useState } from 'react'
import { useAuth } from '../../context/AuthContext.jsx'
import { navigateTo } from '../../utils/routes.js'

export default function UserMenu({ compact = false }) {
  const { user, signOut } = useAuth()
  const [loading, setLoading] = useState(false)

  async function handleLogout() {
    setLoading(true)
    await signOut()
    setLoading(false)
    navigateTo('/login')
  }

  if (compact) {
    return (
      <div className="flex min-h-10 items-center overflow-hidden rounded-md border border-slate-200 bg-white">
        <div className="hidden min-w-0 items-center gap-2 px-3 text-sm font-semibold text-slate-600 sm:flex">
          <UserRound size={16} className="shrink-0 text-accentBlue" aria-hidden="true" />
          <span className="max-w-[190px] truncate">{user?.email || 'Authenticated user'}</span>
        </div>
        <button
          type="button"
          onClick={handleLogout}
          disabled={loading}
          className="focus-ring flex h-10 w-10 items-center justify-center border-l border-slate-200 text-slate-600 transition hover:text-primary disabled:opacity-70"
          aria-label="Logout"
        >
          <LogOut size={18} aria-hidden="true" />
        </button>
      </div>
    )
  }

  return (
    <div className="rounded-lg border border-slate-200 bg-lightBg p-3">
      <div className="flex min-w-0 items-center gap-3">
        <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-md bg-white text-accentBlue">
          <UserRound size={18} aria-hidden="true" />
        </span>
        <div className="min-w-0">
          <p className="flex items-center gap-1.5 text-xs font-semibold uppercase tracking-[0.12em] text-slate-400">
            <Mail size={13} aria-hidden="true" />
            Signed in
          </p>
          <p className="mt-1 truncate text-sm font-semibold text-primary">{user?.email || 'Authenticated user'}</p>
        </div>
      </div>
      <button
        type="button"
        onClick={handleLogout}
        disabled={loading}
        className="focus-ring mt-3 inline-flex min-h-10 w-full items-center justify-center gap-2 rounded-md border border-slate-200 bg-white px-3 text-sm font-semibold text-slate-600 transition hover:border-primary hover:text-primary disabled:opacity-70"
      >
        <LogOut size={16} aria-hidden="true" />
        {loading ? 'Signing out' : 'Logout'}
      </button>
    </div>
  )
}
