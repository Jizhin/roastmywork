import { createContext, useContext, useState, useEffect, useRef } from 'react'
import { authApi } from '../api/client'

const AuthContext = createContext(null)

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null)
  const [loading, setLoading] = useState(true)
  const [showAuthModal, setShowAuthModal] = useState(false)
  const [showUpgradeModal, setShowUpgradeModal] = useState(false)
  const afterLoginCallback = useRef(null)

  const refreshUser = async () => {
    const token = localStorage.getItem('access_token')
    if (!token) { setUser(null); setLoading(false); return }
    try {
      const { data } = await authApi.me()
      setUser(data)
    } catch {
      localStorage.removeItem('access_token')
      localStorage.removeItem('refresh_token')
      setUser(null)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    const base = import.meta.env.VITE_API_BASE_URL || '/api'
    fetch(`${base}/health/`).catch(() => {})
    refreshUser()
  }, [])

  // Called by AuthModal after successful Google sign-in
  // userData comes directly from the login response — no extra /me/ call needed
  const onLoginSuccess = (access, refresh, userData) => {
    localStorage.setItem('access_token', access)
    localStorage.setItem('refresh_token', refresh)
    setUser(userData)
    setLoading(false)
    setShowAuthModal(false)
    let resumedPendingAction = false
    if (afterLoginCallback.current) {
      const cb = afterLoginCallback.current
      afterLoginCallback.current = null
      cb()
      resumedPendingAction = true
    }
    return resumedPendingAction
  }

  const openAuthModal = (callback = null) => {
    afterLoginCallback.current = callback
    setShowAuthModal(true)
  }

  const closeAuthModal = () => {
    afterLoginCallback.current = null
    setShowAuthModal(false)
  }

  const openUpgradeModal = () => setShowUpgradeModal(true)
  const closeUpgradeModal = () => setShowUpgradeModal(false)

  const logout = () => {
    localStorage.removeItem('access_token')
    localStorage.removeItem('refresh_token')
    setUser(null)
  }

  return (
    <AuthContext.Provider value={{
      user, loading, logout, refreshUser,
      showAuthModal, openAuthModal, closeAuthModal, onLoginSuccess,
      showUpgradeModal, openUpgradeModal, closeUpgradeModal,
    }}>
      {children}
    </AuthContext.Provider>
  )
}

export const useAuth = () => useContext(AuthContext)
