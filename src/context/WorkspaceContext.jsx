import { createContext, useContext, useEffect, useMemo, useState } from 'react'
import { useAuth } from './AuthContext.jsx'
import { isSupabaseConfigured } from '../lib/supabaseClient.js'
import { getOrganizations } from '../services/organizationService.js'

const STORAGE_KEY = 'project-atlas-current-organization-id'
const WorkspaceContext = createContext(null)

function getStoredOrganizationId() {
  try {
    return window.localStorage.getItem(STORAGE_KEY)
  } catch {
    return null
  }
}

function storeOrganizationId(organizationId) {
  try {
    if (organizationId) {
      window.localStorage.setItem(STORAGE_KEY, organizationId)
    } else {
      window.localStorage.removeItem(STORAGE_KEY)
    }
  } catch {
    // Local storage can be unavailable in strict browser contexts.
  }
}

export function WorkspaceProvider({ children }) {
  const { session, loading: authLoading } = useAuth()
  const [organizations, setOrganizations] = useState([])
  const [currentOrganizationId, setSelectedOrganizationId] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [source, setSource] = useState('loading')

  useEffect(() => {
    let active = true

    async function loadOrganizations() {
      if (authLoading) {
        return
      }

      if (!session) {
        setOrganizations([])
        setSelectedOrganizationId(null)
        setLoading(false)
        setError('')
        setSource(isSupabaseConfigured ? 'no_session' : 'static')
        return
      }

      if (!isSupabaseConfigured) {
        setOrganizations([])
        setSelectedOrganizationId(null)
        setLoading(false)
        setError('Connect Supabase to use the live Project Atlas workspace.')
        setSource('static')
        return
      }

      setLoading(true)
      setError('')

      try {
        const visibleOrganizations = await getOrganizations()

        if (!active) {
          return
        }

        const storedOrganizationId = getStoredOrganizationId()
        const storedOrganization = visibleOrganizations.find((organization) => organization.id === storedOrganizationId)
        const selectedOrganization = storedOrganization || visibleOrganizations[0] || null

        setOrganizations(visibleOrganizations)
        setSelectedOrganizationId(selectedOrganization?.id || null)
        storeOrganizationId(selectedOrganization?.id || null)
        setSource(selectedOrganization ? 'supabase' : 'no_organization')
        setError(selectedOrganization ? '' : 'No workspace is linked to this account yet.')
      } catch (loadError) {
        if (!active) {
          return
        }

        setOrganizations([])
        setSelectedOrganizationId(null)
        setSource('error')
        setError(`Unable to load organizations: ${loadError.message}`)
      } finally {
        if (active) {
          setLoading(false)
        }
      }
    }

    loadOrganizations()

    return () => {
      active = false
    }
  }, [authLoading, session])

  function setCurrentOrganizationId(organizationId) {
    const nextOrganization = organizations.find((organization) => organization.id === organizationId)
    const nextOrganizationId = nextOrganization?.id || null

    setSelectedOrganizationId(nextOrganizationId)
    storeOrganizationId(nextOrganizationId)
    setSource(nextOrganizationId ? 'supabase' : 'no_organization')
  }

  const currentOrganization = useMemo(
    () => organizations.find((organization) => organization.id === currentOrganizationId) || null,
    [currentOrganizationId, organizations],
  )

  const value = useMemo(
    () => ({
      organizations,
      currentOrganization,
      currentOrganizationId,
      setCurrentOrganizationId,
      loading,
      error,
      source,
    }),
    [organizations, currentOrganization, currentOrganizationId, loading, error, source],
  )

  return <WorkspaceContext.Provider value={value}>{children}</WorkspaceContext.Provider>
}

export function useWorkspace() {
  const context = useContext(WorkspaceContext)

  if (!context) {
    throw new Error('useWorkspace must be used within WorkspaceProvider')
  }

  return context
}
