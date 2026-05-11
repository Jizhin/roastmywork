import { Link } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'

export default function Navbar() {
  const { user, logout, openAuthModal } = useAuth()

  return (
    <header className="sticky top-0 z-40 bg-white border-b border-gray-200">
      <div className="px-6 h-14 flex items-center justify-between gap-8">

        <Link to="/" className="flex items-center gap-2.5 flex-shrink-0">
          <div className="w-7 h-7 rounded-lg bg-blue-600 flex items-center justify-center">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none">
              <path d="M12 3C9.5 7.5 8 10.5 8 14a4 4 0 0 0 8 0c0-3.5-1.5-6.5-4-11Z" fill="white" fillOpacity="0.95"/>
              <path d="M12 12c-.8 1.8-1.2 3-1.2 4a1.2 1.2 0 0 0 2.4 0c0-1-.4-2.2-1.2-4Z" fill="white" fillOpacity="0.4"/>
            </svg>
          </div>
          <span className="font-bold text-gray-900 text-[15px] tracking-tight">RoastMyWork</span>
        </Link>

        <div className="flex items-center gap-3 flex-shrink-0">
          {user ? (
            <>
              {user.profile?.is_pro ? (
                <span className="text-[11px] font-bold tracking-wider text-blue-600 border border-blue-200 bg-blue-50 px-2.5 py-0.5 rounded-full">
                  PRO
                </span>
              ) : (
                <Link to="/pricing" className="text-[12px] text-gray-500 hover:text-blue-600 transition-colors">
                  {user.profile?.roast_credits ?? 0} credits
                </Link>
              )}
              <div className="w-px h-4 bg-gray-200" />
              <div className="flex items-center gap-2">
                <div className="w-7 h-7 rounded-full bg-blue-100 flex items-center justify-center text-[11px] font-bold text-blue-600 uppercase">
                  {(user.username || 'U')[0]}
                </div>
                <span className="text-[13px] text-gray-700 hidden sm:block max-w-[110px] truncate">{user.username}</span>
              </div>
              <button onClick={logout} className="text-[12px] text-gray-400 hover:text-gray-600 transition-colors">
                Sign out
              </button>
            </>
          ) : (
            <button onClick={openAuthModal} className="btn-primary py-2 px-4">
              Sign in
            </button>
          )}
        </div>

      </div>
    </header>
  )
}
