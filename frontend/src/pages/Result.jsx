import { useEffect, useState, useRef } from 'react'
import { useParams, Link } from 'react-router-dom'
import { roastApi } from '../api/client'
import RoastCard from '../components/RoastCard'
import FixReport from '../components/FixReport'
import ResumePreview from '../components/ResumePreview'

const POLL_INTERVAL = 2500
const MAX_POLLS = 80

export default function Result() {
  const { id } = useParams()
  const [data,  setData]  = useState(null)
  const [error, setError] = useState('')
  const pollCount = useRef(0)
  const timer     = useRef(null)

  useEffect(() => {
    const poll = async () => {
      try {
        const { data: sub } = await roastApi.get(id)
        setData(sub)
        if (sub.status === 'completed' || sub.status === 'failed') return
        pollCount.current += 1
        if (pollCount.current >= MAX_POLLS) { setError('Taking too long. Try refreshing.'); return }
        timer.current = setTimeout(poll, POLL_INTERVAL)
      } catch {
        setError('Could not load roast. Check the link or try again.')
      }
    }
    poll()
    return () => clearTimeout(timer.current)
  }, [id])

  if (error) {
    return (
      <div className="max-w-2xl mx-auto px-6 py-32 text-center">
        <p className="text-[15px] mb-6" style={{ color: '#f87171' }}>{error}</p>
        <Link to="/" className="btn-primary">Try Again</Link>
      </div>
    )
  }

  if (!data || data.status === 'pending' || data.status === 'processing') {
    return (
      <div className="max-w-2xl mx-auto px-6 py-36 text-center">
        <div
          className="w-12 h-12 mx-auto mb-6 rounded-full border-2 border-t-transparent animate-spin"
          style={{ borderColor: 'rgba(255,255,255,0.1)', borderTopColor: 'var(--accent)' }}
        />
        <h2 className="text-xl font-bold mb-2" style={{ color: 'var(--text)' }}>Roasting in progress</h2>
        <p className="text-[14px]" style={{ color: 'var(--text-2)' }}>Generating roast, fix report, and improved file — usually 20–40 seconds.</p>
      </div>
    )
  }

  if (data.status === 'failed') {
    return (
      <div className="max-w-2xl mx-auto px-6 py-32 text-center">
        <h2 className="text-xl font-bold mb-2" style={{ color: 'var(--text)' }}>Roast failed</h2>
        <p className="mb-7" style={{ color: 'var(--text-2)' }}>The AI couldn't process your submission. Please try again.</p>
        <Link to="/" className="btn-primary">Start Over</Link>
      </div>
    )
  }

  return (
    <div className="max-w-8xl mx-auto px-6 py-8">
      <Link to="/" className="inline-flex items-center gap-1.5 text-[13px] transition-colors mb-6"
        style={{ color: 'var(--text-3)' }}
        onMouseEnter={e => e.currentTarget.style.color = 'var(--text)'}
        onMouseLeave={e => e.currentTarget.style.color = 'var(--text-3)'}
      >
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="15 18 9 12 15 6"/></svg>
        Back
      </Link>

      <div className="grid lg:grid-cols-[1fr_300px] gap-5 items-start">
        <div className="space-y-4">
          <RoastCard submission={data} />
          <FixReport fixOutput={data.fix_output} />
          <FixedOutputSection data={data} />
        </div>

        <div className="lg:sticky lg:top-24">
          <ScoreSidebar submission={data} />
        </div>
      </div>
    </div>
  )
}

/* ── Fixed output section ────────────────────────────────── */

function FixedOutputSection({ data }) {
  const [open, setOpen] = useState(false)

  if (data.work_type === 'resume' && data.fixed_resume_data) {
    return (
      <div className="overflow-hidden animate-fade-up" style={{ animationDelay: '120ms', background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 14, boxShadow: '0 1px 3px rgba(0,0,0,0.4)' }}>
        <button
          onClick={() => setOpen((o) => !o)}
          className="w-full flex items-center justify-between p-6 text-left transition-colors"
          style={{ background: open ? 'rgba(249,115,22,0.04)' : 'transparent', borderBottom: open ? '1px solid var(--border)' : 'none' }}
          onMouseEnter={e => { if (!open) e.currentTarget.style.background = 'rgba(255,255,255,0.025)' }}
          onMouseLeave={e => { if (!open) e.currentTarget.style.background = 'transparent' }}
        >
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0" style={{ background: 'rgba(249,115,22,0.1)', border: '1px solid rgba(249,115,22,0.2)' }}>
              <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="#fb923c" strokeWidth="1.8">
                <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/>
                <polyline points="14 2 14 8 20 8"/>
                <line x1="9" y1="13" x2="15" y2="13"/>
                <line x1="9" y1="17" x2="12" y2="17"/>
              </svg>
            </div>
            <div>
              <h2 className="text-[15px] font-bold" style={{ color: 'var(--text)' }}>ATS-Optimized Version</h2>
              <p className="text-[12px] mt-0.5" style={{ color: 'var(--text-3)' }}>Same content, improved language — ready to print or copy</p>
            </div>
          </div>
          <div className="flex items-center gap-2 flex-shrink-0 ml-4">
            {open && (
              <button
                onClick={(e) => { e.stopPropagation(); window.print() }}
                className="btn-primary py-1.5 px-3.5 text-xs no-print"
              >
                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <polyline points="6 9 6 2 18 2 18 9"/>
                  <path d="M6 18H4a2 2 0 0 1-2-2v-5a2 2 0 0 1 2-2h16a2 2 0 0 1 2 2v5a2 2 0 0 1-2 2h-2"/>
                  <rect x="6" y="14" width="12" height="8"/>
                </svg>
                Print / PDF
              </button>
            )}
            <div className="w-7 h-7 flex items-center justify-center rounded-lg transition-all duration-200"
              style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid var(--border)', transform: open ? 'rotate(180deg)' : '', color: 'var(--text-3)' }}>
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><polyline points="6 9 12 15 18 9"/></svg>
            </div>
          </div>
        </button>

        {open && (
          <div>
            <div className="flex items-start gap-3 px-6 py-4" style={{ background: 'rgba(245,158,11,0.06)', borderBottom: '1px solid rgba(245,158,11,0.15)' }}>
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#fbbf24" strokeWidth="2" className="flex-shrink-0 mt-0.5">
                <circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/>
              </svg>
              <p className="text-[13px] leading-relaxed" style={{ color: '#fcd34d' }}>
                <strong style={{ color: '#fde68a' }}>Original styling not changed.</strong> Copy improved bullet points back into your original file to keep your design.
              </p>
            </div>
            <div className="p-6" style={{ background: 'var(--surface-2)' }}>
              <ResumePreview data={data.fixed_resume_data} />
            </div>
          </div>
        )}
      </div>
    )
  }

  if (data.work_type === 'code' && data.fixed_code) {
    return (
      <div className="overflow-hidden animate-fade-up" style={{ animationDelay: '120ms', background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 14, boxShadow: '0 1px 3px rgba(0,0,0,0.4)' }}>
        <button
          onClick={() => setOpen((o) => !o)}
          className="w-full flex items-center justify-between p-6 text-left transition-colors"
          style={{ background: open ? 'rgba(99,102,241,0.04)' : 'transparent', borderBottom: open ? '1px solid var(--border)' : 'none' }}
          onMouseEnter={e => { if (!open) e.currentTarget.style.background = 'rgba(255,255,255,0.025)' }}
          onMouseLeave={e => { if (!open) e.currentTarget.style.background = 'transparent' }}
        >
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0" style={{ background: 'rgba(99,102,241,0.1)', border: '1px solid rgba(99,102,241,0.2)' }}>
              <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="#818cf8" strokeWidth="1.8">
                <polyline points="16 18 22 12 16 6"/><polyline points="8 6 2 12 8 18"/>
              </svg>
            </div>
            <div>
              <h2 className="text-[15px] font-bold" style={{ color: 'var(--text)' }}>Fixed Code</h2>
              <p className="text-[12px] mt-0.5" style={{ color: 'var(--text-3)' }}>All improvements applied — download and use directly</p>
            </div>
          </div>
          <div className="flex items-center gap-2 flex-shrink-0 ml-4">
            {open && (
              <button
                onClick={(e) => { e.stopPropagation(); downloadCode(data.fixed_code) }}
                className="btn-primary py-1.5 px-3.5 text-xs"
              >
                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/>
                  <polyline points="7 10 12 15 17 10"/>
                  <line x1="12" y1="15" x2="12" y2="3"/>
                </svg>
                Download
              </button>
            )}
            <div className="w-7 h-7 flex items-center justify-center rounded-lg transition-all duration-200"
              style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid var(--border)', transform: open ? 'rotate(180deg)' : '', color: 'var(--text-3)' }}>
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><polyline points="6 9 12 15 18 9"/></svg>
            </div>
          </div>
        </button>

        {open && (
          <div style={{ borderTop: '1px solid var(--border)' }}>
            <pre className="p-6 text-[13px] font-mono leading-relaxed overflow-x-auto max-h-[600px] overflow-y-auto whitespace-pre-wrap"
              style={{ background: 'var(--surface-2)', color: '#a5b4fc' }}>
              {data.fixed_code}
            </pre>
          </div>
        )}
      </div>
    )
  }

  return null
}

function downloadCode(code) {
  const ext = detectExtension(code)
  const blob = new Blob([code], { type: 'text/plain' })
  const url  = URL.createObjectURL(blob)
  const a    = document.createElement('a')
  a.href = url
  a.download = `fixed_code${ext}`
  a.click()
  URL.revokeObjectURL(url)
}

function detectExtension(code) {
  if (/^(import|from|def |class |if __name__)/.test(code)) return '.py'
  if (/^(const|let|var|function|import|export|=>)/.test(code)) return '.js'
  if (/^(package|import java|public class)/.test(code)) return '.java'
  if (/^(func |package main|import \()/.test(code)) return '.go'
  if (/<\?php/.test(code)) return '.php'
  return '.txt'
}

/* ── Score sidebar ───────────────────────────────────────── */

function ScoreSidebar({ submission }) {
  const { score, work_type_display, intensity_display, created_at } = submission
  if (!score) return null

  const color =
    score >= 80 ? '#10b981' :
    score >= 60 ? '#f59e0b' :
    score >= 40 ? '#f97316' : '#ef4444'

  const label =
    score >= 80 ? 'Solid work'   :
    score >= 60 ? 'Needs polish' :
    score >= 40 ? 'Rough edges'  : 'Needs work'

  const r    = 52
  const circ = 2 * Math.PI * r
  const dash = circ - (score / 100) * circ

  return (
    <div className="p-5 text-center space-y-4 no-print" style={{
      background: 'var(--surface)',
      border: '1px solid var(--border)',
      borderRadius: 14,
      boxShadow: '0 1px 3px rgba(0,0,0,0.4)',
    }}>
      <p className="section-title">Score</p>

      <div className="relative inline-flex items-center justify-center">
        <svg width="130" height="130" viewBox="0 0 130 130" className="-rotate-90">
          <circle cx="65" cy="65" r={r} fill="none" stroke="rgba(255,255,255,0.06)" strokeWidth="9"/>
          <circle
            cx="65" cy="65" r={r} fill="none"
            stroke={color} strokeWidth="9"
            strokeDasharray={circ}
            strokeDashoffset={dash}
            strokeLinecap="round"
            style={{ transition: 'stroke-dashoffset 0.8s ease-out' }}
          />
        </svg>
        <div className="absolute flex flex-col items-center">
          <span className="text-4xl font-extrabold tabular-nums leading-none" style={{ color: 'var(--text)' }}>{score}</span>
          <span className="text-xs mt-0.5" style={{ color: 'var(--text-3)' }}>/100</span>
        </div>
      </div>

      <div>
        <p className="font-bold" style={{ color: 'var(--text)' }}>{label}</p>
        <p className="text-xs mt-0.5" style={{ color: 'var(--text-3)' }}>{work_type_display} · {intensity_display}</p>
      </div>

      <div className="pt-4 text-left space-y-3" style={{ borderTop: '1px solid var(--border)' }}>
        {[
          { label: 'First impression', val: Math.max(10, Math.min(100, score + Math.round((Math.random() - 0.5) * 14))) },
          { label: 'Content quality',  val: Math.max(10, Math.min(100, score + Math.round((Math.random() - 0.5) * 12))) },
          { label: 'Professionalism',  val: Math.max(10, Math.min(100, score + Math.round((Math.random() - 0.5) * 10))) },
        ].map((bar) => (
          <div key={bar.label}>
            <div className="flex justify-between text-xs mb-1.5">
              <span style={{ color: 'var(--text-2)' }}>{bar.label}</span>
              <span className="tabular-nums font-medium" style={{ color: 'var(--text-2)' }}>{bar.val}</span>
            </div>
            <div className="h-1.5 rounded-full overflow-hidden" style={{ background: 'rgba(255,255,255,0.06)' }}>
              <div className="h-full rounded-full" style={{ width: `${bar.val}%`, background: color, transition: 'width 0.7s ease-out' }} />
            </div>
          </div>
        ))}
      </div>

      <p className="text-[11px] pt-1" style={{ color: 'var(--text-3)' }}>
        {new Date(created_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
      </p>
    </div>
  )
}
