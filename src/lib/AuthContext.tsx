'use client'
import React, { createContext, useContext, useState, useEffect, useCallback } from 'react'
import type { UserRole } from '@/types'

interface AuthUser {
  id: string
  email: string
  name: string
  role: UserRole
}

interface AuthContextValue {
  user: AuthUser | null
  accessToken: string | null
  loading: boolean
  login: (email: string, password: string) => Promise<void>
  logout: () => Promise<void>
  refreshAuth: () => Promise<string | null>
}

const AuthContext = createContext<AuthContextValue | null>(null)

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(null)
  const [accessToken, setAccessToken] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)

  const refreshAuth = useCallback(async (): Promise<string | null> => {
    try {
      const res = await fetch('/api/auth/refresh', { method: 'POST', credentials: 'include' })
      if (!res.ok) {
        setUser(null)
        setAccessToken(null)
        localStorage.removeItem('access_token')
        localStorage.removeItem('auth_user')
        return null
      }
      const data = await res.json()
      setAccessToken(data.accessToken)
      localStorage.setItem('access_token', data.accessToken)
      return data.accessToken
    } catch {
      return null
    }
  }, [])

  useEffect(() => {
    const storedToken = localStorage.getItem('access_token')
    const storedUser = localStorage.getItem('auth_user')
    if (storedToken && storedUser) {
      try {
        const parsedUser = JSON.parse(storedUser) as AuthUser
        // Check if access token is still valid (not expired)
        const payload = JSON.parse(atob(storedToken.split('.')[1]))
        const expiresAt = payload.exp * 1000
        if (expiresAt - Date.now() > 60_000) {
          // Token still has >1 min left, use it directly without a refresh call
          setUser(parsedUser)
          setAccessToken(storedToken)
          setLoading(false)
          return
        }
      } catch { /* fall through to refresh */ }
    }
    // No valid stored token — try refresh cookie
    refreshAuth().then((token) => {
      if (token) {
        try {
          const payload = JSON.parse(atob(token.split('.')[1]))
          const u: AuthUser = { id: payload.userId, email: payload.email, name: payload.name, role: payload.role }
          setUser(u)
          localStorage.setItem('auth_user', JSON.stringify(u))
        } catch {}
      }
      setLoading(false)
    })
  }, [refreshAuth])

  const login = async (email: string, password: string) => {
    const res = await fetch('/api/auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password }),
      credentials: 'include',
    })
    const data = await res.json()
    if (!res.ok) throw new Error(data.error || 'Login failed')
    setAccessToken(data.accessToken)
    setUser(data.user)
    localStorage.setItem('access_token', data.accessToken)
    localStorage.setItem('auth_user', JSON.stringify(data.user))
  }

  const logout = async () => {
    await fetch('/api/auth/logout', { method: 'POST', credentials: 'include' })
    setUser(null)
    setAccessToken(null)
    localStorage.removeItem('access_token')
    localStorage.removeItem('auth_user')
  }

  return (
    <AuthContext.Provider value={{ user, accessToken, loading, login, logout, refreshAuth }}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth must be used within AuthProvider')
  return ctx
}
