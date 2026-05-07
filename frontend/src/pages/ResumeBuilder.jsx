import { useState, useRef, useEffect } from 'react'
import { resumeApi } from '../api/client'
import { useAuth } from '../context/AuthContext'
import ResumePreview from '../components/ResumePreview'
import ResumeModern from '../components/ResumeModern'
import ResumeMinimal from '../components/ResumeMinimal'

const POLL_INTERVAL = 2000
const MAX_POLLS = 90

const TEMPLATES = [
  {
    id: 'classic',
    name: 'Classic',
    desc: 'Dark header, full-width layout',
    preview: (
      <div className="w-full h-full">
        <div className="bg-gray-900 h-6 w-full mb-1.5 rounded-sm" />
        <div className="px-1.5 space-y-1">
          <div className="bg-gray-200 h-1 w-3/4 rounded" />
          <div className="bg-gray-200 h-1 w-1/2 rounded" />
          <div className="bg-gray-100 h-px w-full rounded mt-1" />
          <div className="bg-gray-200 h-1 w-2/3 rounded" />
          <div className="bg-gray-200 h-1 w-4/5 rounded" />
        </div>
      </div>
    ),
  },
  {
    id: 'modern',
    name: 'Modern',
    desc: 'Two-column with sidebar',
    preview: (
      <div className="w-full h-full flex overflow-hidden rounded-sm">
        <div className="bg-slate-700 w-2/5 h-full flex flex-col p-1.5 gap-1">
          <div className="bg-slate-500 h-1.5 w-3/4 rounded" />
          <div className="bg-slate-600 h-1 w-1/2 rounded" />
          <div className="bg-slate-600 h-px w-full rounded mt-1" />
          <div className="bg-slate-600 h-1 w-2/3 rounded" />
          <div className="bg-slate-600 h-1 w-3/4 rounded" />
        </div>
        <div className="flex-1 p-1.5 space-y-1">
          <div className="bg-gray-200 h-1 w-full rounded" />
          <div className="bg-gray-200 h-1 w-4/5 rounded" />
          <div className="bg-gray-100 h-px w-full rounded mt-1" />
          <div className="bg-gray-200 h-1 w-3/4 rounded" />
        </div>
      </div>
    ),
  },
  {
    id: 'minimal',
    name: 'Minimal',
    desc: 'Clean typography, no color',
    preview: (
      <div className="w-full h-full bg-white p-1.5 space-y-1.5">
        <div className="bg-gray-800 h-2 w-2/3 rounded" />
        <div className="bg-gray-300 h-px w-full" />
        <div className="bg-gray-200 h-1 w-3/4 rounded" />
        <div className="bg-gray-200 h-1 w-4/5 rounded" />
        <div className="bg-gray-200 h-1 w-2/3 rounded" />
      </div>
    ),
  },
]

const STEPS = [
  { id: 'role',     label: 'Target role'       },
  { id: 'template', label: 'Resume style'       },
  { id: 'details',  label: 'Your background'    },
  { id: 'contact',  label: 'Contact info'       },
]

export default function ResumeBuilder() {
  const { user, openAuthModal, openUpgradeModal, refreshUser } = useAuth()
  const [step,     setStep]     = useState(0)
  const [role,     setRole]     = useState('')
  const [template, setTemplate] = useState('classic')
  const [details,  setDetails]  = useState('')
  const [contact,  setContact]  = useState({ name: '', email: '', phone: '', location: '' })
  const [status,   setStatus]   = useState('idle')
  const [resumeData, setResumeData] = useState(null)
  const [error,    setError]    = useState('')
  const inputRef = useRef()
  const pollRef  = useRef(null)

  useEffect(() => { inputRef.current?.focus() }, [step])

  const stopPolling = () => {
    if (pollRef.current) { clearInterval(pollRef.current); pollRef.current = null }
  }

  const pollResult = (id) => {
    let count = 0
    pollRef.current = setInterval(async () => {
      count++
      if (count > MAX_POLLS) {
        stopPolling(); setStatus('error'); setError('Generation timed out. Please try again.')
        return
      }
      try {
        const { data } = await resumeApi.get(id)
        if (data.status === 'completed' && data.resume_data) {
          stopPolling(); setResumeData(data.resume_data); setStatus('done'); refreshUser()
        } else if (data.status === 'failed') {
          stopPolling(); setStatus('error'); setError('AI failed to generate. Please try again.')
        }
      } catch {
        stopPolling(); setStatus('error'); setError('Error checking status.')
      }
    }, POLL_INTERVAL)
  }

  const doGenerate = async () => {
    setStatus('generating'); setError('')
    try {
      const raw = [
        contact.name     && `Name: ${contact.name}`,
        contact.email    && `Email: ${contact.email}`,
        contact.phone    && `Phone: ${contact.phone}`,
        contact.location && `Location: ${contact.location}`,
        details,
      ].filter(Boolean).join('\n')

      const { data } = await resumeApi.generate({
        target_role: role || 'Professional',
        raw_input: raw,
        template,
      })
      pollResult(data.id)
    } catch (err) {
      if (err.response?.status === 402) { setStatus('idle'); openUpgradeModal() }
      else { setStatus('error'); setError(err.response?.data?.detail || 'Something went wrong.') }
    }
  }

  const advance = () => {
    setError('')
    if (step === 0 && !role.trim()) { setError('Please enter a target role.'); return }
    if (step === 2 && !details.trim()) { setError('Please describe your background.'); return }
    setStep((s) => s + 1)
  }

  const handleGenerate = (e) => {
    e.preventDefault()
    if (!user) { openAuthModal(doGenerate); return }
    doGenerate()
  }

  // — Result view —
  if (status === 'done' && resumeData) {
    const TemplateComp =
      template === 'modern'  ? ResumeModern  :
      template === 'minimal' ? ResumeMinimal :
      ResumePreview

    return (
      <div className="max-w-8xl mx-auto px-6 py-8">
        <div className="flex items-center justify-between mb-6 no-print">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Your Resume</h1>
            <p className="text-gray-500 text-sm mt-0.5">
              {TEMPLATES.find((t) => t.id === template)?.name} template · AI-generated · Print-ready
            </p>
          </div>
          <div className="flex gap-2.5">
            <button
              onClick={() => { stopPolling(); setStatus('idle'); setResumeData(null); setStep(0) }}
              className="btn-secondary"
            >
              Build Another
            </button>
            <button onClick={() => window.print()} className="btn-primary">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <polyline points="6 9 6 2 18 2 18 9"/>
                <path d="M6 18H4a2 2 0 0 1-2-2v-5a2 2 0 0 1 2-2h16a2 2 0 0 1 2 2v5a2 2 0 0 1-2 2h-2"/>
                <rect x="6" y="14" width="12" height="8"/>
              </svg>
              Print / Save PDF
            </button>
          </div>
        </div>
        <div className="max-w-4xl">
          <TemplateComp data={resumeData} />
        </div>
      </div>
    )
  }

  // — Wizard view —
  return (
    <div className="min-h-[calc(100vh-56px)] flex flex-col items-center justify-center px-6 py-16">
      <div className="w-full max-w-2xl">

        {/* Step progress bar */}
        <div className="flex items-center gap-1.5 mb-10">
          {STEPS.map((s, i) => (
            <div key={i} className="flex-1 flex flex-col gap-1">
              <div className={`h-1 rounded-full transition-all duration-300 ${i <= step ? 'bg-orange-500' : 'bg-gray-200'}`} />
              <span className={`text-[10px] font-medium transition-colors ${i === step ? 'text-orange-600' : i < step ? 'text-gray-400' : 'text-gray-300'}`}>
                {s.label}
              </span>
            </div>
          ))}
        </div>

        <div className="space-y-6 animate-fade-up">
          {/* AI bubble */}
          <div className="flex gap-3">
            <div className="w-9 h-9 rounded-full bg-orange-500 flex items-center justify-center flex-shrink-0">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="white">
                <path d="M12 3C9.5 7.5 8 10.5 8 14a4 4 0 0 0 8 0c0-3.5-1.5-6.5-4-11Z"/>
                <path d="M12 12c-.8 1.8-1.2 3-1.2 4a1.2 1.2 0 0 0 2.4 0c0-1-.4-2.2-1.2-4Z" fillOpacity="0.5"/>
              </svg>
            </div>
            <div className="bg-white border border-gray-200 rounded-2xl rounded-tl-sm px-5 py-4 shadow-sm max-w-[calc(100%-3.5rem)]">
              {step === 0 && (
                <>
                  <p className="font-semibold text-gray-900">What role are you targeting?</p>
                  <p className="text-sm text-gray-500 mt-1">Be specific — the more precise, the better AI can tailor your resume.</p>
                </>
              )}
              {step === 1 && (
                <>
                  <p className="font-semibold text-gray-900">Choose your resume style</p>
                  <p className="text-sm text-gray-500 mt-1">Pick the layout that fits your field and preference.</p>
                </>
              )}
              {step === 2 && (
                <>
                  <p className="font-semibold text-gray-900">Tell me about your background</p>
                  <p className="text-sm text-gray-500 mt-1">Paste anything — job history, education, skills, projects. More detail = better resume.</p>
                </>
              )}
              {step === 3 && (
                <>
                  <p className="font-semibold text-gray-900">Last step — your contact details</p>
                  <p className="text-sm text-gray-500 mt-1">Optional. Leave blank if you'll fill in later.</p>
                </>
              )}
            </div>
          </div>

          {/* User input area */}
          <div className="ml-12">

            {step === 0 && (
              <input
                ref={inputRef}
                value={role}
                onChange={(e) => setRole(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && advance()}
                placeholder="e.g. Software Engineer, Product Manager, Data Scientist..."
                className="input-base text-[15px] py-3.5"
              />
            )}

            {step === 1 && (
              <div className="grid grid-cols-3 gap-3">
                {TEMPLATES.map((t) => (
                  <button
                    key={t.id}
                    onClick={() => setTemplate(t.id)}
                    className={`p-3 rounded-xl border-2 text-left transition-all duration-150 ${
                      template === t.id
                        ? 'border-orange-400 bg-orange-50'
                        : 'border-gray-200 bg-white hover:border-gray-300'
                    }`}
                  >
                    <div className="h-16 rounded-lg mb-3 overflow-hidden bg-gray-50 border border-gray-100">
                      {t.preview}
                    </div>
                    <p className="text-sm font-bold text-gray-900">{t.name}</p>
                    <p className="text-xs text-gray-500 mt-0.5 leading-tight">{t.desc}</p>
                  </button>
                ))}
              </div>
            )}

            {step === 2 && (
              <textarea
                ref={inputRef}
                value={details}
                onChange={(e) => setDetails(e.target.value)}
                placeholder={`Example:\n3 years backend engineer at fintech startup (Python, Django, PostgreSQL)\nBuilt payment API handling $2M/day\nBS Computer Science, NYU 2021, GPA 3.8\nSkills: Python, Docker, AWS, React\nAWS Certified Developer`}
                rows={9}
                className="input-base resize-none text-[13px] leading-relaxed"
              />
            )}

            {step === 3 && (
              <form onSubmit={handleGenerate} className="space-y-3">
                <div className="grid grid-cols-2 gap-3">
                  <input
                    className="input-base"
                    placeholder="Full Name"
                    value={contact.name}
                    onChange={(e) => setContact((p) => ({ ...p, name: e.target.value }))}
                  />
                  <input
                    className="input-base"
                    type="email"
                    placeholder="Email address"
                    value={contact.email}
                    onChange={(e) => setContact((p) => ({ ...p, email: e.target.value }))}
                  />
                  <input
                    className="input-base"
                    placeholder="Phone number"
                    value={contact.phone}
                    onChange={(e) => setContact((p) => ({ ...p, phone: e.target.value }))}
                  />
                  <input
                    className="input-base"
                    placeholder="City, State"
                    value={contact.location}
                    onChange={(e) => setContact((p) => ({ ...p, location: e.target.value }))}
                  />
                </div>

                {error && (
                  <div className="flex items-center gap-2 text-sm text-red-600 bg-red-50 border border-red-200 rounded-lg px-4 py-3">
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="flex-shrink-0">
                      <circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/>
                    </svg>
                    {error}
                  </div>
                )}

                <button
                  type="submit"
                  disabled={status === 'generating'}
                  className="btn-primary w-full py-3.5 text-[15px]"
                >
                  {status === 'generating' ? (
                    <>
                      <svg className="animate-spin" width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <path d="M21 12a9 9 0 1 1-6.219-8.56"/>
                      </svg>
                      Building your resume...
                    </>
                  ) : 'Generate My Resume'}
                </button>
                {status === 'generating' && (
                  <p className="text-center text-[12px] text-gray-400">Usually takes 15–30 seconds</p>
                )}
              </form>
            )}

            {/* Next button — shown on steps 0–2 */}
            {step < 3 && (
              <div className="mt-4 flex items-center justify-between">
                <button
                  type="button"
                  onClick={advance}
                  className="btn-primary px-6 py-2.5"
                >
                  Continue
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                    <line x1="5" y1="12" x2="19" y2="12"/><polyline points="12 5 19 12 12 19"/>
                  </svg>
                </button>
                {step > 0 && (
                  <button
                    type="button"
                    onClick={() => { setStep((s) => s - 1); setError('') }}
                    className="text-sm text-gray-400 hover:text-gray-600 transition-colors"
                  >
                    Back
                  </button>
                )}
              </div>
            )}

            {error && step < 3 && (
              <div className="mt-3 flex items-center gap-2 text-sm text-red-600 bg-red-50 border border-red-200 rounded-lg px-4 py-3">
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="flex-shrink-0">
                  <circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/>
                </svg>
                {error}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
