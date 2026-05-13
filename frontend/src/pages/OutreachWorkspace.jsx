import { useEffect, useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { outreachWorkspaceApi } from '../api/client'
import { useAuth } from '../context/AuthContext'
import AuthModal from '../components/AuthModal'

const STORAGE_KEY = 'roastmywork_outreach_tracker'
const STATUSES = ['Drafted', 'Sent', 'Followed up', 'Replied', 'Interview', 'Rejected']

const EMPTY_FORM = {
  company: '',
  targetRole: '',
  jobDescription: '',
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
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [result, setResult] = useState(null)
  const [copied, setCopied] = useState('')
  const [tracker, setTracker] = useState(loadTracker)

  useEffect(() => saveTracker(tracker), [tracker])

  const requiredReady = form.company.trim() && form.targetRole.trim() && form.userBackground.trim()
  const contactLabel = useMemo(() => {
    if (form.contactName && form.contactRole) return `${form.contactName}, ${form.contactRole}`
    return form.contactName || form.contactRole || 'Best-fit contact'
  }, [form.contactName, form.contactRole])

  const set = key => e => setForm(prev => ({ ...prev, [key]: e.target.value }))

  const generate = async () => {
    if (!user && !localStorage.getItem('access_token')) {
      openAuthModal(() => generate())
      return
    }
    if (!requiredReady) {
      setError('Company, target role, and your background are required.')
      return
    }
    setError('')
    setLoading(true)
    setCopied('')
    try {
      const { data } = await outreachWorkspaceApi.generate({
        company: form.company,
        target_role: form.targetRole,
        job_description: form.jobDescription,
        contact_name: form.contactName,
        contact_role: form.contactRole,
        contact_channel: form.contactChannel,
        user_background: form.userBackground,
        resume_highlights: form.resumeHighlights,
      })
      setResult(data)
      refreshUser?.()
    } catch (e) {
      const detail = e.response?.data?.detail
      setError(detail || 'Could not generate the workspace. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  const copyText = async (id, message) => {
    const text = message.subject ? `Subject: ${message.subject}\n\n${message.body}` : message.body
    await navigator.clipboard.writeText(text)
    setCopied(id)
    window.setTimeout(() => setCopied(''), 1600)
  }

  const addToTracker = () => {
    const item = {
      id: window.crypto?.randomUUID?.() || `${Date.now()}-${Math.random().toString(16).slice(2)}`,
      company: form.company,
      role: form.targetRole,
      contact: contactLabel,
      status: result?.tracker?.initial_status || 'Drafted',
      nextAction: result?.tracker?.next_action || 'Send first outreach message',
      createdAt: new Date().toISOString(),
    }
    setTracker(prev => [item, ...prev])
  }

  const updateTracker = (id, patch) => {
    setTracker(prev => prev.map(item => item.id === id ? { ...item, ...patch } : item))
  }

  const removeTracker = id => {
    setTracker(prev => prev.filter(item => item.id !== id))
  }

  return (
    <div className="min-h-screen bg-[#f6f8fb]">
      <nav className="bg-white border-b border-slate-200 px-5 py-3.5">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <Link to="/" className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-lg bg-indigo-600 flex items-center justify-center">
              <svg width="13" height="13" viewBox="0 0 24 24" fill="none">
                <path d="M12 3C9.5 7.5 8 10.5 8 14a4 4 0 0 0 8 0c0-3.5-1.5-6.5-4-11Z" fill="white"/>
              </svg>
            </div>
            <span className="font-bold text-slate-900 text-sm">RoastMyWork</span>
            <span className="text-slate-300">/</span>
            <span className="text-slate-500 text-sm">Outreach Workspace</span>
          </Link>
          <div className="flex items-center gap-3">
            {user ? (
              <span className="text-sm text-slate-500">{user.first_name || user.username}</span>
            ) : (
              <button onClick={() => openAuthModal()} className="text-sm text-indigo-600 font-medium">Sign in</button>
            )}
            <Link to="/" className="text-sm text-slate-500 hover:text-slate-900">All tools</Link>
          </div>
        </div>
      </nav>

      <main className="max-w-7xl mx-auto px-4 py-6">
        <div className="grid grid-cols-1 xl:grid-cols-[390px_1fr_320px] gap-5">
          <section className="bg-white border border-slate-200 rounded-xl p-5 shadow-sm h-fit">
            <div className="mb-5">
              <h1 className="text-xl font-bold text-slate-950">Outreach Workspace</h1>
              <p className="text-sm text-slate-500 mt-1">Create the message pack, next actions, and tracker entry for one job target.</p>
            </div>

            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-3">
                <Field label="Company *" value={form.company} onChange={set('company')} placeholder="Stripe" />
                <Field label="Target role *" value={form.targetRole} onChange={set('targetRole')} placeholder="Frontend Engineer" />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <Field label="Contact name" value={form.contactName} onChange={set('contactName')} placeholder="Sarah Chen" />
                <Field label="Contact role" value={form.contactRole} onChange={set('contactRole')} placeholder="Recruiter" />
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-600 mb-1.5">Channel</label>
                <select value={form.contactChannel} onChange={set('contactChannel')} className="input-base">
                  <option>Email</option>
                  <option>LinkedIn</option>
                  <option>Both</option>
                </select>
              </div>
              <TextArea label="Job description" value={form.jobDescription} onChange={set('jobDescription')} placeholder="Paste the job post or the important requirements." rows={4} />
              <TextArea label="Your background *" value={form.userBackground} onChange={set('userBackground')} placeholder="Your role, experience, target, and what makes you relevant." rows={4} />
              <TextArea label="Resume highlights" value={form.resumeHighlights} onChange={set('resumeHighlights')} placeholder="Projects, metrics, tools, achievements, or ATS keywords to weave into outreach." rows={3} />

              {error && <p className="text-xs text-red-600 bg-red-50 border border-red-100 rounded-lg px-3 py-2">{error}</p>}

              <button
                onClick={generate}
                disabled={loading}
                className="w-full h-11 rounded-lg bg-indigo-600 hover:bg-indigo-700 disabled:bg-indigo-300 text-white font-semibold text-sm flex items-center justify-center gap-2"
              >
                {loading && <span className="w-4 h-4 border-2 border-white/40 border-t-white rounded-full animate-spin" />}
                {loading ? 'Building workspace...' : result ? 'Regenerate workspace' : 'Build outreach workspace'}
              </button>
            </div>
          </section>

          <section className="space-y-5">
            {!result ? (
              <div className="bg-white border border-slate-200 rounded-xl min-h-[520px] flex items-center justify-center text-center px-8 shadow-sm">
                <div className="max-w-md">
                  <div className="w-14 h-14 rounded-xl bg-indigo-50 text-indigo-600 mx-auto mb-4 flex items-center justify-center">
                    <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M21 15a4 4 0 0 1-4 4H7l-4 3V7a4 4 0 0 1 4-4h10a4 4 0 0 1 4 4z"/>
                      <path d="M8 9h8M8 13h5"/>
                    </svg>
                  </div>
                  <h2 className="text-lg font-bold text-slate-900">Not another blank AI chat</h2>
                  <p className="text-sm text-slate-500 mt-2">This turns one target job into reusable outreach assets, a follow-up plan, and a trackable next action.</p>
                </div>
              </div>
            ) : (
              <>
                <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-sm">
                  <div className="flex items-start justify-between gap-4">
                    <div>
                      <p className="text-xs font-semibold uppercase tracking-wide text-slate-400">Positioning</p>
                      <h2 className="text-lg font-bold text-slate-950 mt-1">{result.positioning?.angle}</h2>
                    </div>
                    <button onClick={addToTracker} className="shrink-0 rounded-lg bg-slate-950 text-white text-sm font-semibold px-4 py-2 hover:bg-slate-800">Add to tracker</button>
                  </div>
                  <div className="grid md:grid-cols-2 gap-4 mt-4">
                    <InfoList title="Proof points" items={result.positioning?.proof_points} />
                    <InfoList title="Fix before sending" items={result.positioning?.gaps_to_fix} />
                  </div>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                  {result.messages?.map((message, index) => {
                    const id = `${message.type}-${index}`
                    return (
                      <article key={id} className="bg-white border border-slate-200 rounded-xl shadow-sm overflow-hidden">
                        <div className="px-4 py-3 bg-slate-50 border-b border-slate-200 flex items-start justify-between gap-3">
                          <div>
                            <p className="text-xs font-semibold text-indigo-600">{message.type}</p>
                            <h3 className="text-sm font-bold text-slate-900">{message.label}</h3>
                          </div>
                          <button onClick={() => copyText(id, message)} className="rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-xs font-semibold text-slate-600 hover:border-indigo-300 hover:text-indigo-600">
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
                  <p className="text-xs font-semibold uppercase tracking-wide text-slate-400 mb-3">Follow-up plan</p>
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
              </>
            )}
          </section>

          <aside className="bg-white border border-slate-200 rounded-xl p-5 shadow-sm h-fit">
            <div className="flex items-center justify-between gap-3 mb-4">
              <div>
                <h2 className="text-base font-bold text-slate-950">Tracker</h2>
                <p className="text-xs text-slate-500">Local MVP for targets and next actions.</p>
              </div>
              <span className="text-xs font-semibold text-slate-400">{tracker.length}</span>
            </div>

            {tracker.length === 0 ? (
              <p className="text-sm text-slate-500 bg-slate-50 border border-slate-200 rounded-lg px-3 py-4">Generated workspaces can be saved here so users know who to contact next.</p>
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
        </div>
      </main>

      {showAuthModal && <AuthModal />}
    </div>
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

function TextArea({ label, value, onChange, placeholder, rows }) {
  return (
    <div>
      <label className="block text-xs font-semibold text-slate-600 mb-1.5">{label}</label>
      <textarea value={value} onChange={onChange} placeholder={placeholder} rows={rows} className="input-base resize-none" />
    </div>
  )
}

function InfoList({ title, items = [] }) {
  return (
    <div className="rounded-lg bg-slate-50 border border-slate-200 p-3">
      <p className="text-xs font-semibold text-slate-500 mb-2">{title}</p>
      <ul className="space-y-1.5">
        {(items.length ? items : ['No items returned.']).map((item, index) => (
          <li key={index} className="text-sm text-slate-700 flex gap-2">
            <span className="mt-2 w-1.5 h-1.5 rounded-full bg-indigo-500 shrink-0" />
            <span>{item}</span>
          </li>
        ))}
      </ul>
    </div>
  )
}
