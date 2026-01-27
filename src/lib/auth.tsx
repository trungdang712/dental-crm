'use client'

import { createContext, useContext, useEffect, useState, useCallback, useRef, ReactNode } from 'react'
import { createClient } from '@/lib/supabase/client'
import { User, Session } from '@supabase/supabase-js'
import { useRouter } from 'next/navigation'

interface UserProfile {
  id: string
  email: string
  name?: string
  role?: string
}

interface AuthContextType {
  user: User | null
  profile: UserProfile | null
  session: Session | null
  loading: boolean
  signIn: (email: string, password: string) => Promise<{ error: Error | null }>
  signOut: () => Promise<void>
  refreshSession: () => Promise<void>
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [profile, setProfile] = useState<UserProfile | null>(null)
  const [session, setSession] = useState<Session | null>(null)
  const [loading, setLoading] = useState(true)
  const router = useRouter()

  // Use ref to ensure stable supabase client
  const supabaseRef = useRef(createClient())
  const supabase = supabaseRef.current

  // Fetch user profile from database - non-blocking with timeout
  const fetchProfile = useCallback(async (userId: string): Promise<UserProfile | null> => {
    try {
      const fetchPromise = supabase
        .from('users')
        .select('id, email, name, role')
        .eq('auth_id', userId)
        .single()

      const timeoutPromise = new Promise<never>((_, reject) =>
        setTimeout(() => reject(new Error('Profile fetch timeout')), 5000)
      )

      const { data, error } = await Promise.race([fetchPromise, timeoutPromise])

      if (error) {
        console.error('Error fetching profile:', error.message)
        return null
      }

      return data as UserProfile
    } catch (error) {
      console.error('Error fetching profile:', error instanceof Error ? error.message : 'Unknown error')
      return null
    }
  }, [supabase])

  useEffect(() => {
    let mounted = true

    const initAuth = async () => {
      try {
        // Get session - this should be fast as it reads from storage
        const { data: { session: initialSession }, error } = await supabase.auth.getSession()

        if (error) {
          console.error('Session error:', error.message)
        }

        if (!mounted) return

        if (initialSession?.user) {
          setSession(initialSession)
          setUser(initialSession.user)

          // Fetch profile in background - don't block loading
          fetchProfile(initialSession.user.id).then((userProfile) => {
            if (mounted) {
              setProfile(userProfile)
            }
          })
        }
      } catch (error) {
        console.error('Auth init error:', error)
      } finally {
        if (mounted) {
          setLoading(false)
        }
      }
    }

    initAuth()

    // Listen for auth state changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, currentSession) => {
        if (!mounted) return

        setSession(currentSession)
        setUser(currentSession?.user ?? null)

        if (currentSession?.user) {
          // Fetch profile in background
          fetchProfile(currentSession.user.id).then((userProfile) => {
            if (mounted) {
              setProfile(userProfile)
            }
          })
        } else {
          setProfile(null)
        }

        if (event === 'SIGNED_OUT') {
          router.push('/login')
        }
      }
    )

    return () => {
      mounted = false
      subscription.unsubscribe()
    }
  }, [supabase, router, fetchProfile])

  const signIn = useCallback(async (email: string, password: string) => {
    try {
      const { error } = await supabase.auth.signInWithPassword({
        email,
        password,
      })

      if (error) {
        return { error }
      }

      router.push('/dashboard')
      router.refresh()
      return { error: null }
    } catch (error) {
      return { error: error as Error }
    }
  }, [supabase, router])

  const signOut = useCallback(async () => {
    try {
      await supabase.auth.signOut()
      router.push('/login')
      router.refresh()
    } catch (error) {
      console.error('Error signing out:', error)
    }
  }, [supabase, router])

  const refreshSession = useCallback(async () => {
    const { data: { session: newSession } } = await supabase.auth.refreshSession()
    if (newSession) {
      setSession(newSession)
      setUser(newSession.user)
    }
  }, [supabase])

  const value = {
    user,
    profile,
    session,
    loading,
    signIn,
    signOut,
    refreshSession,
  }

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const context = useContext(AuthContext)
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider')
  }
  return context
}
