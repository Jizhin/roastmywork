import ShareButton from './ShareButton'

const WORK_LABELS = {
  resume: 'Resume / CV', code: 'Code', pitch_deck: 'Pitch Deck',
  linkedin: 'LinkedIn', essay: 'Essay', ui_design: 'UI Design',
}

const INTENSITY_CFG = {
  gentle:        { icon: '🌱', label: 'Gentle'        },
  honest:        { icon: '🎯', label: 'Honest'        },
  gordon_ramsay: { icon: '🔥', label: 'Gordon Ramsay' },
  simon_cowell:  { icon: '🧊', label: 'Simon Cowell'  },
}

export default function RoastCard({ submission }) {
  const { id, roast_output, work_type, intensity } = submission
  const ic = INTENSITY_CFG[intensity] || { icon: '', label: intensity }

  return (
    <div
      className="overflow-hidden animate-fade-up"
      style={{
        background: 'var(--surface)',
        border: '1px solid var(--border)',
        borderRadius: 14,
        boxShadow: '0 1px 3px rgba(0,0,0,0.4)',
      }}
    >
      {/* Header */}
      <div
        className="flex items-center justify-between px-6 py-4"
        style={{ borderBottom: '1px solid var(--border)', background: 'rgba(99,102,241,0.04)' }}
      >
        <div className="flex items-center gap-2.5">
          <span
            className="inline-flex items-center gap-1.5 text-[12px] font-semibold px-3 py-1 rounded-full"
            style={{ background: 'rgba(99,102,241,0.12)', color: '#a5b4fc', border: '1px solid rgba(99,102,241,0.2)' }}
          >
            {WORK_LABELS[work_type] || work_type}
          </span>
          <span
            className="inline-flex items-center gap-1.5 text-[12px] font-medium px-3 py-1 rounded-full"
            style={{ background: 'rgba(255,255,255,0.05)', color: 'var(--text-2)', border: '1px solid var(--border-strong)' }}
          >
            {ic.icon} {ic.label} mode
          </span>
        </div>
        <ShareButton roastId={id} />
      </div>

      {/* Body */}
      <div className="p-6">
        <div className="flex items-center gap-2 mb-4">
          <div
            className="w-6 h-6 rounded-md flex items-center justify-center"
            style={{ background: 'linear-gradient(135deg,#6366f1,#8b5cf6)' }}
          >
            <svg width="11" height="11" viewBox="0 0 24 24" fill="white">
              <path d="M12 3C9.5 7.5 8 10.5 8 14a4 4 0 0 0 8 0c0-3.5-1.5-6.5-4-11Z"/>
            </svg>
          </div>
          <h2 className="text-[15px] font-bold" style={{ color: 'var(--text)' }}>The Roast</h2>
        </div>

        <div
          className="rounded-xl p-5"
          style={{
            background: 'var(--surface-2)',
            border: '1px solid var(--border)',
            position: 'relative',
          }}
        >
          {/* Subtle left accent bar */}
          <div
            className="absolute left-0 top-4 bottom-4 w-[3px] rounded-full"
            style={{ background: 'linear-gradient(to bottom,#6366f1,#8b5cf6)' }}
          />
          <p
            className="text-[14px] leading-[1.75] whitespace-pre-wrap pl-2"
            style={{ color: 'var(--text-2)' }}
          >
            {roast_output}
          </p>
        </div>
      </div>
    </div>
  )
}

