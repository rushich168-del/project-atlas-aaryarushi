import { useEffect, useState } from 'react'
import { getCatalogData } from '../services/catalogService.js'
import { useWorkspace } from './useWorkspace.js'

export function useProductCatalog() {
  const {
    currentOrganization,
    currentOrganizationId,
    loading: workspaceLoading,
    error: workspaceError,
    source: workspaceSource,
  } = useWorkspace()
  const [catalog, setCatalog] = useState({
    organization: null,
    categories: [],
    products: [],
    source: 'loading',
    status: 'loading',
    message: '',
  })
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    let active = true

    async function loadCatalog() {
      if (workspaceLoading) {
        setLoading(true)
        return
      }

      setLoading(true)
      setError('')

      if (workspaceError && workspaceSource === 'error') {
        const data = await getCatalogData(null)

        if (!active) {
          return
        }

        setCatalog({
          ...data,
          status: 'error',
          message: workspaceError,
        })
        setError(workspaceError)
        setLoading(false)
        return
      }

      const data = await getCatalogData(currentOrganizationId, currentOrganization)

      if (!active) {
        return
      }

      setCatalog(data)
      setError(data.source === 'static' ? data.message : '')
      setLoading(false)
    }

    loadCatalog()

    return () => {
      active = false
    }
  }, [currentOrganization, currentOrganizationId, workspaceError, workspaceLoading, workspaceSource])

  return {
    ...catalog,
    loading,
    error,
  }
}
