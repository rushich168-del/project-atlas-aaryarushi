import { createContext, useContext, useEffect, useMemo, useState } from 'react'
import { isSupabaseConfigured, supabase } from '../lib/supabaseClient.js'

const AuthContext = createContext(null)

export function AuthProvider({ children }) {
  const [session, setSession] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    let active = true

    async function loadSession() {
      if (!isSupabaseConfigured) {
        setLoading(false)
        return
      }

      try {
        const { data, error } = await supabase.auth.getSession()
        if (error) {
          console.warn('[AuthContext] Failed to get auth session:', error.message)
        }
        if (active) {
          setSession(data?.session || null)
        }
      } catch (err) {
        console.warn('[AuthContext] Unexpected auth session failure:', err)
        if (active) {
          setSession(null)
        }
      } finally {
        if (active) {
          setLoading(false)
        }
      }
    }

    loadSession()

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, nextSession) => {
      if (active) {
        setSession(nextSession)
        setLoading(false)
      }
    })

    return () => {
      active = false
      subscription?.unsubscribe()
    }
  }, [])

  async function signIn(email, password) {
    return supabase.auth.signInWithPassword({ email, password })
  }

  async function signUp(email, password) {
    return supabase.auth.signUp({ email, password })
  }

  async function signOut() {
    return supabase.auth.signOut()
  }

  const value = useMemo(
    () => ({
      session,
      user: session?.user || null,
      loading,
      signIn,
      signUp,
      signOut,
      isConfigured: isSupabaseConfigured,
    }),
    [session, loading],
  )

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

export function useAuth() {
  const context = useContext(AuthContext)

  if (!context) {
    throw new Error('useAuth must be used within AuthProvider')
  }

  return context
}
