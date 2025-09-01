import { useState, useEffect } from 'react'
import { supabase } from '../lib/supabase'
import { getCurrentUser, signOut } from '../lib/supabase-auth'
import type { User } from '../lib/supabase'

export const useSupabaseAuth = () => {
  const [user, setUser] = useState<User | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    // Get initial session
    const getInitialSession = async () => {
      try {
        const result = await getCurrentUser()
        if (result.success) {
          setUser(result.user)
        } else {
          setError('Failed to get user session')
        }
      } catch (err) {
        setError('Authentication error')
      } finally {
        setLoading(false)
      }
    }

    getInitialSession()

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        if (event === 'SIGNED_IN' && session?.user) {
          // Get user profile
          const result = await getCurrentUser()
          if (result.success) {
            setUser(result.user)
          }
        } else if (event === 'SIGNED_OUT') {
          setUser(null)
        }
        setLoading(false)
      }
    )

    return () => subscription.unsubscribe()
  }, [])

  const logout = async () => {
    setLoading(true)
    try {
      const result = await signOut()
      if (result.success) {
        setUser(null)
      } else {
        setError('Failed to sign out')
      }
    } catch (err) {
      setError('Sign out error')
    } finally {
      setLoading(false)
    }
  }

  return {
    user,
    loading,
    error,
    logout,
    isAuthenticated: !!user
  }
}