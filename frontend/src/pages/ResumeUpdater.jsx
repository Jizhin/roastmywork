import { useState, useRef } from 'react'
import { updaterApi } from '../api/client'
import { useAuth } from '../context/AuthContext'
import ResumePreview from '../components/ResumePreview'

const POLL_INTERVAL = 2000
const MAX_POLLS = 90

const POINTS = [
  'Keeps every job, date, and detail from your original',
  'Rewrites weak bullets with power action verbs',
  'Adds quantified metrics where possible',
  'ATS keywords optimized for modern job boards',
]

export default function ResumeUpdater() {
  const { user, openAuthModal, openUpgradeModal, refreshUser } = useAuth()
  const [file,        setFile]        = useState(null)
  const [status,      setStatus]      = useState('idle')
  const [resumeData,  setResumeData]  = useState(null)
  const [issuesSummary, setIssuesSummary] = useState('')
  const [error,       setError]       = useState('')
  const fileRef = useRef()
  const pollRef = useRef(null)

  const stopPolling = () => {
    if (pollRef.current) { clearInterval(pollRef.current); pollRef.current = null }
  }

  const pollResult = (id) => {
    let count = 0
    pollRef.current = setInterval(async () => {
      count++
      if (count > MAX_POLLS) {
        stopPolling(); setStatus('error'); setError('Processing timed out. Try again.')
        return
      }
      try {
        const { data } = await updaterApi.get(id)
        if (data.status === 'completed' && data.resume_data) {
          stopPolling()
          setResumeData(data.resume_data)
          setIssuesSummary(data.issues || '')
          setStatus('done')
          refreshUser()
        } else if (data.status === 'failed') {
          stopPolling(); setStatus('error'); setError('AI processing failed. Try again.')
        }
      } catch {
        stopPolling(); setStatus('error'); setError('Error checking status.')
      }
    }, POLL_INTERVAL)
  }

  const doSubmit = async () => {
    setStatus('loading'); setError('')
    try {
      const fd = new FormData()
      fd.append('file', file)
      const { data } = await updaterApi.submit(fd)
      pollResult(data.id)
    } catch (err) {
      if (err.response?.status === 402) { setStatus('idle'); openUpgradeModal() }
      else { setStatus('error'); setError(err.response?.data?.detail || 'Something went wrong.') }
    }
  }

  const handleSubmit = () => {
    if (!file) { setError('Please select a resume file.'); return }
    setError('')
    if (!user) { openAuthModal(doSubmit); return }
    doSubmit()
  }

  // — Result view —
  if (status === 'done' && resumeData) {
    return (
      <div className="max-w-8xl mx-auto px-6 py-8">
        <div className="no-print">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Your Improved Resume</h1>
              <p className="text-gray-500 text-sm mt-0.5">ATS-optimized · All original content preserved · Print-ready</p>
            </div>
            <div className="flex gap-2.5">
              <button
                onClick={() => { stopPolling(); setStatus('idle'); setResumeData(null); setFile(null) }}
                className="btn-secondary"
              >
                Upload Another
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

          {issuesSummary && (
            <div className="card p-5 mb-6 bg-blue-50 border-blue-100">
              <div className="flex gap-3 items-start">
                <div className="w-8 h-8 rounded-lg bg-blue-100 border border-blue-200 flex items-center justify-center flex-shrink-0">
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#2563eb" strokeWidth="2">
                    <circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/>
                  </svg>
                </div>
                <div>
                  <p className="text-sm font-bold text-blue-900 mb-1">What we improved</p>
                  <p className="text-sm text-blue-800 leading-relaxed">{issuesSummary}</p>
                </div>
              </div>
            </div>
          )}
        </div>

        <div className="max-w-4xl">
          <ResumePreview data={resumeData} />
        </div>
      </div>
    )
  }

  // — Upload view —
  return (
    <div className="max-w-8xl mx-auto px-6 py-14 lg:py-20">
      <div className="grid lg:grid-cols-[1fr_480px] gap-16 lg:gap-24 items-start">

        {/* Left — hero */}
        <div className="lg:sticky lg:top-24 space-y-8 animate-fade-up">
          <div className="space-y-4">
            <span className="inline-block text-[11px] font-semibold uppercase tracking-[0.15em] text-blue-600 bg-blue-50 border border-blue-100 px-3 py-1.5 rounded-full">
              Resume Updater
            </span>
            <h1 className="text-5xl lg:text-6xl font-extrabold leading-[1.07] tracking-tight text-gray-900">
              Fix your resume,<br />
              <span className="text-blue-500">keep your content.</span>
            </h1>
            <p className="text-gray-500 text-lg leading-relaxed max-w-md">
              Upload your existing resume. AI finds every weakness, rewrites the language, and delivers a fully improved version — print-ready in under a minute.
            </p>
          </div>

          <div className="space-y-3.5">
            {POINTS.map((point) => (
              <div key={point} className="flex items-start gap-3">
                <div className="w-5 h-5 rounded-full bg-blue-100 border border-blue-200 flex items-center justify-center flex-shrink-0 mt-0.5">
                  <svg width="9" height="9" viewBox="0 0 24 24" fill="none" stroke="#2563eb" strokeWidth="3.5" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M20 6L9 17l-5-5"/>
                  </svg>
                </div>
                <p className="text-sm text-gray-600">{point}</p>
              </div>
            ))}
          </div>
        </div>

        {/* Right — upload */}
        <div className="animate-fade-up" style={{ animationDelay: '80ms' }}>
          <div className="card p-6 space-y-5">
            <div>
              <h2 className="text-lg font-bold text-gray-900">Upload your resume</h2>
              <p className="text-sm text-gray-500 mt-0.5">PDF, plain text, or markdown</p>
            </div>

            <div
              onClick={() => status === 'idle' && fileRef.current?.click()}
              className={`rounded-xl p-12 text-center transition-all duration-150 border-2 border-dashed ${
                status === 'loading'
                  ? 'border-blue-200 bg-blue-50/60 cursor-default'
                  : file
                    ? 'border-blue-300 bg-blue-50/40 cursor-pointer hover:border-blue-400'
                    : 'border-gray-200 bg-gray-50 cursor-pointer hover:border-gray-300'
              }`}
            >
              <input
                ref={fileRef}
                type="file"
                accept=".txt,.pdf,.md"
                className="hidden"
                onChange={(e) => { setFile(e.target.files[0]); setError('') }}
              />

              {status === 'loading' ? (
                <div>
                  <div className="w-12 h-12 mx-auto mb-4 rounded-full bg-blue-100 border border-blue-200 flex items-center justify-center">
                    <svg className="animate-spin text-blue-600" width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <path d="M21 12a9 9 0 1 1-6.219-8.56"/>
                    </svg>
                  </div>
                  <p className="text-blue-700 font-semibold">Analyzing your resume...</p>
                  <p className="text-gray-400 text-xs mt-1">Usually takes 20–40 seconds</p>
                </div>
              ) : file ? (
                <div>
                  <div className="w-12 h-12 mx-auto mb-3 rounded-lg bg-blue-100 border border-blue-200 flex items-center justify-center">
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#2563eb" strokeWidth="1.5">
                      <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/>
                      <polyline points="14 2 14 8 20 8"/>
                    </svg>
                  </div>
                  <p className="text-blue-700 font-semibold text-sm">{file.name}</p>
                  <p className="text-gray-400 text-xs mt-1">{(file.size / 1024).toFixed(1)} KB · Click to change</p>
                </div>
              ) : (
                <div>
                  <div className="w-12 h-12 mx-auto mb-4 rounded-lg bg-gray-200 flex items-center justify-center">
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#9ca3af" strokeWidth="1.5">
                      <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/>
                      <polyline points="17 8 12 3 7 8"/>
                      <line x1="12" y1="3" x2="12" y2="15"/>
                    </svg>
                  </div>
                  <p className="text-gray-700 text-sm font-medium">Click to upload your resume</p>
                  <p className="text-gray-400 text-xs mt-1">.pdf · .txt · .md</p>
                </div>
              )}
            </div>

            {error && (
              <div className="flex items-center gap-2 text-sm text-red-600 bg-red-50 border border-red-200 rounded-lg px-4 py-3">
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="flex-shrink-0">
                  <circle cx="12" cy="12" r="10"/>
                  <line x1="12" y1="8" x2="12" y2="12"/>
                  <line x1="12" y1="16" x2="12.01" y2="16"/>
                </svg>
                {error}
              </div>
            )}

            <button
              onClick={handleSubmit}
              disabled={!file || status === 'loading'}
              className="btn-primary w-full py-3 text-[15px]"
            >
              {status === 'loading' ? (
                <>
                  <svg className="animate-spin" width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M21 12a9 9 0 1 1-6.219-8.56"/>
                  </svg>
                  Improving your resume...
                </>
              ) : 'Fix My Resume'}
            </button>

            {!user && (
              <p className="text-center text-[12px] text-gray-400">Sign in with Google · 5 free improvements included</p>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
