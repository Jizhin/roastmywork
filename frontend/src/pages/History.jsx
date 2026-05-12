import { useEffect, useState, useCallback } from 'react'
import { Link } from 'react-router-dom'
import { roastApi } from '../api/client'

/* ─── Constants ─────────────────────────────────────────────── */
const WORK_LABELS = {
  resume: 'Resume / CV', code: 'Code', pitch_deck: 'Pitch Deck',
  linkedin: 'LinkedIn', essay: 'Essay', ui_design: 'UI Design',
}

const STATUS_CFG = {
  completed:  { dot: '#10b981', label: 'Completed',  cls: 'badge-green'  },
  processing: { dot: '#f59e0b', label: 'Processing', cls: 'badge-amber'  },
  pending:    { dot: '#71717a', label: 'Pending',    cls: 'badge-gray'   },
  failed:     { dot: '#ef4444', label: 'Failed',     cls: 'badge-red'    },
}

const INTENSITY_ICONS = {
  gentle:        '🌱',
  honest:        '🎯',
  gordon_ramsay: '🔥',
  simon_cowell:  '🧊',
}

/* ─── Score ring ──────────────────────────────────────────────── */
function ScoreRing({ score, size = 52 }) {
  if (score == null) return (
    <div className="flex items-center justify-center text-lg font-bold" style={{ width: size, height: size, color: 'var(--text-3)' }}>—</div>
  )
  const r     = size / 2 - 5
  const circ  = 2 * Math.PI * r
  const dash  = circ - (score / 100) * circ
  const color = score >= 80 ? '#10b981' : score >= 60 ? '#f59e0b' : score >= 40 ? '#f97316' : '#ef4444'
  return (
    <div className="relative flex items-center justify-center flex-shrink-0">
      <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} style={{ transform: 'rotate(-90deg)' }}>
        <circle cx={size/2} cy={size/2} r={r} fill="none" stroke="rgba(255,255,255,0.06)" strokeWidth="4.5"/>
        <circle cx={size/2} cy={size/2} r={r} fill="none" stroke={color} strokeWidth="4.5"
          strokeDasharray={circ} strokeDashoffset={dash} strokeLinecap="round"
          style={{ transition: 'stroke-dashoffset 0.7s ease-out' }}
        />
      </svg>
      <span className="absolute text-[12px] font-extrabold tabular-nums" style={{ color }}>{score}</span>
    </div>
  )
}

/* ─── Work type icon ──────────────────────────────────────────── */
function WorkIcon({ type }) {
  const s = { width: 15, height: 15, viewBox: '0 0 24 24', fill: 'none', stroke: 'currentColor', strokeWidth: 1.8, strokeLinecap: 'round', strokeLinejoin: 'round' }
  const icons = {
    resume:     <svg {...s}><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/><line x1="16" y1="13" x2="8" y2="13"/><line x1="16" y1="17" x2="8" y2="17"/></svg>,
    code:       <svg {...s}><polyline points="16 18 22 12 16 6"/><polyline points="8 6 2 12 8 18"/></svg>,
    pitch_deck: <svg {...s}><rect x="2" y="3" width="20" height="14" rx="2"/><line x1="8" y1="21" x2="16" y2="21"/><line x1="12" y1="17" x2="12" y2="21"/></svg>,
    linkedin:   <svg {...s}><path d="M16 8a6 6 0 0 1 6 6v7h-4v-7a2 2 0 0 0-2-2 2 2 0 0 0-2 2v7h-4v-7a6 6 0 0 1 6-6z"/><rect x="2" y="9" width="4" height="12"/><circle cx="4" cy="4" r="2"/></svg>,
    essay:      <svg {...s}><path d="M12 20h9"/><path d="M16.5 3.5a2.121 2.121 0 0 1 3 3L7 19l-4 1 1-4L16.5 3.5z"/></svg>,
    ui_design:  <svg {...s}><rect x="3" y="3" width="18" height="18" rx="2"/><circle cx="8.5" cy="8.5" r="1.5"/><polyline points="21 15 16 10 5 21"/></svg>,
  }
  return icons[type] || icons.essay
}

/* ─── Markdown renderer for fix_output ───────────────────────── */
function MiniMarkdown({ content }) {
  if (!content) return null
  const lines   = content.split('\n')
  const els     = []
  let list      = []
  const flush   = () => {
    if (!list.length) return
    els.push(
      <ul key={els.length} className="mt-1.5 space-y-1.5">
        {list.map((item, i) => (
          <li key={i} className="flex gap-2 text-[13px] leading-relaxed" style={{ color: 'var(--text-2)' }}>
            <span className="mt-[7px] w-1 h-1 rounded-full flex-shrink-0" style={{ background: '#6366f1' }} />
            <span dangerouslySetInnerHTML={{ __html: fmtInline(item) }} />
          </li>
        ))}
      </ul>
    )
    list = []
  }
  lines.forEach((ln, i) => {
    if (ln.startsWith('## ')) {
      flush()
      els.push(<p key={i} className="text-[10px] font-bold uppercase tracking-widest mt-4 mb-1" style={{ color: '#818cf8' }}>{ln.replace('## ','')}</p>)
    } else if (ln.startsWith('# ')) {
      flush()
      els.push(<p key={i} className="text-[13px] font-semibold mt-3 mb-0.5" style={{ color: 'var(--text)' }}>{ln.replace('# ','')}</p>)
    } else if (ln.match(/^(\d+\.|-|\*)\s/)) {
      list.push(ln.replace(/^(\d+\.|-|\*)\s/,''))
    } else if (ln.trim() === '') {
      flush()
    } else {
      flush()
      els.push(<p key={i} className="text-[13px] leading-relaxed" style={{ color: 'var(--text-2)' }} dangerouslySetInnerHTML={{ __html: fmtInline(ln) }} />)
    }
  })
  flush()
  return <div className="space-y-0.5">{els}</div>
}

function fmtInline(t) {
  return t
    .replace(/\*\*(.+?)\*\*/g, '<strong style="color:var(--text);font-weight:600">$1</strong>')
    .replace(/\*(.+?)\*/g,     '<em>$1</em>')
    .replace(/`(.+?)`/g,       '<code style="background:rgba(255,255,255,0.07);padding:1px 5px;border-radius:4px;font-family:monospace;font-size:11px;color:#a5b4fc">$1</code>')
}

/* ─── Expandable History Card ────────────────────────────────── */
function HistoryCard({ roast }) {
  const [open,    setOpen]    = useState(false)
  const [detail,  setDetail]  = useState(null)
  const [loading, setLoading] = useState(false)

  const sc   = STATUS_CFG[roast.status] || STATUS_CFG.pending
  const date = new Date(roast.created_at)
  const fmtDate = date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
  const fmtTime = date.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })

  const toggle = useCallback(async () => {
    const next = !open
    setOpen(next)
    if (next && !detail && roast.status === 'completed') {
      setLoading(true)
      try {
        const { data } = await roastApi.get(roast.id)
        setDetail(data)
      } catch { /* silent */ }
      finally { setLoading(false) }
    }
  }, [open, detail, roast.id, roast.status])

  return (
    <div
      className="overflow-hidden transition-all duration-200"
      style={{
        background: 'var(--surface)',
        border: `1px solid ${open ? 'rgba(99,102,241,0.25)' : 'var(--border)'}`,
        borderRadius: 14,
        boxShadow: open ? '0 4px 24px rgba(0,0,0,0.35), 0 0 0 1px rgba(99,102,241,0.12)' : '0 1px 3px rgba(0,0,0,0.35)',
      }}
    >
      {/* ── Header row ── */}
      <button
        onClick={toggle}
        className="w-full flex items-center gap-4 px-5 py-4 text-left transition-colors"
        style={{ background: open ? 'rgba(99,102,241,0.04)' : 'transparent' }}
        onMouseEnter={e => { if (!open) e.currentTarget.style.background = 'rgba(255,255,255,0.025)' }}
        onMouseLeave={e => { if (!open) e.currentTarget.style.background = 'transparent' }}
      >
        {/* Icon */}
        <div
          className="w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0"
          style={{ background: 'rgba(99,102,241,0.12)', color: '#818cf8', border: '1px solid rgba(99,102,241,0.2)' }}
        >
          <WorkIcon type={roast.work_type} />
        </div>

        {/* Main info */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2.5 flex-wrap">
            <span className="text-[14px] font-semibold" style={{ color: 'var(--text)' }}>
              {WORK_LABELS[roast.work_type] || roast.work_type_display}
            </span>
            {roast.intensity && (
              <span className="text-[12px]" style={{ color: 'var(--text-3)' }}>
                {INTENSITY_ICONS[roast.intensity] || ''} {roast.intensity_display}
              </span>
            )}
            <span className={`badge ${sc.cls}`} style={{ fontSize: 11 }}>
              <span style={{ width: 6, height: 6, borderRadius: '50%', background: sc.dot, display: 'inline-block', flexShrink: 0 }} />
              {sc.label}
            </span>
          </div>
          <p className="text-[12px] mt-0.5" style={{ color: 'var(--text-3)' }}>
            {fmtDate} · {fmtTime}
          </p>
        </div>

        {/* Score */}
        <ScoreRing score={roast.score} size={48} />

        {/* Chevron */}
        <div
          className="w-7 h-7 flex items-center justify-center rounded-lg flex-shrink-0 transition-all duration-200"
          style={{
            background: 'rgba(255,255,255,0.05)',
            border: '1px solid var(--border)',
            transform: open ? 'rotate(180deg)' : '',
            color: 'var(--text-3)',
          }}
        >
          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
            <polyline points="6 9 12 15 18 9"/>
          </svg>
        </div>
      </button>

      {/* ── Expanded body ── */}
      {open && (
        <div style={{ borderTop: '1px solid var(--border)' }}>
          {loading ? (
            <div className="flex items-center justify-center py-12">
              <div className="w-7 h-7 rounded-full border-2 border-t-transparent animate-spin" style={{ borderColor: 'var(--border-strong)', borderTopColor: 'var(--accent)' }} />
            </div>
          ) : detail ? (
            <div className="p-5 space-y-5">
              {/* Meta strip */}
              <div className="flex flex-wrap gap-3">
                {[
                  { label: 'Type',      val: WORK_LABELS[detail.work_type] || detail.work_type_display },
                  { label: 'Intensity', val: `${INTENSITY_ICONS[detail.intensity] || ''} ${detail.intensity_display}`.trim() },
                  { label: 'Score',     val: detail.score != null ? `${detail.score}/100` : '—' },
                  { label: 'Status',    val: STATUS_CFG[detail.status]?.label || detail.status },
                  { label: 'Date',      val: fmtDate },
                ].map(({ label, val }) => (
                  <div key={label} className="px-3.5 py-2.5 rounded-xl" style={{ background: 'var(--surface-2)', border: '1px solid var(--border)' }}>
                    <p className="section-title mb-0.5">{label}</p>
                    <p className="text-[13px] font-medium" style={{ color: 'var(--text)' }}>{val}</p>
                  </div>
                ))}
              </div>

              {/* Roast output */}
              {detail.roast_output && (
                <div className="rounded-xl p-4" style={{ background: 'var(--surface-2)', border: '1px solid var(--border)' }}>
                  <p className="section-title mb-3">The Roast</p>
                  <p className="text-[14px] leading-relaxed whitespace-pre-wrap" style={{ color: 'var(--text-2)' }}>
                    {detail.roast_output}
                  </p>
                </div>
              )}

              {/* Fix output */}
              {detail.fix_output && (
                <div className="rounded-xl p-4" style={{ background: 'var(--surface-2)', border: '1px solid var(--border)' }}>
                  <p className="section-title mb-3">Fix Report</p>
                  <MiniMarkdown content={detail.fix_output} />
                </div>
              )}

              {/* Actions */}
              <div className="flex gap-2.5 pt-1">
                <Link
                  to={`/result/${roast.id}`}
                  className="btn-primary py-2 px-4 text-[13px]"
                >
                  <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <polyline points="15 3 21 3 21 9"/><polyline points="9 21 3 21 3 15"/>
                    <line x1="21" y1="3" x2="14" y2="10"/><line x1="3" y1="21" x2="10" y2="14"/>
                  </svg>
                  Full Result
                </Link>
                {detail.work_type === 'resume' && detail.fixed_resume_data && (
                  <Link to={`/result/${roast.id}`} className="btn-secondary py-2 px-4 text-[13px]">
                    View Improved Resume
                  </Link>
                )}
              </div>
            </div>
          ) : roast.status !== 'completed' ? (
            <div className="px-5 py-8 text-center">
              <p className="text-[13px]" style={{ color: 'var(--text-3)' }}>
                {roast.status === 'processing' ? 'Still processing — check back soon.' : roast.status === 'failed' ? 'This roast failed to process.' : 'Waiting to be processed.'}
              </p>
            </div>
          ) : (
            <div className="px-5 py-8 text-center">
              <p className="text-[13px]" style={{ color: 'var(--text-3)' }}>Could not load details.</p>
            </div>
          )}
        </div>
      )}
    </div>
  )
}

/* ─── Stats bar ───────────────────────────────────────────────── */
function StatsBar({ roasts }) {
  const completed = roasts.filter(r => r.status === 'completed')
  const avgScore  = completed.length
    ? Math.round(completed.filter(r => r.score != null).reduce((s, r) => s + r.score, 0) / (completed.filter(r => r.score != null).length || 1))
    : null

  const stats = [
    { label: 'Total submissions', val: roasts.length },
    { label: 'Completed',         val: completed.length },
    { label: 'Avg score',         val: avgScore != null ? `${avgScore}/100` : '—' },
    { label: 'This month',        val: roasts.filter(r => new Date(r.created_at).getMonth() === new Date().getMonth()).length },
  ]

  return (
    <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-7">
      {stats.map(({ label, val }) => (
        <div
          key={label}
          className="px-5 py-4 rounded-xl"
          style={{ background: 'var(--surface)', border: '1px solid var(--border)' }}
        >
          <p className="section-title mb-1.5">{label}</p>
          <p className="text-2xl font-bold tabular-nums" style={{ color: 'var(--text)' }}>{val}</p>
        </div>
      ))}
    </div>
  )
}

/* ─── Main History page ───────────────────────────────────────── */
export default function History() {
  const [roasts,  setRoasts]  = useState([])
  const [loading, setLoading] = useState(true)
  const [error,   setError]   = useState('')
  const [filter,  setFilter]  = useState('all')

  useEffect(() => {
    roastApi.history()
      .then(({ data }) => setRoasts(data.results ?? data))
      .catch(() => setError('Sign in to view your history.'))
      .finally(() => setLoading(false))
  }, [])

  if (loading) {
    return (
      <div className="flex items-center justify-center py-40">
        <div className="w-9 h-9 rounded-full border-2 border-t-transparent animate-spin"
          style={{ borderColor: 'rgba(255,255,255,0.1)', borderTopColor: 'var(--accent)' }} />
      </div>
    )
  }

  if (error) {
    return (
      <div className="max-w-lg mx-auto px-6 py-40 text-center">
        <div className="w-14 h-14 rounded-2xl mx-auto mb-5 flex items-center justify-center"
          style={{ background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.2)' }}>
          <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#ef4444" strokeWidth="1.8"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>
        </div>
        <p className="text-lg font-semibold mb-2" style={{ color: 'var(--text)' }}>{error}</p>
        <Link to="/" className="btn-primary mt-6 inline-flex">Go to Tools</Link>
      </div>
    )
  }

  if (roasts.length === 0) {
    return (
      <div className="max-w-lg mx-auto px-6 py-40 text-center">
        <div
          className="w-16 h-16 rounded-2xl mx-auto mb-6 flex items-center justify-center"
          style={{ background: 'rgba(99,102,241,0.1)', border: '1px solid rgba(99,102,241,0.2)' }}
        >
          <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="#818cf8" strokeWidth="1.6">
            <circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/>
          </svg>
        </div>
        <h2 className="text-xl font-bold mb-2" style={{ color: 'var(--text)' }}>No history yet</h2>
        <p className="mb-8 text-[15px]" style={{ color: 'var(--text-2)' }}>Your roasts and tool results will appear here after you use them.</p>
        <Link to="/" className="btn-primary">Start Your First Roast</Link>
      </div>
    )
  }

  const workTypes = ['all', ...new Set(roasts.map(r => r.work_type))]
  const filtered  = filter === 'all' ? roasts : roasts.filter(r => r.work_type === filter)

  return (
    <div className="max-w-4xl mx-auto px-5 py-10">
      {/* Header */}
      <div className="flex items-start justify-between gap-4 mb-7">
        <div>
          <h1 className="text-[26px] font-bold tracking-tight" style={{ color: 'var(--text)' }}>History</h1>
          <p className="text-[14px] mt-1" style={{ color: 'var(--text-2)' }}>
            {roasts.length} submission{roasts.length !== 1 ? 's' : ''} · expand any card to see full AI response
          </p>
        </div>
        <Link to="/" className="btn-secondary text-[13px] py-2 px-4 flex-shrink-0">
          <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>
          New
        </Link>
      </div>

      {/* Stats */}
      <StatsBar roasts={roasts} />

      {/* Filter tabs */}
      {workTypes.length > 2 && (
        <div className="flex gap-1.5 mb-5 flex-wrap">
          {workTypes.map(type => (
            <button
              key={type}
              onClick={() => setFilter(type)}
              className="px-3.5 py-1.5 rounded-lg text-[12px] font-medium transition-all"
              style={{
                background: filter === type ? 'rgba(99,102,241,0.15)' : 'var(--surface)',
                border: `1px solid ${filter === type ? 'rgba(99,102,241,0.3)' : 'var(--border)'}`,
                color: filter === type ? '#a5b4fc' : 'var(--text-2)',
              }}
            >
              {type === 'all' ? 'All' : WORK_LABELS[type] || type}
            </button>
          ))}
        </div>
      )}

      {/* Cards */}
      <div className="space-y-3">
        {filtered.map(r => <HistoryCard key={r.id} roast={r} />)}
      </div>

      {filtered.length === 0 && (
        <div className="text-center py-12">
          <p className="text-[14px]" style={{ color: 'var(--text-3)' }}>No {WORK_LABELS[filter] || filter} submissions yet.</p>
        </div>
      )}
    </div>
  )
}

