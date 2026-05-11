import { useState, useRef } from 'react'
import { useGoogleLogin } from '@react-oauth/google'
import { useAuth } from '../context/AuthContext'
import AuthModal from '../components/AuthModal'
import api from '../api/client'

const PURPOSES = [
  { value: 'job_application', label: 'Apply for a job' },
  { value: 'networking',      label: 'Build a connection' },
  { value: 'referral',        label: 'Ask for a referral' },
  { value: 'informational',   label: 'Request informational chat' },
]

const TONES = [
  { value: 'professional', label: 'Professional' },
  { value: 'casual',       label: 'Warm & casual' },
  { value: 'direct',       label: 'Short & direct' },
]

function encodeEmail(raw) {
  return btoa(unescape(encodeURIComponent(raw)))
    .replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '')
}

function buildRaw({ variant, template, form, userName }) {
  let body, contentType
  if (template === 'professional') {
    contentType = 'text/html; charset=UTF-8'
    const htmlLines = variant.body
      .split('\n')
      .map(l => l.trim() ? `<p style="margin:0 0 14px 0">${l}</p>` : '')
      .join('')
    body = `<!DOCTYPE html><html><body style="font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Arial,sans-serif;max-width:580px;margin:0 auto;padding:24px;color:#1e293b;line-height:1.7;font-size:15px">${htmlLines}<div style="margin-top:28px;padding-top:16px;border-top:1px solid #e2e8f0;color:#64748b;font-size:13px">Best regards,<br><strong style="color:#1e293b">${userName}</strong></div></body></html>`
  } else {
    contentType = 'text/plain; charset=UTF-8'
    body = variant.body
  }
  return [
    `To: ${form.recipientName} <${form.recipientEmail}>`,
    `Subject: ${variant.subject}`,
    'MIME-Version: 1.0',
    `Content-Type: ${contentType}`,
    '',
    body,
  ].join('\r\n')
}

export default function ColdEmail() {
  const { user, showAuthModal, openAuthModal } = useAuth()

  const [form, setForm] = useState({
    recipientName: '', recipientEmail: '',
    recipientRole: '', recipientCompany: '',
    purpose: 'job_application', tone: 'professional',
    userBackground: '',
  })
  const [loading, setLoading]           = useState(false)
  const [result, setResult]             = useState(null)
  const [selectedVariant, setVariant]   = useState(0)
  const [template, setTemplate]         = useState('plain')
  const [sending, setSending]           = useState(false)
  const [sent, setSent]                 = useState(false)
  const [error, setError]               = useState('')
  const [sendError, setSendError]       = useState('')
  const [gmailToken, setGmailToken]     = useState(null)

  const sendFnRef = useRef(null)

  const set = key => e => setForm(f => ({ ...f, [key]: e.target.value }))

  const generate = async () => {
    if (!user && !localStorage.getItem('access_token')) { openAuthModal(() => generate()); return }
    const { recipientName, recipientRole, recipientCompany, userBackground } = form
    if (!recipientName || !recipientRole || !recipientCompany || !userBackground) {
      setError('Please fill in all required fields (marked *).')
      return
    }
    setError('')
    setLoading(true)
    setSent(false)
    try {
      const { data } = await api.post('/tools/cold-email/generate/', {
        target_name:     form.recipientName,
        target_role:     form.recipientRole,
        target_company:  form.recipientCompany,
        purpose:         form.purpose,
        tone:            form.tone,
        user_background: form.userBackground,
      })
      setResult(data)
      setVariant(0)
    } catch {
      setError('Generation failed. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  const doSend = async (token) => {
    if (!form.recipientEmail) { setSendError("Enter recipient's email first."); return }
    setSending(true)
    setSendError('')
    try {
      const variant = result.variants[selectedVariant]
      const userName = user?.first_name || user?.username || 'Me'
      const raw = buildRaw({ variant, template, form, userName })
      const res = await fetch('https://gmail.googleapis.com/gmail/v1/users/me/messages/send', {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${token}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({ raw: encodeEmail(raw) }),
      })
      if (!res.ok) {
        if (res.status === 401) { setGmailToken(null); throw new Error('auth') }
        throw new Error()
      }
      await api.post('/tools/cold-email/deduct/')
      setSent(true)
    } catch (e) {
      setSendError(e.message === 'auth'
        ? 'Gmail session expired. Click Send again to re-authorize.'
        : 'Failed to send. Please try again.')
    } finally {
      setSending(false)
    }
  }

  sendFnRef.current = doSend

  const requestGmail = useGoogleLogin({
    scope: 'https://www.googleapis.com/auth/gmail.send',
    flow: 'implicit',
    onSuccess: (t) => { setGmailToken(t.access_token); sendFnRef.current(t.access_token) },
    onError: () => setSendError('Gmail authorization failed. Please try again.'),
  })

  const handleSend = () => {
    setSendError('')
    if (!form.recipientEmail) { setSendError("Enter recipient's email address first."); return }
    if (gmailToken) doSend(gmailToken)
    else requestGmail()
  }

  const variant = result?.variants?.[selectedVariant]

  return (
    <div className="min-h-screen bg-[#f8fafc]">
      {/* Navbar */}
      <nav className="bg-[#0f2744] px-5 py-3.5 flex items-center justify-between shadow-sm">
        <div className="flex items-center gap-2.5">
          <a href="/" className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-lg bg-blue-500 flex items-center justify-center">
              <svg width="13" height="13" viewBox="0 0 24 24" fill="none">
                <path d="M12 3C9.5 7.5 8 10.5 8 14a4 4 0 0 0 8 0c0-3.5-1.5-6.5-4-11Z" fill="white" fillOpacity="0.95"/>
              </svg>
            </div>
            <span className="font-bold text-white text-sm">RoastMyWork</span>
          </a>
          <span className="text-blue-400 text-sm">/</span>
          <span className="text-blue-200 text-sm font-medium">Cold Email Builder</span>
        </div>
        <div className="flex items-center gap-3">
          {user ? (
            <div className="flex items-center gap-2">
              <div className="w-7 h-7 rounded-full bg-blue-700 flex items-center justify-center text-xs font-bold text-white">
                {(user.first_name?.[0] || user.username?.[0] || '?').toUpperCase()}
              </div>
              <span className="text-blue-200 text-sm hidden sm:block">{user.first_name || user.username}</span>
            </div>
          ) : (
            <button onClick={() => openAuthModal()} className="text-sm text-blue-200 hover:text-white transition-colors">
              Sign in
            </button>
          )}
          <a href="/" className="text-xs text-blue-400 hover:text-blue-200 transition-colors">
            All tools →
          </a>
        </div>
      </nav>

      {/* Page header */}
      <div className="bg-white border-b border-gray-200 px-5 py-6">
        <div className="max-w-6xl mx-auto">
          <h1 className="text-xl font-bold text-[#0f2744]">Cold Email Builder</h1>
          <p className="text-gray-500 text-sm mt-0.5">
            AI writes 3 different email variants. Regenerate as many times as you want. Send directly from your Gmail — one click.
          </p>
        </div>
      </div>

      {/* Main content */}
      <div className="max-w-6xl mx-auto px-4 py-6">
        <div className="grid grid-cols-1 lg:grid-cols-[400px_1fr] gap-5">

          {/* LEFT: Inputs */}
          <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-5">
            <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-4">Who are you writing to?</p>

            <div className="space-y-3.5">
              <div className="grid grid-cols-2 gap-3">
                <Field label="Name *" value={form.recipientName} onChange={set('recipientName')} placeholder="Sarah Chen" />
                <Field label="Role *" value={form.recipientRole} onChange={set('recipientRole')} placeholder="Eng Manager" />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <Field label="Company *" value={form.recipientCompany} onChange={set('recipientCompany')} placeholder="Stripe" />
                <Field label="Their email" value={form.recipientEmail} onChange={set('recipientEmail')} placeholder="sarah@stripe.com" type="email" />
              </div>

              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1.5">Purpose</label>
                <select
                  value={form.purpose}
                  onChange={set('purpose')}
                  className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white text-gray-800"
                >
                  {PURPOSES.map(p => <option key={p.value} value={p.value}>{p.label}</option>)}
                </select>
              </div>

              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1.5">Tone</label>
                <div className="flex gap-2">
                  {TONES.map(t => (
                    <button
                      key={t.value}
                      onClick={() => setForm(f => ({ ...f, tone: t.value }))}
                      className={`flex-1 py-2 rounded-lg text-xs font-medium border transition-all ${
                        form.tone === t.value
                          ? 'bg-blue-600 text-white border-blue-600'
                          : 'bg-white text-gray-600 border-gray-200 hover:border-blue-300'
                      }`}
                    >
                      {t.label}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1.5">About you *</label>
                <textarea
                  value={form.userBackground}
                  onChange={set('userBackground')}
                  rows={5}
                  placeholder="Your role, experience, skills, and what you're looking for. Or paste your resume summary. The more specific you are, the better the email."
                  className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none text-gray-800 placeholder-gray-400"
                />
              </div>

              {error && (
                <p className="text-red-500 text-xs bg-red-50 px-3 py-2 rounded-lg">{error}</p>
              )}

              <button
                onClick={generate}
                disabled={loading}
                className="w-full py-3 bg-blue-600 hover:bg-blue-700 disabled:bg-blue-300 text-white rounded-xl font-semibold text-sm transition-colors flex items-center justify-center gap-2"
              >
                {loading ? (
                  <>
                    <div className="w-4 h-4 border-2 border-white/40 border-t-white rounded-full animate-spin" />
                    Writing your emails...
                  </>
                ) : result ? (
                  <>
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none">
                      <path d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                    </svg>
                    Regenerate all 3 variants
                  </>
                ) : 'Generate Email'}
              </button>

              {result && (
                <p className="text-center text-xs text-gray-400">Regenerate is free — try different tones or phrasings</p>
              )}
            </div>
          </div>

          {/* RIGHT: Preview */}
          <div className="space-y-4">
            {!result ? (
              <div className="bg-white rounded-2xl border border-gray-200 shadow-sm flex flex-col items-center justify-center text-center p-12 min-h-[420px]">
                <div className="w-14 h-14 rounded-2xl bg-blue-50 flex items-center justify-center mb-4">
                  <svg width="26" height="26" viewBox="0 0 24 24" fill="none">
                    <path d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" stroke="#2563eb" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                  </svg>
                </div>
                <p className="text-gray-400 text-sm max-w-xs">
                  Fill in the details on the left and click <strong className="text-gray-500">Generate Email</strong> — you'll get 3 completely different variants instantly.
                </p>
              </div>
            ) : (
              <>
                {/* Variant tabs */}
                <div className="flex gap-2">
                  {result.variants.map((v, i) => (
                    <button
                      key={i}
                      onClick={() => { setVariant(i); setSent(false); setSendError('') }}
                      className={`px-4 py-2 rounded-xl text-sm font-medium transition-all border ${
                        selectedVariant === i
                          ? 'bg-[#0f2744] text-white border-[#0f2744] shadow-sm'
                          : 'bg-white text-gray-600 border-gray-200 hover:border-blue-300 hover:text-blue-600'
                      }`}
                    >
                      {v.style}
                    </button>
                  ))}
                </div>

                {/* Email card */}
                <div className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden">
                  {/* Email meta header */}
                  <div className="bg-gray-50 border-b border-gray-200 px-5 py-4 space-y-2.5">
                    {[
                      { label: 'From', value: user?.first_name ? `${user.first_name} ${user.last_name || ''}`.trim() : user?.username || 'You' },
                      { label: 'To',   value: form.recipientName + (form.recipientEmail ? ` <${form.recipientEmail}>` : '') },
                      { label: 'Subject', value: variant?.subject, bold: true },
                    ].map(row => (
                      <div key={row.label} className="flex items-start gap-3 text-sm">
                        <span className="text-gray-400 w-14 text-right shrink-0 pt-0.5">{row.label}</span>
                        <span className={row.bold ? 'text-gray-900 font-semibold' : 'text-gray-700'}>{row.value}</span>
                      </div>
                    ))}
                  </div>

                  {/* Email body */}
                  <div className="px-6 py-5">
                    <div className="text-sm text-gray-800 leading-relaxed whitespace-pre-line">
                      {variant?.body}
                    </div>

                    {template === 'professional' && (
                      <div className="mt-5 pt-4 border-t border-gray-100 text-xs text-gray-500 leading-relaxed">
                        Best regards,<br />
                        <span className="font-semibold text-gray-700">
                          {user?.first_name ? `${user.first_name} ${user.last_name || ''}`.trim() : user?.username || 'Your Name'}
                        </span>
                      </div>
                    )}
                  </div>

                  {/* Tips */}
                  {result.tips?.length > 0 && (
                    <div className="mx-5 mb-5 px-4 py-3 bg-blue-50 rounded-xl border border-blue-100">
                      <p className="text-xs font-semibold text-blue-700 mb-1.5">Sending tips</p>
                      <ul className="text-xs text-blue-600 space-y-1">
                        {result.tips.map((tip, i) => (
                          <li key={i} className="flex gap-1.5">
                            <span className="shrink-0 mt-0.5">•</span>
                            <span>{tip}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}
                </div>

                {/* Template + Send bar */}
                <div className="bg-white rounded-2xl border border-gray-200 shadow-sm px-5 py-4 flex flex-col sm:flex-row sm:items-center gap-4">
                  <div className="flex items-center gap-2.5">
                    <span className="text-xs font-medium text-gray-500 shrink-0">Signature:</span>
                    {[
                      { val: 'plain', label: 'None' },
                      { val: 'professional', label: 'Add signature' },
                    ].map(t => (
                      <button
                        key={t.val}
                        onClick={() => setTemplate(t.val)}
                        className={`px-3 py-1.5 rounded-lg text-xs font-medium border transition-all ${
                          template === t.val
                            ? 'bg-[#0f2744] text-white border-[#0f2744]'
                            : 'bg-white text-gray-600 border-gray-200 hover:border-gray-400'
                        }`}
                      >
                        {t.label}
                      </button>
                    ))}
                  </div>

                  <div className="sm:ml-auto flex flex-col sm:flex-row items-start sm:items-center gap-3">
                    {sendError && (
                      <p className="text-red-500 text-xs">{sendError}</p>
                    )}
                    {sent ? (
                      <div className="flex items-center gap-2 text-green-600 font-semibold text-sm">
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
                          <path d="M20 6L9 17l-5-5" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"/>
                        </svg>
                        Email sent!
                      </div>
                    ) : (
                      <button
                        onClick={handleSend}
                        disabled={sending}
                        className="flex items-center gap-2 px-5 py-2.5 bg-[#0f2744] hover:bg-[#1a3a6e] disabled:bg-gray-300 text-white rounded-xl text-sm font-semibold transition-colors"
                      >
                        {sending ? (
                          <>
                            <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                            Sending...
                          </>
                        ) : (
                          <>
                            <svg width="14" height="14" viewBox="0 0 24 24" fill="none">
                              <path d="M22 2L11 13M22 2l-7 20-4-9-9-4 20-7z" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                            </svg>
                            Send via Gmail
                          </>
                        )}
                      </button>
                    )}
                  </div>
                </div>

                <p className="text-center text-xs text-gray-400 pb-2">
                  Clicking "Send via Gmail" will open a Google authorization popup — you approve once, then it sends directly from your Gmail.
                </p>
              </>
            )}
          </div>
        </div>
      </div>

      {showAuthModal && <AuthModal />}
    </div>
  )
}

function Field({ label, value, onChange, placeholder, type = 'text' }) {
  return (
    <div>
      <label className="block text-xs font-medium text-gray-600 mb-1.5">{label}</label>
      <input
        type={type}
        value={value}
        onChange={onChange}
        placeholder={placeholder}
        className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-gray-800 placeholder-gray-400"
      />
    </div>
  )
}
