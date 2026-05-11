import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { roastApi } from '../api/client'
import ToolChat from './ToolChat'

// ── Tool registry ─────────────────────────────────────────────────────────────

const TOOLS = [
  { key: 'build_resume', label: 'Build Resume',     desc: 'Generate a resume from scratch'          },
  { key: 'fix_resume',   label: 'Fix Resume',       desc: 'AI rewrites every weak point'            },
  { key: 'roast',        label: 'Roast My Work',    desc: 'Brutally honest feedback'                },
  { key: 'jd_match',     label: 'JD Match',         desc: 'Score resume vs job posting'             },
  { key: 'interview',    label: 'Interview Prep',   desc: 'Questions + answer scoring'              },
  { key: 'linkedin_dm',  label: 'LinkedIn DM',      desc: 'Outreach that gets replies'              },
  { key: 'linkedin_opt', label: 'LinkedIn Profile', desc: 'Optimize for recruiters'                 },
  { key: 'salary',       label: 'Salary Coach',     desc: 'Negotiate smarter with data'             },
]

const WORK_LABELS = { resume: 'Resume', code: 'Code', pitch_deck: 'Pitch Deck', linkedin: 'LinkedIn', essay: 'Essay' }

// ── Icons ─────────────────────────────────────────────────────────────────────

function ToolIcon({ toolKey, size = 22, className = '' }) {
  const s = { width: size, height: size, viewBox: '0 0 24 24', fill: 'none', stroke: 'currentColor', strokeWidth: 1.75, strokeLinecap: 'round', strokeLinejoin: 'round', className }
  if (toolKey === 'build_resume') return <svg {...s}><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/><line x1="16" y1="13" x2="8" y2="13"/><line x1="16" y1="17" x2="8" y2="17"/></svg>
  if (toolKey === 'fix_resume')   return <svg {...s}><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/></svg>
  if (toolKey === 'roast')        return <svg {...s}><path d="M12 2C9.5 6.5 8 9.5 8 13a4 4 0 0 0 8 0c0-3.5-1.5-6.5-4-11z"/></svg>
  if (toolKey === 'jd_match')     return <svg {...s}><circle cx="12" cy="12" r="10"/><circle cx="12" cy="12" r="6"/><circle cx="12" cy="12" r="2" fill="currentColor" stroke="none"/></svg>
  if (toolKey === 'interview')    return <svg {...s}><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/></svg>
  if (toolKey === 'linkedin_dm')  return <svg {...s}><line x1="22" y1="2" x2="11" y2="13"/><polygon points="22 2 15 22 11 13 2 9 22 2"/></svg>
  if (toolKey === 'linkedin_opt') return <svg {...s}><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/></svg>
  if (toolKey === 'salary')       return <svg {...s}><polyline points="23 6 13.5 15.5 8.5 10.5 1 18"/><polyline points="17 6 23 6 23 12"/></svg>
  return null
}

// ── History sidebar ───────────────────────────────────────────────────────────

function HistorySidebar({ activeTool, onHome, sessions, user, openAuthModal }) {
  const fmt = (iso) => {
    const d = new Date(iso)
    const now = new Date()
    const diff = (now - d) / 1000
    if (diff < 60)   return 'just now'
    if (diff < 3600) return `${Math.floor(diff / 60)}m ago`
    if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`
    return d.toLocaleDateString('en', { month: 'short', day: 'numeric' })
  }

  return (
    <aside className="hidden md:flex flex-shrink-0 flex-col bg-[#f8fafc] border-r border-gray-200 overflow-hidden" style={{ width: 220 }}>
      {/* New session */}
      <div className="p-3 border-b border-gray-200">
        <button
          onClick={onHome}
          className="w-full flex items-center gap-2 px-3 py-2.5 rounded-xl bg-white border border-gray-200 hover:border-blue-300 hover:bg-blue-50 text-sm font-medium text-gray-700 hover:text-blue-700 transition-all shadow-sm"
        >
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
            <line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/>
          </svg>
          New session
        </button>
      </div>

      {/* History */}
      <div className="flex-1 overflow-y-auto py-2">
        {!user ? (
          <div className="px-3 py-6 text-center">
            <p className="text-xs text-gray-400 mb-3 leading-relaxed">Sign in to save your sessions and access history</p>
            <button
              onClick={openAuthModal}
              className="text-xs font-semibold text-blue-600 hover:text-blue-700 transition-colors"
            >
              Sign in →
            </button>
          </div>
        ) : sessions.length === 0 ? (
          <p className="text-xs text-gray-400 text-center px-4 py-6 leading-relaxed">
            Your sessions will appear here after you use a tool
          </p>
        ) : (
          <>
            <p className="text-[10px] font-semibold text-gray-400 uppercase tracking-widest px-3 py-2">Recent</p>
            {sessions.map(s => (
              <Link
                key={s.id}
                to={`/result/${s.id}`}
                className="flex items-start gap-2.5 px-3 py-2.5 hover:bg-white hover:shadow-sm rounded-lg mx-1 transition-all group"
              >
                <div className="w-7 h-7 rounded-lg bg-white border border-gray-200 flex items-center justify-center flex-shrink-0 text-gray-400 group-hover:text-blue-500 group-hover:border-blue-200 transition-colors mt-0.5">
                  <ToolIcon toolKey="roast" size={13} />
                </div>
                <div className="min-w-0 flex-1">
                  <p className="text-[12px] font-medium text-gray-700 truncate">
                    {WORK_LABELS[s.work_type] || 'Roast'}
                  </p>
                  <p className="text-[11px] text-gray-400">{fmt(s.created_at)}</p>
                </div>
              </Link>
            ))}
          </>
        )}
      </div>

      {/* Footer */}
      <div className="border-t border-gray-200 p-2 space-y-0.5">
        {user && !user.profile?.is_pro && (
          <Link to="/pricing"
            className="flex items-center gap-2 px-3 py-2 rounded-lg text-[12px] font-medium text-blue-600 hover:bg-blue-50 transition-colors">
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
              <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/>
            </svg>
            Upgrade to Pro
          </Link>
        )}
        {user?.profile?.is_pro && (
          <div className="px-3 py-2 text-[11px] font-bold text-blue-600">PRO — Unlimited</div>
        )}
      </div>
    </aside>
  )
}

// ── Welcome / Tool picker ─────────────────────────────────────────────────────

function WelcomeScreen({ user, onSelect }) {
  const hour = new Date().getHours()
  const greeting = user
    ? (hour < 12 ? `Good morning, ${user.first_name || user.username}` : hour < 17 ? `Good afternoon, ${user.first_name || user.username}` : `Good evening, ${user.first_name || user.username}`)
    : 'What do you want to work on?'

  return (
    <div className="h-full overflow-y-auto bg-white">
      <div className="max-w-3xl mx-auto px-4 py-10 md:py-16">

        {/* Greeting */}
        <div className="text-center mb-10">
          <h1 className="text-2xl md:text-3xl font-bold text-[#0f2744] mb-2">{greeting}</h1>
          <p className="text-gray-400 text-sm">Pick a tool to get started — AI does the heavy lifting.</p>
        </div>

        {/* Credits strip */}
        {user && !user.profile?.is_pro && (
          <div className="flex items-center justify-between bg-gray-50 border border-gray-200 rounded-xl px-4 py-3 mb-8 text-sm">
            <span className="text-gray-500">
              <span className="font-semibold text-gray-900">{user.profile?.roast_credits ?? 0}</span> credits remaining
            </span>
            <Link to="/pricing" className="text-xs font-semibold text-blue-600 hover:text-blue-700 border border-blue-200 bg-blue-50 hover:bg-blue-100 px-3 py-1.5 rounded-lg transition-all">
              Upgrade to Pro
            </Link>
          </div>
        )}

        {/* Tool grid — 4 per row */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-4">
          {TOOLS.map(tool => (
            <button
              key={tool.key}
              onClick={() => onSelect(tool.key)}
              className="group flex flex-col items-center text-center p-4 bg-white border border-gray-200 rounded-2xl hover:border-blue-300 hover:shadow-md hover:-translate-y-0.5 transition-all duration-150 cursor-pointer"
            >
              <div className="w-11 h-11 rounded-xl bg-gray-50 border border-gray-100 flex items-center justify-center mb-3 text-gray-500 group-hover:bg-blue-600 group-hover:border-blue-600 group-hover:text-white transition-all duration-150">
                <ToolIcon toolKey={tool.key} size={20} />
              </div>
              <span className="text-[13px] font-semibold text-gray-900 leading-tight mb-1">{tool.label}</span>
              <span className="text-[11px] text-gray-400 leading-relaxed">{tool.desc}</span>
            </button>
          ))}
        </div>

        {/* Cold Email — featured card */}
        <Link
          to="/cold-email"
          className="group flex items-center gap-4 p-4 bg-[#0f2744] rounded-2xl hover:bg-[#1a3a6e] transition-colors"
        >
          <div className="w-11 h-11 rounded-xl bg-white/10 flex items-center justify-center flex-shrink-0">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round">
              <path d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"/>
            </svg>
          </div>
          <div className="flex-1 text-left">
            <p className="text-sm font-semibold text-white">Cold Email Builder</p>
            <p className="text-xs text-blue-300">Write & send emails to recruiters — directly from your Gmail</p>
          </div>
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2" strokeLinecap="round" className="opacity-50 group-hover:opacity-100 group-hover:translate-x-0.5 transition-all">
            <line x1="5" y1="12" x2="19" y2="12"/><polyline points="12 5 19 12 12 19"/>
          </svg>
        </Link>

        {/* Mobile history link */}
        <div className="md:hidden mt-6 flex gap-2">
          <Link to="/history" className="flex items-center gap-1.5 px-3 py-2 rounded-lg border border-gray-200 text-[13px] text-gray-500 hover:text-gray-800 transition-colors">
            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
              <circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/>
            </svg>
            History
          </Link>
          <Link to="/pricing" className="flex items-center gap-1.5 px-3 py-2 rounded-lg border border-blue-200 bg-blue-50 text-[13px] text-blue-600 font-medium hover:bg-blue-100 transition-colors">
            Upgrade to Pro
          </Link>
        </div>

      </div>
    </div>
  )
}

// ── Main ──────────────────────────────────────────────────────────────────────

export default function Home() {
  const { user, openAuthModal } = useAuth()
  const [activeTool, setActiveTool] = useState(null)
  const [sessions, setSessions]     = useState([])

  useEffect(() => {
    if (user) {
      roastApi.history()
        .then(({ data }) => setSessions((data.results ?? data).slice(0, 20)))
        .catch(() => {})
    }
  }, [user])

  return (
    <div className="flex overflow-hidden" style={{ height: 'calc(100vh - 56px)' }}>
      <HistorySidebar
        activeTool={activeTool}
        onHome={() => setActiveTool(null)}
        sessions={sessions}
        user={user}
        openAuthModal={openAuthModal}
      />
      <div className="flex-1 overflow-hidden min-w-0">
        {activeTool
          ? <ToolChat key={activeTool} tool={activeTool} onRestart={() => setActiveTool(null)} />
          : <WelcomeScreen user={user} onSelect={setActiveTool} />
        }
      </div>
    </div>
  )
}
