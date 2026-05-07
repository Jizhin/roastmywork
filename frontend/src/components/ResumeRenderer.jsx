export const FONT_STACKS = {
  inter:        "'Inter', system-ui, sans-serif",
  georgia:      "Georgia, 'Times New Roman', serif",
  merriweather: "'Merriweather', Georgia, serif",
  playfair:     "'Playfair Display', Georgia, serif",
  plex:         "'IBM Plex Mono', 'Courier New', monospace",
  raleway:      "'Raleway', system-ui, sans-serif",
}

export const DEFAULT_STYLE = {
  font:         'inter',
  accentColor:  '#111827',
  layout:       'classic',
  spacing:      'normal',
  sectionOrder: ['summary', 'experience', 'skills', 'education', 'projects', 'certifications'],
}

const GAP = {
  compact:  { section: 18, item: 8  },
  normal:   { section: 26, item: 12 },
  spacious: { section: 38, item: 18 },
}

const OUTER = {
  compact:  { px: 24, py: 20 },
  normal:   { px: 32, py: 28 },
  spacious: { px: 40, py: 36 },
}

function luminance(hex) {
  if (!hex || hex.length < 7) return 0
  const r = parseInt(hex.slice(1, 3), 16) / 255
  const g = parseInt(hex.slice(3, 5), 16) / 255
  const b = parseInt(hex.slice(5, 7), 16) / 255
  const lin = c => (c <= 0.03928 ? c / 12.92 : Math.pow((c + 0.055) / 1.055, 2.4))
  return 0.2126 * lin(r) + 0.7152 * lin(g) + 0.0722 * lin(b)
}

function textOnBg(hex) {
  return luminance(hex) > 0.35 ? '#111827' : '#ffffff'
}

function flatSkills(skills) {
  if (!skills) return []
  if (Array.isArray(skills)) return skills.filter(Boolean)
  return [
    ...(skills.technical || []),
    ...(skills.tools     || []),
    ...(skills.soft      || []),
    ...(skills.languages || []),
    ...(skills.other     || []),
  ].filter(Boolean)
}

// ── Shared primitives ─────────────────────────────────────────────────────────

function SectionHeading({ label, accentColor, variant }) {
  return (
    <div style={{ marginBottom: 8 }}>
      <span style={{
        fontSize: 9,
        fontWeight: 700,
        letterSpacing: '0.13em',
        textTransform: 'uppercase',
        color: variant === 'bar' ? accentColor : '#9ca3af',
        display: 'block',
      }}>
        {label}
      </span>
      {variant === 'bar' && (
        <div style={{ height: 2, width: 24, backgroundColor: accentColor, marginTop: 4 }} />
      )}
      {variant === 'ruled' && (
        <div style={{ height: 1, backgroundColor: '#e5e7eb', marginTop: 5 }} />
      )}
    </div>
  )
}

function ContactRow({ personal, color, size = 11 }) {
  const parts = [
    personal.email, personal.phone, personal.location,
    personal.linkedin, personal.github, personal.website,
  ].filter(Boolean)
  if (!parts.length) return null
  return (
    <div style={{ display: 'flex', flexWrap: 'wrap', gap: '3px 16px', marginTop: 10 }}>
      {parts.map((p, i) => (
        <span key={i} style={{ fontSize: size, color, lineHeight: 1.5 }}>{p}</span>
      ))}
    </div>
  )
}

// ── Section blocks ────────────────────────────────────────────────────────────

function Summary({ data, gap, accentColor, variant }) {
  if (!data.summary) return null
  return (
    <div style={{ marginBottom: gap.section }}>
      <SectionHeading label="Summary" accentColor={accentColor} variant={variant} />
      <p style={{ fontSize: 12, color: '#4b5563', lineHeight: 1.7 }}>{data.summary}</p>
    </div>
  )
}

function Experience({ data, gap, accentColor, variant }) {
  const exp = data.experience || []
  if (!exp.length) return null
  return (
    <div style={{ marginBottom: gap.section }}>
      <SectionHeading label="Experience" accentColor={accentColor} variant={variant} />
      <div style={{ display: 'flex', flexDirection: 'column', gap: gap.item }}>
        {exp.map((job, i) => (
          <div key={i}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 8 }}>
              <div>
                <p style={{ fontSize: 13, fontWeight: 600, color: '#111827', lineHeight: 1.3 }}>{job.title}</p>
                <p style={{ fontSize: 12, color: accentColor, marginTop: 1 }}>
                  {job.company}{job.location ? ` · ${job.location}` : ''}
                </p>
              </div>
              {job.dates && (
                <p style={{ fontSize: 11, color: '#9ca3af', whiteSpace: 'nowrap', flexShrink: 0, marginTop: 1 }}>
                  {job.dates}
                </p>
              )}
            </div>
            {job.bullets?.length > 0 && (
              <ul style={{ marginTop: 5, paddingLeft: 14, display: 'flex', flexDirection: 'column', gap: 3 }}>
                {job.bullets.map((b, j) => (
                  <li key={j} style={{ fontSize: 11, color: '#4b5563', lineHeight: 1.65, listStyleType: 'disc' }}>{b}</li>
                ))}
              </ul>
            )}
          </div>
        ))}
      </div>
    </div>
  )
}

function Education({ data, gap, accentColor, variant }) {
  const edu = data.education || []
  if (!edu.length) return null
  return (
    <div style={{ marginBottom: gap.section }}>
      <SectionHeading label="Education" accentColor={accentColor} variant={variant} />
      <div style={{ display: 'flex', flexDirection: 'column', gap: gap.item }}>
        {edu.map((e, i) => (
          <div key={i}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 8 }}>
              <div>
                <p style={{ fontSize: 13, fontWeight: 600, color: '#111827', lineHeight: 1.3 }}>{e.degree}</p>
                <p style={{ fontSize: 12, color: accentColor, marginTop: 1 }}>{e.school}</p>
              </div>
              {e.dates && (
                <p style={{ fontSize: 11, color: '#9ca3af', whiteSpace: 'nowrap', flexShrink: 0 }}>{e.dates}</p>
              )}
            </div>
            {e.gpa && <p style={{ fontSize: 11, color: '#6b7280', marginTop: 2 }}>GPA: {e.gpa}</p>}
          </div>
        ))}
      </div>
    </div>
  )
}

function Skills({ data, gap, accentColor, variant }) {
  const items = flatSkills(data.skills)
  if (!items.length) return null
  return (
    <div style={{ marginBottom: gap.section }}>
      <SectionHeading label="Skills" accentColor={accentColor} variant={variant} />
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
        {items.map((s, i) => (
          <span key={i} style={{
            fontSize: 10, padding: '3px 10px', borderRadius: 20,
            border: '1px solid #e5e7eb', color: '#374151', backgroundColor: '#f9fafb',
          }}>{s}</span>
        ))}
      </div>
    </div>
  )
}

function Projects({ data, gap, accentColor, variant }) {
  const proj = data.projects || []
  if (!proj.length) return null
  return (
    <div style={{ marginBottom: gap.section }}>
      <SectionHeading label="Projects" accentColor={accentColor} variant={variant} />
      <div style={{ display: 'flex', flexDirection: 'column', gap: gap.item }}>
        {proj.map((p, i) => (
          <div key={i}>
            <p style={{ fontSize: 13, fontWeight: 600, color: '#111827' }}>{p.name}</p>
            {p.description && (
              <p style={{ fontSize: 11, color: '#4b5563', marginTop: 2, lineHeight: 1.65 }}>{p.description}</p>
            )}
            {p.tech?.length > 0 && (
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 4, marginTop: 5 }}>
                {p.tech.map((t, j) => (
                  <span key={j} style={{
                    fontSize: 10, padding: '2px 7px', borderRadius: 4,
                    backgroundColor: accentColor + '18', color: accentColor,
                  }}>{t}</span>
                ))}
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  )
}

function Certifications({ data, gap, accentColor, variant }) {
  const certs = data.certifications || []
  if (!certs.length) return null
  return (
    <div style={{ marginBottom: gap.section }}>
      <SectionHeading label="Certifications" accentColor={accentColor} variant={variant} />
      <div style={{ display: 'flex', flexDirection: 'column', gap: gap.item }}>
        {certs.map((c, i) => (
          <div key={i}>
            <p style={{ fontSize: 13, fontWeight: 600, color: '#111827' }}>{c.name || c}</p>
            {c.issuer && (
              <p style={{ fontSize: 11, color: '#6b7280' }}>{c.issuer}{c.date ? ` · ${c.date}` : ''}</p>
            )}
          </div>
        ))}
      </div>
    </div>
  )
}

const SECTION_MAP = { summary: Summary, experience: Experience, skills: Skills, education: Education, projects: Projects, certifications: Certifications }

function renderSections(order, data, gap, accentColor, variant) {
  return (order || []).map(key => {
    const Comp = SECTION_MAP[key]
    return Comp ? <Comp key={key} data={data} gap={gap} accentColor={accentColor} variant={variant} /> : null
  })
}

// ── Layouts ───────────────────────────────────────────────────────────────────

function ClassicLayout({ data, style }) {
  const { personal = {} } = data
  const { accentColor, spacing, sectionOrder, font } = style
  const onAccent = textOnBg(accentColor)
  const gap   = GAP[spacing]   || GAP.normal
  const outer = OUTER[spacing] || OUTER.normal

  return (
    <div id="resume-preview" style={{ fontFamily: FONT_STACKS[font], backgroundColor: '#fff', color: '#111827', minHeight: 900 }}>
      <div style={{ backgroundColor: accentColor, color: onAccent, padding: `${outer.py}px ${outer.px}px` }}>
        <h1 style={{ fontSize: 28, fontWeight: 700, letterSpacing: '-0.02em', lineHeight: 1.2 }}>
          {personal.name || 'Your Name'}
        </h1>
        {personal.title && (
          <p style={{ fontSize: 15, marginTop: 4, opacity: 0.8, fontWeight: 500 }}>{personal.title}</p>
        )}
        <ContactRow
          personal={personal}
          color={onAccent === '#ffffff' ? 'rgba(255,255,255,0.65)' : 'rgba(0,0,0,0.5)'}
        />
      </div>
      <div style={{ padding: `${outer.py}px ${outer.px}px` }}>
        {renderSections(sectionOrder, data, gap, accentColor, 'plain')}
      </div>
    </div>
  )
}

const SIDEBAR_KEYS = new Set(['skills', 'education'])
const MAIN_KEYS    = new Set(['summary', 'experience', 'projects', 'certifications'])

function SidebarLayout({ data, style, side }) {
  const { personal = {} } = data
  const { accentColor, spacing, sectionOrder, font } = style
  const onAccent = textOnBg(accentColor)
  const gap   = GAP[spacing]   || GAP.normal
  const outer = OUTER[spacing] || OUTER.normal

  const sideOrder = (sectionOrder || []).filter(k => SIDEBAR_KEYS.has(k))
  const mainOrder = (sectionOrder || []).filter(k => MAIN_KEYS.has(k))

  const sideTextMuted = onAccent === '#ffffff' ? 'rgba(255,255,255,0.6)' : 'rgba(0,0,0,0.45)'
  const sideTextBody  = onAccent === '#ffffff' ? 'rgba(255,255,255,0.82)' : 'rgba(0,0,0,0.78)'

  const sidebar = (
    <div style={{
      width: 210, flexShrink: 0,
      backgroundColor: accentColor, color: onAccent,
      padding: `${outer.py}px 18px`,
      minHeight: 900,
    }}>
      <div style={{ marginBottom: gap.section }}>
        <h1 style={{ fontSize: 17, fontWeight: 700, lineHeight: 1.3, letterSpacing: '-0.01em' }}>
          {personal.name || 'Your Name'}
        </h1>
        {personal.title && (
          <p style={{ fontSize: 11, marginTop: 4, opacity: 0.72, lineHeight: 1.4 }}>{personal.title}</p>
        )}
      </div>

      <div style={{ marginBottom: gap.section }}>
        <SectionHeading label="Contact" accentColor={sideTextMuted} variant="plain" />
        {[personal.email, personal.phone, personal.location, personal.linkedin, personal.github]
          .filter(Boolean)
          .map((p, i) => (
            <p key={i} style={{ fontSize: 10, color: sideTextBody, marginBottom: 3, wordBreak: 'break-all', lineHeight: 1.45 }}>
              {p}
            </p>
          ))}
      </div>

      {sideOrder.map(key => {
        if (key === 'skills') {
          const items = flatSkills(data.skills)
          if (!items.length) return null
          return (
            <div key="skills" style={{ marginBottom: gap.section }}>
              <SectionHeading label="Skills" accentColor={sideTextMuted} variant="plain" />
              <div style={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
                {items.map((s, i) => (
                  <span key={i} style={{ fontSize: 10, color: sideTextBody, lineHeight: 1.45 }}>{s}</span>
                ))}
              </div>
            </div>
          )
        }
        if (key === 'education') {
          const edu = data.education || []
          if (!edu.length) return null
          return (
            <div key="education" style={{ marginBottom: gap.section }}>
              <SectionHeading label="Education" accentColor={sideTextMuted} variant="plain" />
              {edu.map((e, i) => (
                <div key={i} style={{ marginBottom: 8 }}>
                  <p style={{ fontSize: 11, fontWeight: 600, color: sideTextBody, lineHeight: 1.4 }}>{e.degree}</p>
                  <p style={{ fontSize: 10, color: sideTextBody, opacity: 0.72, marginTop: 1 }}>{e.school}</p>
                  {e.dates && (
                    <p style={{ fontSize: 10, color: sideTextBody, opacity: 0.55, marginTop: 1 }}>{e.dates}</p>
                  )}
                </div>
              ))}
            </div>
          )
        }
        return null
      })}
    </div>
  )

  const main = (
    <div style={{ flex: 1, padding: `${outer.py}px ${outer.px - 6}px`, minHeight: 900 }}>
      {renderSections(mainOrder, data, gap, accentColor, 'bar')}
    </div>
  )

  return (
    <div id="resume-preview" style={{ fontFamily: FONT_STACKS[font], backgroundColor: '#fff', color: '#111827', display: 'flex', minHeight: 900 }}>
      {side === 'left' ? <>{sidebar}{main}</> : <>{main}{sidebar}</>}
    </div>
  )
}

function MinimalLayout({ data, style }) {
  const { personal = {} } = data
  const { accentColor, spacing, sectionOrder, font } = style
  const gap   = GAP[spacing]   || GAP.normal
  const outer = OUTER[spacing] || OUTER.normal

  return (
    <div id="resume-preview" style={{
      fontFamily: FONT_STACKS[font], backgroundColor: '#fff', color: '#111827',
      padding: `${outer.py}px ${outer.px}px`, minHeight: 900,
    }}>
      <div style={{ paddingBottom: outer.py * 0.65, borderBottom: '1.5px solid #e5e7eb', marginBottom: gap.section }}>
        <h1 style={{ fontSize: 30, fontWeight: 700, letterSpacing: '-0.02em', lineHeight: 1.2 }}>
          {personal.name || 'Your Name'}
        </h1>
        {personal.title && (
          <p style={{ fontSize: 14, color: accentColor, marginTop: 5, fontWeight: 500 }}>{personal.title}</p>
        )}
        <ContactRow personal={personal} color="#6b7280" size={11} />
      </div>
      {renderSections(sectionOrder, data, gap, accentColor, 'ruled')}
    </div>
  )
}

// ── Export ────────────────────────────────────────────────────────────────────

export default function ResumeRenderer({ data, style = DEFAULT_STYLE }) {
  if (!data) return null
  const s = { ...DEFAULT_STYLE, ...style }
  if (s.layout === 'sidebar-left')  return <SidebarLayout data={data} style={s} side="left"  />
  if (s.layout === 'sidebar-right') return <SidebarLayout data={data} style={s} side="right" />
  if (s.layout === 'minimal')       return <MinimalLayout  data={data} style={s} />
  return <ClassicLayout data={data} style={s} />
}
