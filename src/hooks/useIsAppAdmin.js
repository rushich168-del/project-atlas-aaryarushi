import { useEffect, useState } from 'react'
import { useAuth } from '../context/AuthContext.jsx'
import { getIsCurrentUserAdmin } from '../services/adminInquiriesService.js'

// Project Atlas v3.8 — lightweight admin check for conditional UI (e.g. the
// admin nav link). Resolves to false for logged-out users and non-admins.
// Runs only inside protected/dashboard areas (never on public marketing pages).

export function useIsAppAdmin() {
  const { session } = useAuth()
  const [isAdmin, setIsAdmin] = useState(false)

  useEffect(() => {
    let active = true

    if (!session) {
      setIsAdmin(false)
      return undefined
    }

    getIsCurrentUserAdmin().then((value) => {
      if (active) {
        setIsAdmin(value === true)
      }
    })

    return () => {
      active = false
    }
  }, [session])

  return isAdmin
}
