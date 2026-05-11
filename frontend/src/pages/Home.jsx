import { useState, useRef, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { roastApi } from '../api/client'
import ToolChat from './ToolChat'

const TOOLS = [
  { key: 'build_resume', label: 'Build Resume',     desc: 'Generate a resume from scratch',  placeholder: 'e.g. Senior Product Manager at a startup'         },
  { key: 'fix_resume',   label: 'Fix Resume',       desc: 'AI rewrites every weak point',    placeholder: null                                               },
  { key: 'roast',        label: 'Roast My Work',    desc: 'Brutally honest feedback',         placeholder: null                                               },
  { key: 'jd_match',     label: 'JD Match',         desc: 'Score resume vs job posting',     placeholder: null                                               },
  { key: 'interview',    label: 'Interview Prep',   desc: 'Questions + answer scoring',      placeholder: 'e.g. Software Engineer at Google'                  },
  { key: 'linkedin_dm',  label: 'LinkedIn DM',      desc: 'Outreach that gets replies',      placeholder: 'e.g. Priya Sharma, Engineering Manager at Swiggy' },
  { key: 'linkedin_opt', label: 'LinkedIn Profile', desc: 'Optimize for recruiters',         placeholder: null                                               },
  { key: 'salary',       label: 'Salary Coach',     desc: 'Negotiate smarter with data',     placeholder: 'e.g. Software Engineer, ₹22 LPA offer, Bangalore' },
]

const WORK_LABELS = { resume: 'Resume', code: 'Code', pitch_deck: 'Pitch Deck', linkedin: 'LinkedIn', essay: 'Essay' }

function ToolIcon({ toolKey, size = 20 }) {
  const s = { width: size, height: size, viewBox: '0 0 24 24', fill: 'none', stroke: 'currentColor', strokeWidth: 1.75, strokeLinecap: 'round', strokeLinejoin: 'round' }
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

function HistorySidebar({ onHome, sessions, user, openAuthModal }) {
  const fmt = (iso) => {
    const diff = (Date.now() - new Date(iso)) / 1000
    if (diff < 3600)  return `${Math.floor(diff / 60)}m ago`
    if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`
    return new Date(iso).toLocaleDateString('en', { month: 'short', day: 'numeric' })
  }

  return (
    <aside className="hidden md:flex flex-shrink-0 flex-col bg-[#f8fafc] border-r border-gray-200" style={{ width: 220 }}>
      <div className="p-3 border-b border-gray-200">
        <button
          onClick={onHome}
          className="w-full flex items-center gap-2 px-3 py-2.5 rounded-xl bg-white border border-gray-200 hover:border-blue-300 hover:bg-blue-50 text-sm font-medium text-gray-700 hover:text-blue-700 transition-all shadow-sm"
        >
          <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
            <line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/>
          </svg>
          New session
        </button>
      </div>

      <div className="flex-1 overflow-y-auto py-2">
        {!user ? (
          <div className="px-3 py-6 text-center">
            <p className="text-xs text-gray-400 mb-3 leading-relaxed">Sign in to save sessions and access history</p>
            <button onClick={openAuthModal} className="text-xs font-semibold text-blue-600 hover:text-blue-700">Sign in →</button>
          </div>
        ) : sessions.length === 0 ? (
          <p className="text-xs text-gray-400 text-center px-4 py-6 leading-relaxed">Your sessions will appear here</p>
        ) : (
          <>
            <p className="text-[10px] font-semibold text-gray-400 uppercase tracking-widest px-3 py-2">Recent</p>
            {sessions.map(s => (
              <Link key={s.id} to={`/result/${s.id}`}
                className="flex items-start gap-2.5 px-3 py-2.5 hover:bg-white rounded-lg mx-1 transition-all group">
                <div className="w-6 h-6 rounded-md bg-white border border-gray-200 flex items-center justify-center flex-shrink-0 text-gray-400 group-hover:text-blue-500 group-hover:border-blue-200 mt-0.5 transition-colors">
                  <ToolIcon toolKey="roast" size={11} />
                </div>
                <div className="min-w-0 flex-1">
                  <p className="text-[12px] font-medium text-gray-700 truncate">{WORK_LABELS[s.work_type] || 'Roast'}</p>
                  <p className="text-[11px] text-gray-400">{fmt(s.created_at)}</p>
                </div>
              </Link>
            ))}
          </>
        )}
      </div>

      <div className="border-t border-gray-200 p-2">
        {user?.profile?.is_pro ? (
          <div className="px-3 py-2 text-[11px] font-bold text-blue-600">PRO — Unlimited</div>
        ) : (
          <Link to="/pricing"
            className="flex items-center gap-2 px-3 py-2 rounded-lg text-[12px] font-medium text-blue-600 hover:bg-blue-50 transition-colors">
            <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
              <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/>
            </svg>
            Upgrade to Pro
          </Link>
        )}
      </div>
    </aside>
  )
}

function ToolStrip({ activeTool, onSelect, onHome }) {
  return (
    <div className="flex items-center gap-1.5 px-3 py-2.5 border-b border-gray-200 bg-white overflow-x-auto flex-shrink-0">
      <button
        onClick={onHome}
        className="flex items-center justify-center w-7 h-7 rounded-lg text-gray-400 hover:text-gray-700 hover:bg-gray-100 transition-colors flex-shrink-0"
        title="Home"
      >
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
          <rect x="3" y="3" width="7" height="7" rx="1"/><rect x="14" y="3" width="7" height="7" rx="1"/>
          <rect x="14" y="14" width="7" height="7" rx="1"/><rect x="3" y="14" width="7" height="7" rx="1"/>
        </svg>
      </button>
      <div className="w-px h-5 bg-gray-200 flex-shrink-0" />
      {TOOLS.map(tool => (
        <button
          key={tool.key}
          onClick={() => onSelect(tool.key)}
          className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-[12px] font-medium transition-all whitespace-nowrap flex-shrink-0 ${
            activeTool === tool.key
              ? 'bg-blue-600 text-white shadow-sm'
              : 'bg-gray-100 text-gray-600 hover:bg-gray-200 hover:text-gray-900'
          }`}
        >
          <ToolIcon toolKey={tool.key} size={11} />
          {tool.label}
        </button>
      ))}
      <Link to="/cold-email"
        className="flex items-center gap-1.5 px-3 py-1.5 rounded-full text-[12px] font-medium text-gray-600 bg-gray-100 hover:bg-gray-200 whitespace-nowrap flex-shrink-0">
        <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round">
          <path d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"/>
        </svg>
        Cold Email ↗
      </Link>
    </div>
  )
}

function WelcomeScreen({ user, activeTool, onSelectTool, inputValue, onInputChange, onSend, inputRef }) {
  const hour = new Date().getHours()
  const name = user?.first_name || user?.username
  const greeting = name
    ? (hour < 12 ? `Good morning, ${name}` : hour < 17 ? `Good afternoon, ${name}` : `Good evening, ${name}`)
    : 'What do you want to work on?'

  const meta     = TOOLS.find(t => t.key === activeTool)
  const needsText = activeTool && !!meta?.placeholder
  const canSend   = activeTool && (!needsText || inputValue.trim())

  const inputPlaceholder = !activeTool
    ? 'Choose a tool below to get started...'
    : meta?.placeholder || 'Click → to start'

  return (
    <div className="flex flex-col h-full bg-white overflow-y-auto">
      <div className="flex-1 flex flex-col items-center justify-center px-6 pb-8">
        <div className="w-full max-w-2xl">

          {/* Greeting */}
          <h1 className="text-[28px] font-bold text-[#0f2744] text-center mb-8 leading-tight">{greeting}</h1>

          {/* Big input bar */}
          <div className={`flex items-center gap-2 border-2 rounded-2xl bg-white shadow-sm px-4 py-3.5 mb-4 transition-all ${
            activeTool ? 'border-blue-300 shadow-blue-50/60' : 'border-gray-200 hover:border-gray-300'
          }`}>
            {activeTool && (
              <span className="flex items-center gap-1.5 bg-blue-50 border border-blue-200 text-blue-700 text-[11px] font-semibold rounded-lg px-2 py-1 flex-shrink-0">
                <ToolIcon toolKey={activeTool} size={11} />
                {meta?.label}
                <button
                  onClick={() => onSelectTool(null)}
                  className="ml-0.5 text-blue-400 hover:text-blue-700 transition-colors"
                >
                  <svg width="9" height="9" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round">
                    <line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>
                  </svg>
                </button>
              </span>
            )}
            <input
              ref={inputRef}
              value={inputValue}
              onChange={e => onInputChange(e.target.value)}
              onKeyDown={e => { if (e.key === 'Enter' && canSend) onSend() }}
              placeholder={inputPlaceholder}
              disabled={!activeTool || !meta?.placeholder}
              className="flex-1 outline-none text-sm text-gray-800 placeholder-gray-300 bg-transparent disabled:cursor-default min-w-0"
            />
            <button
              onClick={onSend}
              disabled={!canSend}
              className="w-9 h-9 rounded-xl bg-blue-600 disabled:bg-gray-100 flex items-center justify-center flex-shrink-0 transition-colors hover:bg-blue-700"
            >
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none"
                stroke={canSend ? 'white' : '#d1d5db'} strokeWidth="2.5" strokeLinecap="round">
                <line x1="5" y1="12" x2="19" y2="12"/><polyline points="12 5 19 12 12 19"/>
              </svg>
            </button>
          </div>

          {/* Tool chips */}
          <div className="flex flex-wrap gap-2 justify-center mb-5">
            {TOOLS.map(t => (
              <button
                key={t.key}
                onClick={() => onSelectTool(t.key)}
                className={`flex items-center gap-1.5 px-3.5 py-2 rounded-full text-[13px] font-medium border transition-all ${
                  activeTool === t.key
                    ? 'bg-blue-600 border-blue-600 text-white shadow-sm'
                    : 'bg-white border-gray-200 text-gray-600 hover:border-blue-300 hover:bg-blue-50 hover:text-blue-700'
                }`}
              >
                <ToolIcon toolKey={t.key} size={13} />
                {t.label}
              </button>
            ))}
            <Link to="/cold-email"
              className="flex items-center gap-1.5 px-3.5 py-2 rounded-full text-[13px] font-medium bg-[#0f2744] border border-[#0f2744] text-white hover:bg-[#1a3a6e] transition-colors">
              <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round">
                <path d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"/>
              </svg>
              Cold Email ↗
            </Link>
          </div>

          {/* Credits strip */}
          {user && !user.profile?.is_pro && (
            <div className="flex items-center justify-between bg-gray-50 border border-gray-100 rounded-xl px-4 py-2.5 text-sm">
              <span className="text-gray-500">
                <span className="font-semibold text-gray-900">{user.profile?.roast_credits ?? 0}</span> credits remaining
              </span>
              <Link to="/pricing" className="text-xs font-semibold text-blue-600 hover:text-blue-700">Upgrade to Pro →</Link>
            </div>
          )}

        </div>
      </div>
    </div>
  )
}

export default function Home() {
  const { user, openAuthModal } = useAuth()
  const [activeTool,   setActiveTool]   = useState(null)
  const [chatStarted,  setChatStarted]  = useState(false)
  const [initialInput, setInitialInput] = useState('')
  const [chatKey,      setChatKey]      = useState(0)
  const [inputValue,   setInputValue]   = useState('')
  const [sessions,     setSessions]     = useState([])
  const inputRef = useRef()

  useEffect(() => {
    if (user) {
      roastApi.history()
        .then(({ data }) => setSessions((data.results ?? data).slice(0, 20)))
        .catch(() => {})
    }
  }, [user])

  const handleSend = () => {
    if (!activeTool) return
    const meta = TOOLS.find(t => t.key === activeTool)
    if (meta?.placeholder && !inputValue.trim()) return
    setInitialInput(inputValue.trim())
    setInputValue('')
    setChatKey(k => k + 1)
    setChatStarted(true)
  }

  const handleSelectTool = (toolKey) => {
    setActiveTool(toolKey)
    if (toolKey) setTimeout(() => inputRef.current?.focus(), 50)
  }

  const handleToolStripSelect = (toolKey) => {
    setActiveTool(toolKey)
    setInitialInput('')
    setChatKey(k => k + 1)
    setChatStarted(true)
  }

  const goHome = () => {
    setChatStarted(false)
    setActiveTool(null)
    setInitialInput('')
    setInputValue('')
  }

  return (
    <div className="flex overflow-hidden" style={{ height: 'calc(100vh - 56px)' }}>
      <HistorySidebar onHome={goHome} sessions={sessions} user={user} openAuthModal={openAuthModal} />

      <div className="flex-1 flex flex-col overflow-hidden min-w-0">
        {chatStarted ? (
          <>
            <ToolStrip activeTool={activeTool} onSelect={handleToolStripSelect} onHome={goHome} />
            <ToolChat
              key={`${activeTool}-${chatKey}`}
              tool={activeTool}
              initialInput={initialInput}
              onRestart={goHome}
              showHeader={false}
            />
          </>
        ) : (
          <WelcomeScreen
            user={user}
            activeTool={activeTool}
            onSelectTool={handleSelectTool}
            inputValue={inputValue}
            onInputChange={setInputValue}
            onSend={handleSend}
            inputRef={inputRef}
          />
        )}
      </div>
    </div>
  )
}
