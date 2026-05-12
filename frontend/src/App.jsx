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
import Navbar from './components/Navbar'
import AuthModal from './components/AuthModal'
import UpgradeModal from './components/UpgradeModal'
import { AuthProvider, useAuth } from './context/AuthContext'

function AppShell() {
  const { showAuthModal, showUpgradeModal } = useAuth()
  const { pathname } = useLocation()
  const isHome = pathname === '/'

  return (
    <div className={isHome ? 'h-screen flex flex-col overflow-hidden' : 'min-h-screen flex flex-col'}>
      <Navbar />
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
        <footer className="border-t border-gray-200 py-6 bg-white">
          <div className="max-w-8xl mx-auto px-6 flex items-center justify-between text-[12px] text-gray-400">
            <span className="font-semibold text-gray-600">RoastMyWork</span>
            <span>© {new Date().getFullYear()} · AI-powered resume and career tools</span>
          </div>
        </footer>
      )}
      {showAuthModal && <AuthModal />}
      {showUpgradeModal && <UpgradeModal />}
    </div>
  )
}

export default function App() {
  return (
    <GoogleOAuthProvider clientId="917303497941-s27tb7s60q24fo9qvk8aqgk9mui703b5.apps.googleusercontent.com">
      <AuthProvider>
        <Routes>
          <Route path="/cold-email" element={<ColdEmail />} />
          <Route path="/*"          element={<AppShell />} />
        </Routes>
      </AuthProvider>
    </GoogleOAuthProvider>
  )
}
