import { useState } from 'react'
import { Link } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import ToolChat from './ToolChat'

// ── Registry ──────────────────────────────────────────────────────────────────

const TOOLS = {
  build_resume: { label: 'Build Resume',       desc: 'Generate a polished resume from scratch with AI'                     },
  fix_resume:   { label: 'Fix Resume',         desc: 'Upload your resume — AI rewrites every weak point'                   },
  roast:        { label: 'Roast My Work',      desc: 'Honest brutal feedback on resume, code or pitch deck'                },
  jd_match:     { label: 'JD Match Score',     desc: 'See exactly how well your resume fits any job posting'               },
  interview:    { label: 'Interview Prep',     desc: 'AI questions for your role — get scored on your answers'             },
  linkedin_dm:  { label: 'LinkedIn DM',        desc: 'Personalised outreach messages that actually get replies'            },
  linkedin_opt: { label: 'LinkedIn Optimizer', desc: 'Rewrite headline and About to attract recruiters'                    },
  salary:       { label: 'Salary Coach',       desc: 'Negotiate smarter with market data and scripts'                      },
  cold_email:   { label: 'Cold Email',         desc: 'Write and send cold emails to recruiters & hiring managers', href: '/cold-email' },
}

const CATEGORIES = [
  { key: 'RESUME',    label: 'Resume',    tools: ['build_resume', 'fix_resume', 'roast']        },
  { key: 'APPLY',     label: 'Apply',     tools: ['jd_match', 'interview']                       },
  { key: 'NETWORK',   label: 'Network',   tools: ['linkedin_dm', 'linkedin_opt', 'cold_email']  },
  { key: 'NEGOTIATE', label: 'Negotiate', tools: ['salary']                                      },
]

// ── SVG icons per tool ────────────────────────────────────────────────────────

function ToolIcon({ toolKey, size = 18 }) {
  const s = { width: size, height: size, viewBox: '0 0 24 24', fill: 'none', stroke: 'currentColor', strokeWidth: 1.8, strokeLinecap: 'round', strokeLinejoin: 'round' }
  if (toolKey === 'build_resume') return <svg {...s}><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/><line x1="16" y1="13" x2="8" y2="13"/><line x1="16" y1="17" x2="8" y2="17"/></svg>
  if (toolKey === 'fix_resume')   return <svg {...s}><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/></svg>
  if (toolKey === 'roast')        return <svg {...s}><path d="M12 2C9.5 6.5 8 9.5 8 13a4 4 0 0 0 8 0c0-3.5-1.5-6.5-4-11z"/></svg>
  if (toolKey === 'jd_match')     return <svg {...s}><circle cx="12" cy="12" r="10"/><circle cx="12" cy="12" r="6"/><circle cx="12" cy="12" r="2" fill="currentColor" stroke="none"/></svg>
  if (toolKey === 'interview')    return <svg {...s}><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/></svg>
  if (toolKey === 'linkedin_dm')  return <svg {...s}><line x1="22" y1="2" x2="11" y2="13"/><polygon points="22 2 15 22 11 13 2 9 22 2"/></svg>
  if (toolKey === 'linkedin_opt') return <svg {...s}><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/></svg>
  if (toolKey === 'salary')       return <svg {...s}><polyline points="23 6 13.5 15.5 8.5 10.5 1 18"/><polyline points="17 6 23 6 23 12"/></svg>
  if (toolKey === 'cold_email')   return <svg {...s}><path d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"/></svg>
  return null
}

// ── Sidebar ───────────────────────────────────────────────────────────────────

function Sidebar({ activeTool, onSelect }) {
  return (
    <aside className="hidden md:flex flex-shrink-0 flex-col overflow-hidden bg-white border-r border-gray-200" style={{ width: 240 }}>

      {/* Overview / All tools */}
      <button
        onClick={() => onSelect(null)}
        className={`flex items-center gap-2.5 px-4 h-11 w-full text-left border-b border-gray-100 transition-colors text-[13px] font-medium
          ${!activeTool ? 'text-gray-900 bg-gray-50' : 'text-gray-500 hover:text-gray-800 hover:bg-gray-50'}`}>
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
          <rect x="3" y="3" width="7" height="7" rx="1"/><rect x="14" y="3" width="7" height="7" rx="1"/>
          <rect x="14" y="14" width="7" height="7" rx="1"/><rect x="3" y="14" width="7" height="7" rx="1"/>
        </svg>
        Overview
      </button>

      {/* Categories */}
      <nav className="flex-1 overflow-y-auto py-2">
        {CATEGORIES.map(cat => (
          <div key={cat.key} className="mb-1">
            <div className="px-4 pt-4 pb-1 text-[10px] font-semibold text-gray-400 uppercase tracking-widest select-none">
              {cat.label}
            </div>
            {cat.tools.map(key => {
              const tool = TOOLS[key]
              const isActive = activeTool === key
              if (tool.href) {
                return (
                  <Link key={key} to={tool.href}
                    className="w-full flex items-center justify-between text-[13px] px-4 py-2 transition-colors text-gray-600 hover:text-gray-900 hover:bg-gray-50">
                    {tool.label}
                    <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" className="opacity-40">
                      <path d="M18 13v6a2 2 0 01-2 2H5a2 2 0 01-2-2V8a2 2 0 012-2h6M15 3h6v6M10 14L21 3"/>
                    </svg>
                  </Link>
                )
              }
              return (
                <button key={key} onClick={() => onSelect(key)}
                  className={`w-full text-left text-[13px] px-4 py-2 transition-colors relative
                    ${isActive
                      ? 'text-blue-600 bg-blue-50 font-medium'
                      : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50'
                    }`}>
                  {isActive && (
                    <span className="absolute right-0 top-1 bottom-1 w-0.5 bg-blue-600 rounded-l" />
                  )}
                  {tool.label}
                </button>
              )
            })}
          </div>
        ))}
      </nav>

      {/* Bottom links */}
      <div className="border-t border-gray-100 p-3 space-y-0.5 flex-shrink-0">
        <Link to="/history"
          className="flex items-center gap-2.5 px-3 py-2 rounded-lg text-[13px] text-gray-500 hover:text-gray-800 hover:bg-gray-50 transition-colors">
          <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
            <circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/>
          </svg>
          History
        </Link>
        <Link to="/pricing"
          className="flex items-center gap-2.5 px-3 py-2 rounded-lg text-[13px] text-gray-500 hover:text-gray-800 hover:bg-gray-50 transition-colors">
          <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
            <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/>
          </svg>
          Upgrade to Pro
        </Link>
      </div>
    </aside>
  )
}

// ── Welcome Dashboard ─────────────────────────────────────────────────────────

function WelcomeDashboard({ user, onSelect }) {
  const hour = new Date().getHours()
  const greeting = hour < 12 ? 'Good morning' : hour < 17 ? 'Good afternoon' : 'Good evening'

  return (
    <div className="h-full overflow-y-auto bg-gray-50">
      <div className="max-w-4xl mx-auto px-4 py-6 md:px-8 md:py-10">

        {/* Hero */}
        <div className="mb-8">
          <h1 className="text-xl font-bold text-gray-900">
            {user ? `${greeting}, ${user.username}` : 'Your AI Career Assistant'}
          </h1>
          <p className="text-sm text-gray-500 mt-1">
            8 tools to land the job, negotiate better, and build your network.
          </p>
        </div>

        {/* Credits / Pro bar */}
        {user && (
          <div className="flex items-center justify-between bg-white border border-gray-200 rounded-xl px-4 py-3 mb-6 gap-3">
            {user.profile?.is_pro ? (
              <span className="text-sm font-medium text-gray-700">
                <span className="text-blue-600 font-bold">PRO</span> — Unlimited access to all tools
              </span>
            ) : (
              <>
                <span className="text-sm text-gray-600">
                  <span className="font-semibold text-gray-900">{user.profile?.roast_credits ?? 0}</span> credits remaining
                </span>
                <Link to="/pricing"
                  className="text-xs font-semibold text-blue-600 hover:text-blue-700 border border-blue-200 hover:border-blue-300 bg-blue-50 hover:bg-blue-100 px-3 py-1.5 rounded-lg transition-all">
                  Upgrade to Pro
                </Link>
              </>
            )}
          </div>
        )}

        {/* Mobile quick links (sidebar hidden on mobile) */}
        <div className="flex md:hidden gap-2 mb-6">
          <Link to="/history"
            className="flex items-center gap-1.5 px-3 py-2 rounded-lg border border-gray-200 bg-white text-[13px] text-gray-600 hover:text-gray-900 transition-colors">
            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
              <circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/>
            </svg>
            History
          </Link>
          <Link to="/pricing"
            className="flex items-center gap-1.5 px-3 py-2 rounded-lg border border-blue-200 bg-blue-50 text-[13px] text-blue-600 font-medium hover:bg-blue-100 transition-colors">
            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
              <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/>
            </svg>
            Upgrade to Pro
          </Link>
        </div>

        {/* Tool grid */}
        {CATEGORIES.map(cat => (
          <div key={cat.key} className="mb-8">
            <h2 className="text-[11px] font-semibold text-gray-400 uppercase tracking-widest mb-3">
              {cat.label}
            </h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
              {cat.tools.map(key => {
                const tool = TOOLS[key]
                const cardCls = "group text-left bg-white border border-gray-200 rounded-xl p-5 hover:border-gray-300 hover:shadow-sm transition-all"
                const inner = (
                  <>
                    <div className="w-9 h-9 rounded-lg bg-gray-50 border border-gray-100 flex items-center justify-center mb-3 text-gray-500 group-hover:text-orange-500 group-hover:border-orange-100 group-hover:bg-orange-50 transition-colors">
                      <ToolIcon toolKey={key} />
                    </div>
                    <div className="text-[14px] font-semibold text-gray-900 mb-1">{tool.label}</div>
                    <div className="text-[13px] text-gray-500 leading-relaxed">{tool.desc}</div>
                  </>
                )
                return tool.href
                  ? <Link key={key} to={tool.href} className={cardCls}>{inner}</Link>
                  : <button key={key} onClick={() => onSelect(key)} className={cardCls}>{inner}</button>
              })}
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}

// ── Main ──────────────────────────────────────────────────────────────────────

export default function Home() {
  const { user } = useAuth()
  const [activeTool, setActiveTool] = useState(null)

  return (
    <div className="flex overflow-hidden" style={{ height: 'calc(100vh - 56px)' }}>
      <Sidebar activeTool={activeTool} onSelect={setActiveTool} />
      <div className="flex-1 overflow-hidden min-w-0">
        {activeTool
          ? <ToolChat key={activeTool} tool={activeTool} onRestart={() => setActiveTool(null)} />
          : <WelcomeDashboard user={user} onSelect={setActiveTool} />
        }
      </div>
    </div>
  )
}
