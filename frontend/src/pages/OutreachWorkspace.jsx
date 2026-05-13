import { useEffect, useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { outreachWorkspaceApi } from '../api/client'
import { useAuth } from '../context/AuthContext'
import AuthModal from '../components/AuthModal'

const STORAGE_KEY = 'roastmywork_outreach_tracker'
const STATUSES = ['Drafted', 'Sent', 'Followed up', 'Replied', 'Interview', 'Rejected']

const QUICK_STARTS = [
  'Paste job post + your resume summary',
  'Paste LinkedIn profile + why you want to connect',
  'Paste company + role + your strongest proof points',
]

const EMPTY_FORM = {
  rawContext: '',
  company: '',
  targetRole: '',
  contactName: '',
  contactRole: '',
  contactChannel: 'Both',
  userBackground: '',
  resumeHighlights: '',
}

function loadTracker() {
  try {
    return JSON.parse(localStorage.getItem(STORAGE_KEY) || '[]')
  } catch {
    return []
  }
}

function saveTracker(items) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(items))
}

export default function OutreachWorkspace() {
  const { user, showAuthModal, openAuthModal, refreshUser } = useAuth()
  const [form, setForm] = useState(EMPTY_FORM)
  const [showDetails, setShowDetails] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [result, setResult] = useState(null)
  const [copied, setCopied] = useState('')
  const [tracker, setTracker] = useState(loadTracker)

  useEffect(() => saveTracker(tracker), [tracker])

  const canGenerate = form.rawContext.trim() || (form.company.trim() && form.targetRole.trim() && form.userBackground.trim())
  const workspaceTitle = useMemo(() => {
    const company = form.company.trim() || 'Target company'
    const role = form.targetRole.trim() || 'target role'
    return `${company} · ${role}`
  }, [form.company, form.targetRole])

  const set = key => e => setForm(prev => ({ ...prev, [key]: e.target.value }))

  const generate = async () => {
    if (!user && !localStorage.getItem('access_token')) {
      openAuthModal(() => generate())
      return
    }
    if (!canGenerate) {
      setError('Paste the job/contact context, or open details and fill the key fields.')
      return
    }
    setError('')
    setLoading(true)
    setCopied('')
    try {
      const { data } = await outreachWorkspaceApi.generate({
        raw_context: form.rawContext,
        company: form.company,
        target_role: form.targetRole,
        contact_name: form.contactName,
        contact_role: form.contactRole,
        contact_channel: form.contactChannel,
        user_background: form.userBackground,
        resume_highlights: form.resumeHighlights,
      })
      setResult(data)
      refreshUser?.()
    } catch (e) {
      setError(e.response?.data?.detail || 'Could not generate the workspace. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  const copyText = async (id, message) => {
    const text = message.subject ? `Subject: ${message.subject}\n\n${message.body}` : message.body
    await navigator.clipboard.writeText(text)
    setCopied(id)
    window.setTimeout(() => setCopied(''), 1400)
  }

  const addToTracker = () => {
    const item = {
      id: window.crypto?.randomUUID?.() || `${Date.now()}-${Math.random().toString(16).slice(2)}`,
      company: form.company || 'Target company',
      role: form.targetRole || 'Target role',
      contact: [form.contactName, form.contactRole].filter(Boolean).join(', ') || 'Best-fit contact',
      status: result?.tracker?.initial_status || 'Drafted',
      nextAction: result?.tracker?.next_action || 'Send the first outreach message',
    }
    setTracker(prev => [item, ...prev])
  }

  const updateTracker = (id, patch) => {
    setTracker(prev => prev.map(item => item.id === id ? { ...item, ...patch } : item))
  }

  const removeTracker = id => setTracker(prev => prev.filter(item => item.id !== id))

  return (
    <div className="min-h-screen bg-[#f6f7fb]">
      <nav className="bg-white border-b border-slate-200 px-5 py-3.5">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <Link to="/" className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-indigo-600 flex items-center justify-center">
              <svg width="13" height="13" viewBox="0 0 24 24" fill="none">
                <path d="M12 3C9.5 7.5 8 10.5 8 14a4 4 0 0 0 8 0c0-3.5-1.5-6.5-4-11Z" fill="white"/>
              </svg>
            </div>
            <span className="font-bold text-slate-950 text-sm">RoastMyWork</span>
            <span className="text-slate-300">/</span>
            <span className="text-slate-500 text-sm">Outreach Workspace</span>
          </Link>
          <div className="flex items-center gap-4">
            {user ? <span className="text-sm text-slate-500">{user.first_name || user.username}</span> : <button onClick={() => openAuthModal()} className="text-sm text-indigo-600 font-semibold">Sign in</button>}
            <Link to="/" className="text-sm text-slate-500 hover:text-slate-900">All tools</Link>
          </div>
        </div>
      </nav>

      <main className="max-w-7xl mx-auto px-4 py-6">
        <div className="grid grid-cols-1 xl:grid-cols-[1fr_340px] gap-5">
          <section className="space-y-5">
            <div className="bg-white border border-slate-200 rounded-xl shadow-sm overflow-hidden">
              <div className="p-5 border-b border-slate-200">
                <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-4">
                  <div>
                    <h1 className="text-2xl font-bold text-slate-950">Turn any job lead into an outreach plan</h1>
                    <p className="text-sm text-slate-500 mt-1">Paste rough context. Get messages, follow-ups, and next actions without filling a long form.</p>
                  </div>
                  <div className="flex gap-2">
                    <button onClick={() => setForm(EMPTY_FORM)} className="rounded-lg border border-slate-200 px-3 py-2 text-sm font-semibold text-slate-600 hover:border-slate-300">Clear</button>
                    <button onClick={generate} disabled={loading || !canGenerate} className="rounded-lg bg-indigo-600 px-4 py-2 text-sm font-semibold text-white hover:bg-indigo-700 disabled:bg-slate-300">
                      {loading ? 'Building...' : 'Generate'}
                    </button>
                  </div>
                </div>
              </div>

              <div className="p-5">
                <div className="grid lg:grid-cols-[1fr_260px] gap-4">
                  <div>
                    <label className="block text-xs font-bold uppercase tracking-wide text-slate-400 mb-2">Fast input</label>
                    <textarea
                      value={form.rawContext}
                      onChange={set('rawContext')}
                      rows={9}
                      placeholder={`Paste anything useful:
- job description
- recruiter or hiring manager profile
- company + role
- your resume summary or strongest projects
- what you want: referral, intro, interview, reply`}
                      className="input-base resize-none text-[15px] leading-relaxed"
                    />
                    {error && <p className="mt-3 text-xs text-red-600 bg-red-50 border border-red-100 rounded-lg px-3 py-2">{error}</p>}
                  </div>

                  <div className="space-y-3">
                    <p className="text-xs font-bold uppercase tracking-wide text-slate-400">Examples</p>
                    {QUICK_STARTS.map(item => (
                      <button
                        key={item}
                        onClick={() => setForm(prev => ({ ...prev, rawContext: `${prev.rawContext}${prev.rawContext ? '\n\n' : ''}${item}: ` }))}
                        className="w-full text-left rounded-lg border border-slate-200 bg-slate-50 px-3 py-3 text-sm text-slate-600 hover:border-indigo-300 hover:bg-indigo-50"
                      >
                        {item}
                      </button>
                    ))}
                    <button onClick={() => setShowDetails(v => !v)} className="w-full rounded-lg border border-slate-200 px-3 py-3 text-sm font-semibold text-slate-700 hover:border-slate-300">
                      {showDetails ? 'Hide optional details' : 'Add optional details'}
                    </button>
                  </div>
                </div>

                {showDetails && (
                  <div className="mt-5 pt-5 border-t border-slate-200 grid md:grid-cols-2 lg:grid-cols-4 gap-3">
                    <Field label="Company" value={form.company} onChange={set('company')} placeholder="Stripe" />
                    <Field label="Target role" value={form.targetRole} onChange={set('targetRole')} placeholder="Frontend Engineer" />
                    <Field label="Contact name" value={form.contactName} onChange={set('contactName')} placeholder="Sarah Chen" />
                    <Field label="Contact role" value={form.contactRole} onChange={set('contactRole')} placeholder="Recruiter" />
                    <div>
                      <label className="block text-xs font-semibold text-slate-600 mb-1.5">Channel</label>
                      <select value={form.contactChannel} onChange={set('contactChannel')} className="input-base">
                        <option>Email</option>
                        <option>LinkedIn</option>
                        <option>Both</option>
                      </select>
                    </div>
                    <div className="md:col-span-2 lg:col-span-3">
                      <Field label="Your background" value={form.userBackground} onChange={set('userBackground')} placeholder="3 years frontend, React, dashboards, B2B SaaS..." />
                    </div>
                    <div className="md:col-span-2 lg:col-span-4">
                      <Field label="Resume highlights" value={form.resumeHighlights} onChange={set('resumeHighlights')} placeholder="Metrics, projects, tools, achievements, ATS keywords..." />
                    </div>
                  </div>
                )}
              </div>
            </div>

            {!result ? (
              <div className="grid md:grid-cols-3 gap-4">
                {[
                  ['1 paste', 'No forced CRM fields. Start with messy real-world context.'],
                  ['5 assets', 'Cold email, LinkedIn note, referral ask, follow-up, thank-you.'],
                  ['Next action', 'Save the company and move it through a simple tracker.'],
                ].map(([title, body]) => (
                  <div key={title} className="bg-white border border-slate-200 rounded-xl p-5 shadow-sm">
                    <h2 className="text-sm font-bold text-slate-950">{title}</h2>
                    <p className="text-sm text-slate-500 mt-2">{body}</p>
                  </div>
                ))}
              </div>
            ) : (
              <WorkspaceResult
                result={result}
                title={workspaceTitle}
                copied={copied}
                onCopy={copyText}
                onTrack={addToTracker}
              />
            )}
          </section>

          <TrackerPanel tracker={tracker} updateTracker={updateTracker} removeTracker={removeTracker} />
        </div>
      </main>

      {showAuthModal && <AuthModal />}
    </div>
  )
}

function WorkspaceResult({ result, title, copied, onCopy, onTrack }) {
  return (
    <div className="space-y-5">
      <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-sm">
        <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-4">
          <div>
            <p className="text-xs font-bold uppercase tracking-wide text-indigo-600">{title}</p>
            <h2 className="text-xl font-bold text-slate-950 mt-1">{result.positioning?.angle}</h2>
          </div>
          <button onClick={onTrack} className="rounded-lg bg-slate-950 text-white text-sm font-semibold px-4 py-2 hover:bg-slate-800">Save to tracker</button>
        </div>
        <div className="grid md:grid-cols-2 gap-4 mt-4">
          <InfoList title="Proof to mention" items={result.positioning?.proof_points} />
          <InfoList title="Fix before sending" items={result.positioning?.gaps_to_fix} />
        </div>
      </div>

      <div className="grid lg:grid-cols-2 gap-4">
        {result.messages?.map((message, index) => {
          const id = `${message.type}-${index}`
          return (
            <article key={id} className="bg-white border border-slate-200 rounded-xl shadow-sm overflow-hidden">
              <div className="px-4 py-3 bg-slate-50 border-b border-slate-200 flex items-start justify-between gap-3">
                <div>
                  <p className="text-xs font-semibold text-indigo-600">{message.type}</p>
                  <h3 className="text-sm font-bold text-slate-900">{message.label}</h3>
                </div>
                <button onClick={() => onCopy(id, message)} className="rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-xs font-semibold text-slate-600 hover:border-indigo-300 hover:text-indigo-600">
                  {copied === id ? 'Copied' : 'Copy'}
                </button>
              </div>
              <div className="p-4 space-y-3">
                {message.subject && (
                  <div>
                    <p className="text-[11px] font-semibold text-slate-400 uppercase">Subject</p>
                    <p className="text-sm font-semibold text-slate-900">{message.subject}</p>
                  </div>
                )}
                <p className="text-sm leading-relaxed text-slate-700 whitespace-pre-line">{message.body}</p>
                <p className="text-xs text-slate-500 bg-slate-50 rounded-lg px-3 py-2">{message.best_for}</p>
              </div>
            </article>
          )
        })}
      </div>

      <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-sm">
        <p className="text-xs font-bold uppercase tracking-wide text-slate-400 mb-3">Follow-up rhythm</p>
        <div className="grid md:grid-cols-3 gap-3">
          {result.follow_up_plan?.map(item => (
            <div key={item.day} className="rounded-lg border border-slate-200 p-3">
              <div className="flex items-center justify-between">
                <span className="text-sm font-bold text-slate-900">{item.day}</span>
                <span className="text-xs text-indigo-600 font-semibold">{item.channel}</span>
              </div>
              <p className="text-sm text-slate-600 mt-2">{item.action}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}

function TrackerPanel({ tracker, updateTracker, removeTracker }) {
  return (
    <aside className="bg-white border border-slate-200 rounded-xl p-5 shadow-sm h-fit xl:sticky xl:top-5">
      <div className="flex items-center justify-between gap-3 mb-4">
        <div>
          <h2 className="text-base font-bold text-slate-950">Pipeline</h2>
          <p className="text-xs text-slate-500">Quick status for active outreach.</p>
        </div>
        <span className="text-xs font-semibold text-slate-400">{tracker.length}</span>
      </div>

      {tracker.length === 0 ? (
        <p className="text-sm text-slate-500 bg-slate-50 border border-slate-200 rounded-lg px-3 py-4">Save a generated plan and track the next action here.</p>
      ) : (
        <div className="space-y-3">
          {tracker.map(item => (
            <div key={item.id} className="rounded-lg border border-slate-200 p-3">
              <div className="flex items-start justify-between gap-2">
                <div>
                  <h3 className="text-sm font-bold text-slate-900">{item.company}</h3>
                  <p className="text-xs text-slate-500">{item.role}</p>
                  <p className="text-xs text-slate-400 mt-1">{item.contact}</p>
                </div>
                <button onClick={() => removeTracker(item.id)} className="text-slate-300 hover:text-red-500" aria-label="Remove tracker item">
                  <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
                </button>
              </div>
              <select value={item.status} onChange={e => updateTracker(item.id, { status: e.target.value })} className="input-base mt-3 text-xs">
                {STATUSES.map(status => <option key={status}>{status}</option>)}
              </select>
              <textarea
                value={item.nextAction}
                onChange={e => updateTracker(item.id, { nextAction: e.target.value })}
                rows={2}
                className="input-base mt-2 text-xs resize-none"
              />
            </div>
          ))}
        </div>
      )}
    </aside>
  )
}

function Field({ label, value, onChange, placeholder }) {
  return (
    <div>
      <label className="block text-xs font-semibold text-slate-600 mb-1.5">{label}</label>
      <input value={value} onChange={onChange} placeholder={placeholder} className="input-base" />
    </div>
  )
}

function InfoList({ title, items = [] }) {
  const safeItems = items?.length ? items : ['No items returned.']
  return (
    <div className="rounded-lg bg-slate-50 border border-slate-200 p-3">
      <p className="text-xs font-semibold text-slate-500 mb-2">{title}</p>
      <ul className="space-y-1.5">
        {safeItems.map((item, index) => (
          <li key={index} className="text-sm text-slate-700 flex gap-2">
            <span className="mt-2 w-1.5 h-1.5 rounded-full bg-indigo-500 shrink-0" />
            <span>{item}</span>
          </li>
        ))}
      </ul>
    </div>
  )
}
