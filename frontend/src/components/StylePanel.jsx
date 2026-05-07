const ACCENT_COLORS = [
  { label: 'Charcoal',  value: '#111827' },
  { label: 'Slate',     value: '#334155' },
  { label: 'Navy',      value: '#1e3a5f' },
  { label: 'Indigo',    value: '#3730a3' },
  { label: 'Violet',    value: '#5b21b6' },
  { label: 'Rose',      value: '#9f1239' },
  { label: 'Crimson',   value: '#b91c1c' },
  { label: 'Emerald',   value: '#065f46' },
  { label: 'Teal',      value: '#0f766e' },
  { label: 'Rust',      value: '#92400e' },
  { label: 'Stone',     value: '#44403c' },
  { label: 'Orange',    value: '#c2410c' },
]

const FONTS = [
  { value: 'inter',        label: 'Inter',           sub: 'Modern sans-serif'  },
  { value: 'georgia',      label: 'Georgia',          sub: 'Classic serif'      },
  { value: 'merriweather', label: 'Merriweather',     sub: 'Readable serif'     },
  { value: 'playfair',     label: 'Playfair Display', sub: 'Elegant serif'      },
  { value: 'plex',         label: 'IBM Plex Mono',    sub: 'Technical mono'     },
  { value: 'raleway',      label: 'Raleway',          sub: 'Geometric sans'     },
]

const LAYOUTS = [
  { value: 'classic',       label: 'Classic'       },
  { value: 'sidebar-left',  label: 'Sidebar Left'  },
  { value: 'sidebar-right', label: 'Sidebar Right' },
  { value: 'minimal',       label: 'Minimal'       },
]

const SECTIONS = [
  { key: 'summary',        label: 'Summary'        },
  { key: 'experience',     label: 'Experience'     },
  { key: 'skills',         label: 'Skills'         },
  { key: 'education',      label: 'Education'      },
  { key: 'projects',       label: 'Projects'       },
  { key: 'certifications', label: 'Certifications' },
]

function LayoutIcon({ type, active, color }) {
  const fill   = active ? 'rgba(255,255,255,0.9)' : '#d1d5db'
  const accent = active ? 'rgba(255,255,255,0.35)' : '#e5e7eb'
  return (
    <div style={{
      width: 56, height: 68, borderRadius: 7, overflow: 'hidden',
      backgroundColor: active ? color : '#f9fafb',
      border: active ? 'none' : '1.5px solid #e5e7eb',
      cursor: 'pointer',
    }}>
      <svg width="56" height="68" viewBox="0 0 56 68" fill="none">
        {type === 'classic' && (
          <>
            <rect x="0" y="0" width="56" height="20" fill={accent} />
            <rect x="5" y="8" width="28" height="3.5" rx="1.5" fill={fill} />
            <rect x="5" y="13" width="18" height="2" rx="1" fill={fill} opacity="0.6" />
            {[28, 35, 42, 49, 56].map(y => (
              <rect key={y} x="5" y={y} width="46" height="2" rx="1" fill={fill} opacity="0.45" />
            ))}
          </>
        )}
        {type === 'sidebar-left' && (
          <>
            <rect x="0" y="0" width="18" height="68" fill={accent} />
            <rect x="3" y="8"  width="12" height="2.5" rx="1" fill={fill} />
            <rect x="3" y="13" width="10" height="1.5" rx="0.75" fill={fill} opacity="0.6" />
            {[8, 14, 21, 28, 35, 42, 50].map(y => (
              <rect key={y} x="23" y={y} width="28" height="2" rx="1" fill={fill} opacity="0.45" />
            ))}
          </>
        )}
        {type === 'sidebar-right' && (
          <>
            <rect x="38" y="0" width="18" height="68" fill={accent} />
            <rect x="41" y="8"  width="12" height="2.5" rx="1" fill={fill} />
            <rect x="41" y="13" width="10" height="1.5" rx="0.75" fill={fill} opacity="0.6" />
            {[8, 14, 21, 28, 35, 42, 50].map(y => (
              <rect key={y} x="5" y={y} width="28" height="2" rx="1" fill={fill} opacity="0.45" />
            ))}
          </>
        )}
        {type === 'minimal' && (
          <>
            <rect x="5" y="7"  width="26" height="4" rx="1.5" fill={fill} />
            <rect x="5" y="14" width="16" height="2"  rx="1"   fill={fill} opacity="0.6" />
            <line x1="5" y1="21" x2="51" y2="21" stroke={accent} strokeWidth="1.5" />
            {[27, 33, 40, 47, 54, 60].map(y => (
              <rect key={y} x="5" y={y} width={y < 35 ? 46 : 38} height="2" rx="1" fill={fill} opacity="0.4" />
            ))}
          </>
        )}
      </svg>
    </div>
  )
}

function Label({ children }) {
  return (
    <p style={{
      fontSize: 10, fontWeight: 700, letterSpacing: '0.11em',
      textTransform: 'uppercase', color: '#9ca3af', marginBottom: 10,
    }}>
      {children}
    </p>
  )
}

function Divider() {
  return <div style={{ height: 1, backgroundColor: '#f3f4f6', margin: '20px 0' }} />
}

export default function StylePanel({ style, onChange }) {
  const update = (key, val) => onChange({ ...style, [key]: val })

  const moveSection = (idx, dir) => {
    const arr = [...(style.sectionOrder || [])]
    const next = idx + dir
    if (next < 0 || next >= arr.length) return
    ;[arr[idx], arr[next]] = [arr[next], arr[idx]]
    update('sectionOrder', arr)
  }

  return (
    <div style={{
      width: 272, flexShrink: 0, overflowY: 'auto',
      backgroundColor: '#fff', borderLeft: '1px solid #e5e7eb',
      padding: '20px 16px',
    }}>

      {/* ── Color ── */}
      <Label>Color</Label>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(6, 1fr)', gap: 6 }}>
        {ACCENT_COLORS.map(c => (
          <button
            key={c.value}
            title={c.label}
            onClick={() => update('accentColor', c.value)}
            style={{
              width: 32, height: 32, borderRadius: 8,
              backgroundColor: c.value,
              border: style.accentColor === c.value ? `3px solid ${c.value}` : '2px solid transparent',
              outline: style.accentColor === c.value ? '2px solid white' : 'none',
              outlineOffset: -4,
              cursor: 'pointer',
              transform: style.accentColor === c.value ? 'scale(1.18)' : 'scale(1)',
              transition: 'transform 0.12s',
            }}
          />
        ))}
      </div>
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginTop: 10 }}>
        <input
          type="color"
          value={style.accentColor}
          onChange={e => update('accentColor', e.target.value)}
          style={{ width: 32, height: 32, border: '1px solid #e5e7eb', borderRadius: 8, cursor: 'pointer', padding: 2 }}
        />
        <input
          type="text"
          value={style.accentColor}
          onChange={e => /^#[0-9a-fA-F]{0,6}$/.test(e.target.value) && update('accentColor', e.target.value)}
          style={{
            flex: 1, fontSize: 12, fontFamily: 'monospace',
            border: '1px solid #e5e7eb', borderRadius: 6,
            padding: '5px 8px', color: '#374151',
          }}
        />
      </div>

      <Divider />

      {/* ── Font ── */}
      <Label>Font</Label>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
        {FONTS.map(f => (
          <button
            key={f.value}
            onClick={() => update('font', f.value)}
            style={{
              display: 'flex', alignItems: 'center', justifyContent: 'space-between',
              padding: '7px 10px', borderRadius: 8, border: '1.5px solid',
              borderColor: style.font === f.value ? style.accentColor : '#e5e7eb',
              backgroundColor: style.font === f.value ? style.accentColor + '12' : '#fff',
              cursor: 'pointer', textAlign: 'left',
            }}
          >
            <span style={{ fontSize: 13, fontWeight: 600, color: style.font === f.value ? style.accentColor : '#374151' }}>
              {f.label}
            </span>
            <span style={{ fontSize: 10, color: '#9ca3af' }}>{f.sub}</span>
          </button>
        ))}
      </div>

      <Divider />

      {/* ── Layout ── */}
      <Label>Layout</Label>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
        {LAYOUTS.map(l => (
          <button
            key={l.value}
            onClick={() => update('layout', l.value)}
            style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 6, background: 'none', border: 'none', cursor: 'pointer', padding: 0 }}
          >
            <LayoutIcon type={l.value} active={style.layout === l.value} color={style.accentColor} />
            <span style={{
              fontSize: 10, fontWeight: 600,
              color: style.layout === l.value ? style.accentColor : '#6b7280',
            }}>
              {l.label}
            </span>
          </button>
        ))}
      </div>

      <Divider />

      {/* ── Spacing ── */}
      <Label>Spacing</Label>
      <div style={{ display: 'flex', border: '1px solid #e5e7eb', borderRadius: 8, overflow: 'hidden' }}>
        {['compact', 'normal', 'spacious'].map(s => (
          <button
            key={s}
            onClick={() => update('spacing', s)}
            style={{
              flex: 1, padding: '7px 4px', fontSize: 11, fontWeight: 600,
              border: 'none', cursor: 'pointer', textTransform: 'capitalize',
              backgroundColor: style.spacing === s ? style.accentColor : '#fff',
              color: style.spacing === s ? '#fff' : '#6b7280',
              transition: 'all 0.12s',
            }}
          >
            {s}
          </button>
        ))}
      </div>

      <Divider />

      {/* ── Section order ── */}
      <Label>Sections</Label>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
        {(style.sectionOrder || []).map((key, idx) => {
          const label = SECTIONS.find(s => s.key === key)?.label || key
          const isFirst = idx === 0
          const isLast  = idx === (style.sectionOrder?.length ?? 1) - 1
          return (
            <div
              key={key}
              style={{
                display: 'flex', alignItems: 'center', gap: 8,
                padding: '6px 10px', borderRadius: 8,
                backgroundColor: '#f9fafb', border: '1px solid #e5e7eb',
              }}
            >
              <span style={{ flex: 1, fontSize: 12, fontWeight: 500, color: '#374151' }}>{label}</span>
              <button
                onClick={() => moveSection(idx, -1)}
                disabled={isFirst}
                style={{ width: 22, height: 22, border: 'none', background: 'none', cursor: isFirst ? 'default' : 'pointer', opacity: isFirst ? 0.25 : 0.7, display: 'flex', alignItems: 'center', justifyContent: 'center' }}
              >
                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="#374151" strokeWidth="2.5">
                  <polyline points="18 15 12 9 6 15" />
                </svg>
              </button>
              <button
                onClick={() => moveSection(idx, 1)}
                disabled={isLast}
                style={{ width: 22, height: 22, border: 'none', background: 'none', cursor: isLast ? 'default' : 'pointer', opacity: isLast ? 0.25 : 0.7, display: 'flex', alignItems: 'center', justifyContent: 'center' }}
              >
                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="#374151" strokeWidth="2.5">
                  <polyline points="6 9 12 15 18 9" />
                </svg>
              </button>
            </div>
          )
        })}
      </div>
    </div>
  )
}
