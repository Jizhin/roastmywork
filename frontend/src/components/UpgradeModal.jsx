import { Link } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'

export default function UpgradeModal() {
  const { closeUpgradeModal } = useAuth()

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm"
      onClick={(e) => e.target === e.currentTarget && closeUpgradeModal()}
    >
      <div className="w-full max-w-[380px] bg-white rounded-2xl border border-gray-200 shadow-2xl animate-fade-up overflow-hidden">
        <div className="h-1 bg-red-500" />
        <div className="p-8 text-center">
          <div className="w-11 h-11 mx-auto mb-5 rounded-xl bg-red-50 border border-red-100 flex items-center justify-center">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#ef4444" strokeWidth="1.5">
              <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/>
              <line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/>
            </svg>
          </div>

          <h2 className="text-xl font-bold text-gray-900 mb-1.5">You're out of credits</h2>
          <p className="text-gray-500 text-sm mb-7 leading-relaxed">
            Upgrade to Pro for <span className="text-blue-600 font-semibold">unlimited roasts</span>,
            full history, and priority processing.
          </p>

          <Link to="/pricing" onClick={closeUpgradeModal} className="btn-primary w-full mb-3 block">
            View Plans
          </Link>
          <button onClick={closeUpgradeModal} className="text-[13px] text-gray-400 hover:text-gray-600 transition-colors">
            Maybe later
          </button>
        </div>
      </div>
    </div>
  )
}
