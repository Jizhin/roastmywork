import { useState, useRef, useEffect } from 'react'
import { Link, useLocation, NavLink } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'

export default function Navbar() {
  const { user, logout, openAuthModal } = useAuth()
  const [menuOpen, setMenuOpen] = useState(false)
  const menuRef = useRef()
  const { pathname } = useLocation()

  useEffect(() => {
    const handler = (e) => { if (menuRef.current && !menuRef.current.contains(e.target)) setMenuOpen(false) }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [])

  const navLinks = [
    { to: '/',        label: 'Tools'   },
    { to: '/history', label: 'History' },
    { to: '/pricing', label: 'Pricing' },
  ]

  return (
    <header
      className="sticky top-0 z-40"
      style={{
        background: 'rgba(9,9,11,0.85)',
        borderBottom: '1px solid rgba(255,255,255,0.07)',
        backdropFilter: 'blur(16px)',
        WebkitBackdropFilter: 'blur(16px)',
      }}
    >
      <div className="max-w-screen-2xl mx-auto px-5 h-14 flex items-center justify-between gap-6">

        {/* Logo */}
        <Link to="/" className="flex items-center gap-2.5 flex-shrink-0 group">
          <div
            className="w-7 h-7 rounded-lg flex items-center justify-center"
            style={{ background: 'linear-gradient(135deg,#6366f1,#8b5cf6)' }}
          >
            <svg width="13" height="13" viewBox="0 0 24 24" fill="none">
              <path d="M12 3C9.5 7.5 8 10.5 8 14a4 4 0 0 0 8 0c0-3.5-1.5-6.5-4-11Z" fill="white" fillOpacity="0.95"/>
              <path d="M12 12c-.8 1.8-1.2 3-1.2 4a1.2 1.2 0 0 0 2.4 0c0-1-.4-2.2-1.2-4Z" fill="white" fillOpacity="0.45"/>
            </svg>
          </div>
          <span
            className="font-bold text-[15px] tracking-tight"
            style={{ color: 'var(--text)' }}
          >
            RoastMyWork
          </span>
        </Link>

        {/* Nav links */}
        <nav className="hidden sm:flex items-center gap-1">
          {navLinks.map(({ to, label }) => (
            <NavLink
              key={to}
              to={to}
              end={to === '/'}
              className={({ isActive }) =>
                `px-3.5 py-1.5 rounded-lg text-[13px] font-medium transition-all duration-150 ${
                  isActive
                    ? 'text-white bg-white/8'
                    : 'text-[--text-2] hover:text-white hover:bg-white/5'
                }`
              }
              style={({ isActive }) => isActive ? { background: 'rgba(255,255,255,0.08)' } : {}}
            >
              {label}
            </NavLink>
          ))}
        </nav>

        {/* Right side */}
        <div className="flex items-center gap-3 flex-shrink-0">
          {user ? (
            <>
              {/* Credits / Pro badge */}
              {user.profile?.is_pro ? (
                <span
                  className="hidden sm:flex items-center gap-1.5 text-[11px] font-bold tracking-wider px-2.5 py-1 rounded-full"
                  style={{ background: 'rgba(99,102,241,0.15)', color: '#a5b4fc', border: '1px solid rgba(99,102,241,0.25)' }}
                >
                  <svg width="9" height="9" viewBox="0 0 24 24" fill="currentColor"><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/></svg>
                  PRO
                </span>
              ) : (
                <Link
                  to="/pricing"
                  className="hidden sm:block text-[12px] font-medium transition-colors"
                  style={{ color: 'var(--text-2)' }}
                  onMouseEnter={e => e.target.style.color = 'var(--accent-2)'}
                  onMouseLeave={e => e.target.style.color = 'var(--text-2)'}
                >
                  {user.profile?.roast_credits ?? 0} credits
                </Link>
              )}

              <div style={{ width: 1, height: 18, background: 'rgba(255,255,255,0.1)' }} />

              {/* User menu */}
              <div className="relative" ref={menuRef}>
                <button
                  onClick={() => setMenuOpen(o => !o)}
                  className="flex items-center gap-2.5 px-2 py-1.5 rounded-lg transition-all duration-150"
                  style={{ ':hover': { background: 'rgba(255,255,255,0.06)' } }}
                  onMouseEnter={e => e.currentTarget.style.background = 'rgba(255,255,255,0.06)'}
                  onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
                >
                  <div
                    className="w-7 h-7 rounded-full flex items-center justify-center text-[11px] font-bold uppercase flex-shrink-0"
                    style={{ background: 'linear-gradient(135deg,#6366f1,#8b5cf6)', color: '#fff' }}
                  >
                    {(user.username || 'U')[0]}
                  </div>
                  <span className="text-[13px] font-medium hidden sm:block max-w-[100px] truncate" style={{ color: 'var(--text)' }}>
                    {user.username}
                  </span>
                  <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"
                    style={{ color: 'var(--text-3)', transition: 'transform 0.15s', transform: menuOpen ? 'rotate(180deg)' : '' }}>
                    <polyline points="6 9 12 15 18 9"/>
                  </svg>
                </button>

                {menuOpen && (
                  <div
                    className="absolute right-0 top-full mt-2 w-48 rounded-xl py-1 overflow-hidden z-50 animate-fade-in"
                    style={{
                      background: 'var(--surface-2)',
                      border: '1px solid var(--border-strong)',
                      boxShadow: '0 8px 32px rgba(0,0,0,0.5)',
                    }}
                  >
                    <div className="px-4 py-3 border-b" style={{ borderColor: 'var(--border)' }}>
                      <p className="text-[13px] font-semibold truncate" style={{ color: 'var(--text)' }}>{user.username}</p>
                      <p className="text-[11px] truncate" style={{ color: 'var(--text-3)' }}>{user.email || ''}</p>
                    </div>
                    <Link
                      to="/history"
                      onClick={() => setMenuOpen(false)}
                      className="flex items-center gap-3 w-full px-4 py-2.5 text-[13px] transition-colors"
                      style={{ color: 'var(--text-2)' }}
                      onMouseEnter={e => { e.currentTarget.style.background = 'rgba(255,255,255,0.05)'; e.currentTarget.style.color = 'var(--text)' }}
                      onMouseLeave={e => { e.currentTarget.style.background = ''; e.currentTarget.style.color = 'var(--text-2)' }}
                    >
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>
                      History
                    </Link>
                    {!user.profile?.is_pro && (
                      <Link
                        to="/pricing"
                        onClick={() => setMenuOpen(false)}
                        className="flex items-center gap-3 w-full px-4 py-2.5 text-[13px] transition-colors"
                        style={{ color: '#a5b4fc' }}
                        onMouseEnter={e => { e.currentTarget.style.background = 'rgba(99,102,241,0.08)' }}
                        onMouseLeave={e => { e.currentTarget.style.background = '' }}
                      >
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8"><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/></svg>
                        Upgrade to Pro
                      </Link>
                    )}
                    <div className="h-px my-1" style={{ background: 'var(--border)' }} />
                    <button
                      onClick={() => { logout(); setMenuOpen(false) }}
                      className="flex items-center gap-3 w-full px-4 py-2.5 text-[13px] transition-colors text-left"
                      style={{ color: 'var(--text-2)' }}
                      onMouseEnter={e => { e.currentTarget.style.background = 'rgba(239,68,68,0.06)'; e.currentTarget.style.color = '#f87171' }}
                      onMouseLeave={e => { e.currentTarget.style.background = ''; e.currentTarget.style.color = 'var(--text-2)' }}
                    >
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8"><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/><polyline points="16 17 21 12 16 7"/><line x1="21" y1="12" x2="9" y2="12"/></svg>
                      Sign out
                    </button>
                  </div>
                )}
              </div>
            </>
          ) : (
            <button
              onClick={openAuthModal}
              className="btn-primary py-2 px-4 text-[13px]"
            >
              Sign in
            </button>
          )}
        </div>
      </div>
    </header>
  )
}

