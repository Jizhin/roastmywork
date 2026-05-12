import { useState } from 'react'

export default function FixReport({ fixOutput }) {
  const [open, setOpen] = useState(true)
  if (!fixOutput) return null

  return (
    <div
      className="overflow-hidden animate-fade-up"
      style={{
        animationDelay: '60ms',
        background: 'var(--surface)',
        border: '1px solid var(--border)',
        borderRadius: 14,
        boxShadow: '0 1px 3px rgba(0,0,0,0.4)',
      }}
    >
      <button
        onClick={() => setOpen(o => !o)}
        className="w-full flex items-center justify-between px-6 py-4 text-left transition-colors"
        style={{ background: open ? 'rgba(99,102,241,0.04)' : 'transparent', borderBottom: open ? '1px solid var(--border)' : 'none' }}
        onMouseEnter={e => { if (!open) e.currentTarget.style.background = 'rgba(255,255,255,0.025)' }}
        onMouseLeave={e => { if (!open) e.currentTarget.style.background = 'transparent' }}
      >
        <div className="flex items-center gap-3">
          <div
            className="w-8 h-8 rounded-xl flex items-center justify-center"
            style={{ background: 'rgba(249,115,22,0.1)', border: '1px solid rgba(249,115,22,0.2)' }}
          >
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#fb923c" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
              <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/>
              <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/>
            </svg>
          </div>
          <div>
            <h2 className="text-[15px] font-bold" style={{ color: 'var(--text)' }}>Fix Report</h2>
            <p className="text-[12px] mt-0.5" style={{ color: 'var(--text-3)' }}>Actionable steps to improve your work</p>
          </div>
        </div>
        <div
          className="w-7 h-7 flex items-center justify-center rounded-lg transition-all duration-200 flex-shrink-0"
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

      {open && (
        <div className="px-6 py-5">
          <MarkdownRenderer content={fixOutput} />
        </div>
      )}
    </div>
  )
}

function MarkdownRenderer({ content }) {
  const lines = content.split('\n')
  const els   = []
  let list    = []

  const flush = () => {
    if (!list.length) return
    els.push(
      <ul key={els.length} className="mt-2 space-y-2">
        {list.map((item, i) => (
          <li key={i} className="flex gap-2.5 text-[13px] leading-relaxed" style={{ color: 'var(--text-2)' }}>
            <span className="mt-[7px] w-1.5 h-1.5 rounded-full flex-shrink-0" style={{ background: '#f97316' }} />
            <span dangerouslySetInnerHTML={{ __html: formatInline(item) }} />
          </li>
        ))}
      </ul>
    )
    list = []
  }

  lines.forEach((line, i) => {
    if (line.startsWith('## ')) {
      flush()
      els.push(
        <p key={i} className="text-[10px] font-bold uppercase tracking-widest mt-5 mb-1.5"
          style={{ color: '#fb923c' }}>
          {line.replace('## ', '')}
        </p>
      )
    } else if (line.startsWith('# ')) {
      flush()
      els.push(
        <p key={i} className="text-[14px] font-semibold mt-4 mb-1" style={{ color: 'var(--text)' }}>
          {line.replace('# ', '')}
        </p>
      )
    } else if (line.match(/^(\d+\.|-|\*)\s/)) {
      list.push(line.replace(/^(\d+\.|-|\*)\s/, ''))
    } else if (line.trim() === '') {
      flush()
      els.push(<div key={i} className="h-1.5" />)
    } else {
      flush()
      els.push(
        <p key={i} className="text-[13px] leading-relaxed" style={{ color: 'var(--text-2)' }}
          dangerouslySetInnerHTML={{ __html: formatInline(line) }} />
      )
    }
  })
  flush()
  return <div className="space-y-0.5">{els}</div>
}

function formatInline(text) {
  return text
    .replace(/\*\*(.+?)\*\*/g, '<strong style="color:var(--text);font-weight:600">$1</strong>')
    .replace(/\*(.+?)\*/g,     '<em>$1</em>')
    .replace(/`(.+?)`/g,       '<code style="background:rgba(255,255,255,0.07);padding:1px 6px;border-radius:4px;font-family:monospace;font-size:11px;color:#a5b4fc">$1</code>')
}

