import { useState } from 'react'
import { GoogleLogin } from '@react-oauth/google'
import { useAuth } from '../context/AuthContext'
import api from '../api/client'

export default function AuthModal() {
  const { closeAuthModal, onLoginSuccess } = useAuth()
  const [error, setError] = useState('')

  const handleGoogleSuccess = async (credentialResponse) => {
    setError('')
    try {
      const { data } = await api.post('/users/auth/google/', { credential: credentialResponse.credential })
      await onLoginSuccess(data.access, data.refresh)
    } catch {
      setError('Sign-in failed. Please try again.')
    }
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm"
      onClick={(e) => e.target === e.currentTarget && closeAuthModal()}
    >
      <div className="w-full max-w-[380px] bg-white rounded-2xl border border-gray-200 shadow-2xl animate-fade-up overflow-hidden">
        <div className="h-1 bg-orange-500" />
        <div className="p-8 text-center">
          <div className="w-11 h-11 mx-auto mb-5 rounded-xl bg-orange-500 flex items-center justify-center">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
              <path d="M12 3C9.5 7.5 8 10.5 8 14a4 4 0 0 0 8 0c0-3.5-1.5-6.5-4-11Z" fill="white" fillOpacity="0.95"/>
              <path d="M12 12c-.8 1.8-1.2 3-1.2 4a1.2 1.2 0 0 0 2.4 0c0-1-.4-2.2-1.2-4Z" fill="white" fillOpacity="0.4"/>
            </svg>
          </div>

          <h2 className="text-xl font-bold text-gray-900 mb-1.5">Ready to get roasted?</h2>
          <p className="text-gray-500 text-sm mb-7 leading-relaxed">
            Sign in and get <span className="text-orange-600 font-semibold">5 free roasts</span> instantly.
            No credit card needed.
          </p>

          <div className="flex justify-center mb-5">
            <GoogleLogin
              onSuccess={handleGoogleSuccess}
              onError={() => setError('Sign-in failed. Please try again.')}
              theme="outline"
              shape="rectangular"
              size="large"
              text="signin_with"
            />
          </div>

          {error && <p className="text-red-600 text-sm mb-3">{error}</p>}
          <p className="text-gray-400 text-[12px]">No password · No spam · Cancel anytime</p>
        </div>
      </div>
    </div>
  )
}
