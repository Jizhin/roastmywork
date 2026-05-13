import { Routes, Route, useLocation } from 'react-router-dom'
import { GoogleOAuthProvider } from '@react-oauth/google'
import Home from './pages/Home'
import Roast from './pages/Roast'
import Result from './pages/Result'
import History from './pages/History'
import Pricing from './pages/Pricing'
import ResumeBuilder from './pages/ResumeBuilder'
import ResumeUpdater from './pages/ResumeUpdater'
import AdminUsers from './pages/AdminUsers'
import ColdEmail from './pages/ColdEmail'
import OutreachWorkspace from './pages/OutreachWorkspace'
import Navbar from './components/Navbar'
import AuthModal from './components/AuthModal'
import UpgradeModal from './components/UpgradeModal'
import { AuthProvider, useAuth } from './context/AuthContext'

function AppShell() {
  const { showAuthModal, showUpgradeModal } = useAuth()
  const { pathname } = useLocation()
  const isHome = pathname === '/'

  return (
    <div
      className={isHome ? 'h-screen flex flex-col overflow-hidden' : 'min-h-screen flex flex-col'}
      style={{ background: isHome ? '#060a10' : 'var(--bg)' }}
    >
      {!isHome && <Navbar />}
      <main className={isHome ? 'flex-1 min-h-0 overflow-hidden' : 'flex-1'}>
        <Routes>
          <Route path="/"                element={<Home />} />
          <Route path="/roast"           element={<Roast />} />
          <Route path="/result/:id"      element={<Result />} />
          <Route path="/history"         element={<History />} />
          <Route path="/pricing"         element={<Pricing />} />
          <Route path="/resume-builder"  element={<ResumeBuilder />} />
          <Route path="/resume-updater"  element={<ResumeUpdater />} />
          <Route path="/admin-users"     element={<AdminUsers />} />
        </Routes>
      </main>
      {!isHome && (
        <footer
          className="py-6"
          style={{ borderTop: '1px solid var(--border)', background: 'var(--surface)' }}
        >
          <div className="max-w-8xl mx-auto px-6 flex items-center justify-between text-[12px]" style={{ color: 'var(--text-3)' }}>
            <div className="flex items-center gap-2">
              <div
                className="w-5 h-5 rounded-md flex items-center justify-center"
                style={{ background: 'var(--accent)' }}
              >
                <svg width="9" height="9" viewBox="0 0 24 24" fill="none">
                  <path d="M12 3C9.5 7.5 8 10.5 8 14a4 4 0 0 0 8 0c0-3.5-1.5-6.5-4-11Z" fill="white"/>
                </svg>
              </div>
              <span className="font-semibold" style={{ color: 'var(--text-2)' }}>RoastMyWork</span>
            </div>
            <span>© {new Date().getFullYear()} · AI-powered career tools</span>
          </div>
        </footer>
      )}
      {showAuthModal && <AuthModal />}
      {showUpgradeModal && <UpgradeModal />}
    </div>
  )
}

export default function App() {
  const googleClientId = import.meta.env.VITE_GOOGLE_CLIENT_ID || '917303497941-s27tb7s60q24fo9qvk8aqgk9mui703b5.apps.googleusercontent.com'

  return (
    <GoogleOAuthProvider clientId={googleClientId}>
      <AuthProvider>
        <Routes>
          <Route path="/cold-email" element={<ColdEmail />} />
          <Route path="/outreach-workspace" element={<OutreachWorkspace />} />
          <Route path="/*"          element={<AppShell />} />
        </Routes>
      </AuthProvider>
    </GoogleOAuthProvider>
  )
}
