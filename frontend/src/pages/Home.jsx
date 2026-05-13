import { useState, useRef, useEffect, useCallback } from 'react'
import { Link } from 'react-router-dom'
import { resumeApi, updaterApi, roastApi, toolsApi, authApi, outreachWorkspaceApi } from '../api/client'
import api from '../api/client'
import { useAuth } from '../context/AuthContext'
import ResumeRenderer, { DEFAULT_STYLE } from '../components/ResumeRenderer'
import StylePanel from '../components/StylePanel'

// ── Constants ──────────────────────────────────────────────────────────────────

const POLL_MS  = 2000
const MAX_POLL = 90

const TOOLS = [
  { key: 'build_resume', label: 'Build Resume',     placeholder: 'e.g. Senior Product Manager at a startup'         },
  { key: 'fix_resume',   label: 'Fix Resume',       placeholder: null                                               },
  { key: 'roast',        label: 'Roast My Work',    placeholder: null                                               },
  { key: 'jd_match',     label: 'JD Match',         placeholder: null                                               },
  { key: 'interview',    label: 'Interview Prep',   placeholder: 'e.g. Software Engineer at Google'                  },
  { key: 'linkedin_dm',  label: 'LinkedIn DM',      placeholder: 'e.g. Priya Sharma, Engineering Manager at Swiggy' },
  { key: 'linkedin_opt', label: 'LinkedIn Profile', placeholder: null                                               },
  { key: 'salary',       label: 'Salary Coach',     placeholder: 'e.g. Software Engineer, ₹22 LPA offer, Bangalore' },
]

const TOOL_META = {
  ...Object.fromEntries(TOOLS.map(t => [t.key, t])),
  outreach: { key: 'outreach', label: 'Application Kit', placeholder: 'Paste a job post, recruiter profile, or company lead' },
}

const STARTER_PROMPTS = [
  'Paste a job post and my resume',
  'Write a recruiter message',
  'Review my resume',
  'Prepare me for this interview',
]

const WORK_TYPES = [
  { value: 'resume', label: 'Resume / CV' }, { value: 'code', label: 'Code' },
  { value: 'pitch_deck', label: 'Pitch Deck' }, { value: 'linkedin', label: 'LinkedIn' }, { value: 'essay', label: 'Essay' },
]
const INTENSITIES = [
  { value: 'gentle',        label: 'Gentle',        sub: 'Constructive and kind'  },
  { value: 'honest',        label: 'Honest',        sub: 'Direct and clear'       },
  { value: 'gordon_ramsay', label: 'Gordon Ramsay', sub: 'Brutal and passionate'  },
  { value: 'simon_cowell',  label: 'Simon Cowell',  sub: 'Cold and blunt'         },
]
const COMPANY_TYPES = [
  { value: 'Big Tech',  label: 'Big Tech',         sub: 'FAANG-style'      },
  { value: 'Startup',   label: 'Startup',           sub: 'Fast-paced, lean' },
  { value: 'Mid-size',  label: 'Mid-size',          sub: 'Growth stage'     },
  { value: 'MNC',       label: 'MNC / Enterprise',  sub: 'Large corporate'  },
]
const ROUND_TYPES = [
  { value: 'Behavioral',    label: 'Behavioral',    sub: 'Culture, STAR questions' },
  { value: 'Technical',     label: 'Technical',     sub: 'Role-specific skills'    },
  { value: 'System Design', label: 'System Design', sub: 'Architecture & scale'    },
  { value: 'HR',            label: 'HR Round',      sub: 'Compensation, fit'       },
  { value: 'Case Study',    label: 'Case Study',    sub: 'Problem solving'         },
]
const DM_PURPOSES = [
  { value: 'Job inquiry',      label: 'Job inquiry'      },
  { value: 'Referral request', label: 'Referral request' },
  { value: 'Networking',       label: 'Networking'       },
  { value: 'Collaboration',    label: 'Collaboration'    },
]

const GREETINGS = {
  build_resume: { text: "Let's build your resume. What role are you targeting?" },
  fix_resume:   { text: "Upload your existing resume — I'll rewrite weak bullets, fix ATS issues, and preserve all your original content." },
  roast:        { text: "What would you like roasted today?", choices: WORK_TYPES },
  jd_match:     { text: "Paste your resume text below — I'll score it against any job description." },
  interview:    { text: "What role are you interviewing for?" },
  outreach:     { text: "Paste the job post, recruiter profile, company note, or rough context. I'll create application messages, follow-ups, and next steps." },
  linkedin_dm:  { text: "Who are you reaching out to? Tell me their name, role, and company." },
  linkedin_opt: { text: "Paste your current LinkedIn headline and About section — I'll rewrite both for maximum recruiter visibility." },
  salary:       { text: "Tell me about the offer — role, company, base salary, location, and any other comp details." },
}

const INITIAL_STEPS = {
  build_resume: 'role', fix_resume: 'upload', roast: 'work_type',
  jd_match: 'resume_text', interview: 'role',
  outreach: 'outreach_context',
  linkedin_dm: 'target', linkedin_opt: 'profile', salary: 'offer',
}

const WORK_LABELS = { resume: 'Resume', code: 'Code', pitch_deck: 'Pitch Deck', linkedin: 'LinkedIn', essay: 'Essay' }

// ── Shared UI ──────────────────────────────────────────────────────────────────

function ToolIcon({ toolKey, size = 20 }) {
  const s = { width: size, height: size, viewBox: '0 0 24 24', fill: 'none', stroke: 'currentColor', strokeWidth: 1.75, strokeLinecap: 'round', strokeLinejoin: 'round' }
  if (toolKey === 'build_resume') return <svg {...s}><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/><line x1="16" y1="13" x2="8" y2="13"/><line x1="16" y1="17" x2="8" y2="17"/></svg>
  if (toolKey === 'fix_resume')   return <svg {...s}><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/></svg>
  if (toolKey === 'roast')        return <svg {...s}><path d="M12 2C9.5 6.5 8 9.5 8 13a4 4 0 0 0 8 0c0-3.5-1.5-6.5-4-11z"/></svg>
  if (toolKey === 'jd_match')     return <svg {...s}><circle cx="12" cy="12" r="10"/><circle cx="12" cy="12" r="6"/><circle cx="12" cy="12" r="2" fill="currentColor" stroke="none"/></svg>
  if (toolKey === 'interview')    return <svg {...s}><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/></svg>
  if (toolKey === 'outreach')     return <svg {...s}><path d="M4 4h16v16H4z"/><path d="M8 9h8M8 13h5M8 17h3"/></svg>
  if (toolKey === 'linkedin_dm')  return <svg {...s}><line x1="22" y1="2" x2="11" y2="13"/><polygon points="22 2 15 22 11 13 2 9 22 2"/></svg>
  if (toolKey === 'linkedin_opt') return <svg {...s}><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/></svg>
  if (toolKey === 'salary')       return <svg {...s}><polyline points="23 6 13.5 15.5 8.5 10.5 1 18"/><polyline points="17 6 23 6 23 12"/></svg>
  return null
}

function AIAvatar() {
  return (
    <div className="w-7 h-7 rounded-full flex items-center justify-center flex-shrink-0"
      style={{ background: 'linear-gradient(135deg,#2563eb,#0f766e)' }}>
      <svg width="13" height="13" viewBox="0 0 24 24" fill="white">
        <path d="M12 3C9.5 7.5 8 10.5 8 14a4 4 0 0 0 8 0c0-3.5-1.5-6.5-4-11Z"/>
        <path d="M12 12c-.8 1.8-1.2 3-1.2 4a1.2 1.2 0 0 0 2.4 0c0-1-.4-2.2-1.2-4Z" fillOpacity="0.5"/>
      </svg>
    </div>
  )
}

function TypingDots() {
  return (
    <div className="flex gap-2.5 items-start">
      <AIAvatar />
      <div className="rounded-2xl rounded-tl-sm px-4 py-3"
        style={{ background: 'var(--surface-2)', border: '1px solid var(--border)' }}>
        <div className="flex gap-1 items-center h-4">
          {[0, 140, 280].map(d => <span key={d} className="w-1.5 h-1.5 rounded-full animate-bounce" style={{ background: 'var(--accent-2)', animationDelay: `${d}ms` }} />)}
        </div>
      </div>
    </div>
  )
}

function AIBubble({ text, children }) {
  return (
    <div className="flex gap-3 items-start">
      <AIAvatar />
      <div className="flex-1 min-w-0 space-y-2">
        {text && (
          <div className="rounded-2xl rounded-tl-sm px-5 py-4"
            style={{ background: 'var(--surface-2)', border: '1px solid var(--border)' }}>
            <p className="text-[14px] leading-relaxed whitespace-pre-wrap break-words" style={{ color: 'var(--text)' }}>{text}</p>
          </div>
        )}
        {children}
      </div>
    </div>
  )
}

function UserBubble({ text }) {
  return (
    <div className="flex justify-end">
      <div className="rounded-2xl rounded-tr-sm px-5 py-3.5 max-w-[78%] text-[14px] leading-relaxed"
        style={{ background: 'linear-gradient(135deg,#2563eb,#0f766e)', color: '#fff' }}>
        {text}
      </div>
    </div>
  )
}

function Choices({ items, chosen, onChoose }) {
  return (
    <div className="flex flex-wrap gap-2 mt-1">
      {items.map(c => {
        const isThis = chosen === c.value
        return (
          <button key={c.value} onClick={() => !chosen && onChoose(c.value)} disabled={!!chosen}
            className="px-3.5 py-2 rounded-xl text-sm font-medium transition-all text-left"
            style={{
              border: `2px solid ${isThis ? 'var(--accent)' : chosen ? 'rgba(255,255,255,0.05)' : 'var(--border-strong)'}`,
              background: isThis ? 'var(--accent)' : chosen ? 'rgba(255,255,255,0.02)' : 'var(--surface-3)',
              color: isThis ? '#fff' : chosen ? 'var(--text-3)' : 'var(--text)',
              cursor: chosen && !isThis ? 'default' : 'pointer',
            }}>
            <span className="block">{c.label}</span>
            {c.sub && <span className="block text-xs font-normal mt-0.5" style={{ color: isThis ? 'rgba(255,255,255,0.7)' : 'var(--text-3)' }}>{c.sub}</span>}
          </button>
        )
      })}
    </div>
  )
}

function CopyButton({ text }) {
  const [copied, setCopied] = useState(false)
  return (
    <button onClick={() => { navigator.clipboard.writeText(text); setCopied(true); setTimeout(() => setCopied(false), 2000) }}
      className="text-xs px-2.5 py-1 rounded-lg font-medium transition-all"
      style={copied ? { background: 'rgba(16,185,129,0.12)', color: '#34d399' } : { background: 'rgba(255,255,255,0.07)', color: 'var(--text-2)' }}>
      {copied ? 'Copied!' : 'Copy'}
    </button>
  )
}

function detectWorkspaceActions(input) {
  const t = input.toLowerCase()
  const compact = t.replace(/[^a-z0-9]+/g, '')
  if (!compact || compact.length < 12 || /^(hi|hello|hey|yo|test|ok|okay|hii|hiii)$/.test(compact)) {
    return []
  }
  const looksLikeResume = /\b(experience|education|skills|projects|summary|resume|cv)\b/.test(t)
  const looksLikeJob = /\b(job description|responsibilities|requirements|qualifications|apply|hiring|role)\b/.test(t)
  const looksLikeOutreach = /\b(recruiter|referral|linkedin|connect|message|outreach|email|hiring manager)\b/.test(t)
  const looksLikeInterview = /\b(interview|round|question|screening|hr call)\b/.test(t)
  const looksLikeSalary = /\b(offer|salary|ctc|lpa|compensation|negotiate|bonus)\b/.test(t)

  const actions = []
  if (looksLikeJob && looksLikeResume) actions.push({ value: 'jd_match', label: 'Match resume to job', sub: 'Score fit and gaps' })
  if (looksLikeJob || looksLikeOutreach) actions.push({ value: 'outreach', label: 'Create application kit', sub: 'Messages + follow-ups' })
  if (looksLikeResume) actions.push({ value: 'roast', label: 'Review this content', sub: 'Score and improve it' })
  if (looksLikeInterview) actions.push({ value: 'interview', label: 'Practice interview', sub: 'Questions and feedback' })
  if (looksLikeSalary) actions.push({ value: 'salary', label: 'Analyze offer', sub: 'Market range + script' })
  if (!actions.length) {
    actions.push(
      { value: 'roast', label: 'Review this', sub: 'Critique and improve' },
      { value: 'build_resume', label: 'Build resume', sub: 'Create a resume draft' },
      { value: 'outreach', label: 'Create application kit', sub: 'Messages and next steps' },
    )
  }
  return actions.slice(0, 4)
}

// ── Result components ──────────────────────────────────────────────────────────

function ResumeResult({ data, styleConfig, setStyleConfig, onPreview }) {
  return (
    <div className="mt-1 print:hidden">
      <button onClick={onPreview} className="btn-primary flex items-center gap-2 px-4 py-2 mb-3 text-sm">
        <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="15 3 21 3 21 9"/><polyline points="9 21 3 21 3 15"/><line x1="21" y1="3" x2="14" y2="10"/><line x1="3" y1="21" x2="10" y2="14"/></svg>
        Customise &amp; Download
      </button>
      <div className="rounded-xl overflow-hidden" style={{ height: 230, border: '1px solid var(--border)' }}>
        <div style={{ width: 816, transformOrigin: 'top left', transform: 'scale(0.62)' }}>
          <ResumeRenderer data={data} style={styleConfig} />
        </div>
      </div>
    </div>
  )
}

const DS = { card: { background: 'var(--surface-3)', border: '1px solid var(--border)', borderRadius: 12, padding: '1rem' }, text: { color: 'var(--text)' }, text2: { color: 'var(--text-2)' }, text3: { color: 'var(--text-3)' }, label: { fontSize: 10, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.12em', color: 'var(--text-3)', marginBottom: 6, display: 'block' }, bar: { height: 6, borderRadius: 99, background: 'rgba(255,255,255,0.06)', overflow: 'hidden' } }

function ScoreCard({ score, sub }) {
  const color = score >= 70 ? '#10b981' : score >= 50 ? '#f59e0b' : '#ef4444'
  return (
    <div className="flex items-center gap-4" style={DS.card}>
      <div><div className="text-4xl font-extrabold tabular-nums leading-none" style={{ color: 'var(--text)' }}>{score}</div><div className="text-xs mt-0.5" style={DS.text3}>{sub || 'out of 100'}</div></div>
      <div className="flex-1"><div style={DS.bar}><div style={{ height: '100%', borderRadius: 99, background: color, width: `${score}%`, transition: 'width 0.7s ease' }} /></div></div>
    </div>
  )
}

function JDMatchResult({ result }) {
  const verdictStyle = { strong_match: 'rgba(16,185,129,0.12)', good_match: 'rgba(37,99,235,0.10)', partial_match: 'rgba(245,158,11,0.12)', weak_match: 'rgba(239,68,68,0.12)' }[result.verdict] || 'rgba(255,255,255,0.06)'
  const verdictColor = { strong_match: '#34d399', good_match: '#2563eb', partial_match: '#fbbf24', weak_match: '#f87171' }[result.verdict] || 'var(--text-2)'
  return (
    <div className="mt-1 space-y-3">
      <ScoreCard score={result.score} sub="match score" />
      <div style={{ ...DS.card, paddingTop: 14 }}>
        <span className="section-title">Verdict</span>
        <span className="inline-block mt-1 text-xs font-semibold px-2.5 py-1 rounded-full" style={{ background: verdictStyle, color: verdictColor }}>{(result.verdict || '').replace(/_/g, ' ').replace(/\b\w/g, c => c.toUpperCase())}</span>
        <p className="text-[13px] leading-relaxed mt-2" style={DS.text2}>{result.summary}</p>
      </div>
      <div className="grid grid-cols-2 gap-2">
        {result.matching_keywords?.length > 0 && <div style={{ ...DS.card, background: 'rgba(16,185,129,0.06)', borderColor: 'rgba(16,185,129,0.2)' }}><span style={{ ...DS.label, color: '#34d399' }}>Matching</span><div className="flex flex-wrap gap-1">{result.matching_keywords.map((k, i) => <span key={i} className="text-xs px-2 py-0.5 rounded-full" style={{ background: 'rgba(16,185,129,0.12)', color: '#34d399' }}>{k}</span>)}</div></div>}
        {result.missing_keywords?.length > 0 && <div style={{ ...DS.card, background: 'rgba(239,68,68,0.06)', borderColor: 'rgba(239,68,68,0.2)' }}><span style={{ ...DS.label, color: '#f87171' }}>Missing</span><div className="flex flex-wrap gap-1">{result.missing_keywords.map((k, i) => <span key={i} className="text-xs px-2 py-0.5 rounded-full" style={{ background: 'rgba(239,68,68,0.12)', color: '#f87171' }}>{k}</span>)}</div></div>}
      </div>
      {result.improvements?.length > 0 && <div style={DS.card}><span className="section-title">What to fix</span><div className="space-y-2 mt-1">{result.improvements.map((imp, i) => <div key={i} className="flex gap-2.5"><div className="w-1 h-1 rounded-full mt-2 flex-shrink-0" style={{ background: 'var(--accent)' }} /><p className="text-[12px] leading-relaxed" style={DS.text2}><span className="font-semibold" style={DS.text}>{imp.section}: </span>{imp.suggestion}</p></div>)}</div></div>}
    </div>
  )
}

function InterviewResult({ result }) {
  const recColor = { 'Strong Hire': '#34d399', 'Hire': '#2563eb', 'Maybe': '#fbbf24', 'No Hire': '#f87171' }[result.hiring_recommendation] || 'var(--text-2)'
  const recBg    = { 'Strong Hire': 'rgba(16,185,129,0.1)', 'Hire': 'rgba(37,99,235,0.10)', 'Maybe': 'rgba(245,158,11,0.1)', 'No Hire': 'rgba(239,68,68,0.1)' }[result.hiring_recommendation] || 'rgba(255,255,255,0.06)'
  return (
    <div className="mt-1 space-y-3">
      <div className="flex items-center gap-4" style={DS.card}>
        <div><div className="text-4xl font-extrabold tabular-nums leading-none" style={DS.text}>{result.overall_score}</div><div className="text-xs mt-0.5" style={DS.text3}>/ 100</div></div>
        <div><span className="text-xs font-bold px-3 py-1 rounded-full" style={{ background: recBg, color: recColor }}>{result.hiring_recommendation}</span><p className="text-[12px] mt-2 leading-relaxed max-w-xs" style={DS.text2}>{result.summary}</p></div>
      </div>
      {result.per_question?.length > 0 && <div style={DS.card}><span className="section-title">Per Question</span><div className="space-y-3 mt-2">{result.per_question.map((q, i) => <div key={i} className="pl-3" style={{ borderLeft: '2px solid var(--border-strong)' }}><div className="flex items-center gap-2 mb-1"><span className="text-xs font-bold" style={DS.text3}>Q{i + 1}</span><span className="text-xs font-bold px-1.5 py-0.5 rounded" style={{ background: q.score >= 7 ? 'rgba(16,185,129,0.12)' : q.score >= 5 ? 'rgba(245,158,11,0.12)' : 'rgba(239,68,68,0.12)', color: q.score >= 7 ? '#34d399' : q.score >= 5 ? '#fbbf24' : '#f87171' }}>{q.score}/10</span></div>{q.what_was_good && <p className="text-xs mb-0.5" style={{ color: '#34d399' }}><span className="font-semibold">Good: </span>{q.what_was_good}</p>}{q.what_was_missing && <p className="text-xs" style={{ color: '#f87171' }}><span className="font-semibold">Improve: </span>{q.what_was_missing}</p>}</div>)}</div></div>}
      <div className="grid grid-cols-2 gap-2">
        {result.strengths?.length > 0 && <div style={{ ...DS.card, background: 'rgba(16,185,129,0.06)', borderColor: 'rgba(16,185,129,0.2)' }}><span style={{ ...DS.label, color: '#34d399' }}>Strengths</span>{result.strengths.map((s, i) => <p key={i} className="text-xs mb-1" style={{ color: '#34d399' }}>• {s}</p>)}</div>}
        {result.areas_to_improve?.length > 0 && <div style={{ ...DS.card, background: 'rgba(245,158,11,0.06)', borderColor: 'rgba(245,158,11,0.2)' }}><span style={{ ...DS.label, color: '#fbbf24' }}>Improve</span>{result.areas_to_improve.map((a, i) => <p key={i} className="text-xs mb-1" style={{ color: '#fbbf24' }}>• {a}</p>)}</div>}
      </div>
    </div>
  )
}

function LinkedInDMResult({ result }) {
  return (
    <div className="mt-1 space-y-2">
      {result.variants?.map((v, i) => <div key={i} style={DS.card}><div className="flex items-center justify-between mb-2"><span className="section-title">{v.style}</span><CopyButton text={v.message} /></div><p className="text-[13px] leading-relaxed" style={DS.text2}>{v.message}</p><p className="text-[11px] mt-2" style={DS.text3}>{v.message?.length || 0} chars</p></div>)}
      {result.tips?.length > 0 && <div style={{ ...DS.card, background: 'rgba(37,99,235,0.06)', borderColor: 'rgba(37,99,235,0.18)' }}><span style={{ ...DS.label, color: '#2563eb' }}>Tips</span>{result.tips.map((t, i) => <p key={i} className="text-xs mb-1" style={{ color: '#2563eb' }}>• {t}</p>)}</div>}
    </div>
  )
}

function LinkedInOptResult({ result }) {
  return (
    <div className="mt-1 space-y-3">
      {result.score_before != null && <div className="flex items-center gap-4" style={DS.card}><div className="text-center"><div className="text-2xl font-bold" style={DS.text3}>{result.score_before}</div><div className="text-[10px]" style={DS.text3}>Before</div></div><svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="var(--text-3)" strokeWidth="2"><line x1="5" y1="12" x2="19" y2="12"/><polyline points="12 5 19 12 12 19"/></svg><div className="text-center"><div className="text-2xl font-bold" style={{ color: '#10b981' }}>{result.score_after}</div><div className="text-[10px]" style={DS.text3}>After</div></div></div>}
      {result.headline && <div style={DS.card}><div className="flex items-center justify-between mb-2"><span className="section-title">New Headline</span><CopyButton text={result.headline} /></div><p className="text-[13px] font-semibold" style={DS.text}>{result.headline}</p></div>}
      {result.about && <div style={DS.card}><div className="flex items-center justify-between mb-2"><span className="section-title">About Section</span><CopyButton text={result.about} /></div><p className="text-[13px] leading-relaxed whitespace-pre-wrap" style={DS.text2}>{result.about}</p></div>}
      {result.top_keywords?.length > 0 && <div style={DS.card}><span className="section-title">Top Keywords</span><div className="flex flex-wrap gap-1.5 mt-1">{result.top_keywords.map((k, i) => <span key={i} className="text-xs px-2.5 py-1 rounded-full" style={{ background: 'rgba(37,99,235,0.10)', color: '#2563eb', border: '1px solid rgba(37,99,235,0.18)' }}>{k}</span>)}</div></div>}
    </div>
  )
}

function OutreachResult({ result }) {
  const messages = result.messages || []
  return (
    <div className="space-y-3 mt-1">
      {result.positioning?.angle && (
        <div style={DS.card}>
          <span style={DS.label}>Positioning</span>
          <p className="text-sm font-semibold" style={DS.text}>{result.positioning.angle}</p>
          {result.positioning.proof_points?.length > 0 && (
            <div className="flex flex-wrap gap-1.5 mt-3">
              {result.positioning.proof_points.map((point, i) => (
                <span key={i} className="badge badge-blue">{point}</span>
              ))}
            </div>
          )}
        </div>
      )}
      <div className="grid md:grid-cols-2 gap-3">
        {messages.map((message, i) => {
          const copy = message.subject ? `Subject: ${message.subject}\n\n${message.body}` : message.body
          return (
            <div key={`${message.type}-${i}`} style={DS.card}>
              <div className="flex items-start justify-between gap-3 mb-2">
                <div>
                  <span style={DS.label}>{message.type}</span>
                  <p className="font-semibold text-sm" style={DS.text}>{message.label}</p>
                </div>
                <CopyButton text={copy} />
              </div>
              {message.subject && <p className="text-xs font-semibold mb-2" style={DS.text2}>Subject: {message.subject}</p>}
              <p className="text-sm leading-relaxed whitespace-pre-line" style={DS.text2}>{message.body}</p>
              {message.best_for && <p className="text-xs mt-3" style={DS.text3}>{message.best_for}</p>}
            </div>
          )
        })}
      </div>
      {result.follow_up_plan?.length > 0 && (
        <div style={DS.card}>
          <span style={DS.label}>Follow-up rhythm</span>
          <div className="grid md:grid-cols-3 gap-2">
            {result.follow_up_plan.map(item => (
              <div key={item.day} className="rounded-lg px-3 py-2" style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid var(--border)' }}>
                <div className="flex items-center justify-between gap-2">
                  <span className="text-xs font-bold" style={DS.text}>{item.day}</span>
                  <span className="text-[11px]" style={DS.text3}>{item.channel}</span>
                </div>
                <p className="text-xs mt-1.5" style={DS.text2}>{item.action}</p>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}

function SalaryResult({ result }) {
  const fmt = (n) => n ? (n >= 100000 ? `₹${(n / 100000).toFixed(1)}L` : `$${(n / 1000).toFixed(0)}K`) : '—'
  const verdictColor = { 'Below Market': '#f87171', 'At Market': '#fbbf24', 'Above Market': '#34d399' }[result.verdict] || 'var(--text-2)'
  const verdictBg    = { 'Below Market': 'rgba(239,68,68,0.1)', 'At Market': 'rgba(245,158,11,0.1)', 'Above Market': 'rgba(16,185,129,0.1)' }[result.verdict] || 'rgba(255,255,255,0.06)'
  const range = result.market_range || {}
  return (
    <div className="mt-1 space-y-3">
      <div style={DS.card}>
        <div className="flex justify-between text-xs mb-1" style={DS.text3}><span>{fmt(range.low)}</span><span style={{ ...DS.text, fontWeight: 600 }}>{fmt(range.mid)} mid</span><span>{fmt(range.high)}</span></div>
        <div style={{ ...DS.bar, marginBottom: 12 }}><div style={{ height: '100%', background: 'linear-gradient(to right,#ef4444,#f59e0b,#10b981)', width: '100%', borderRadius: 99 }} /></div>
        <div className="flex items-center justify-between">
          <div><div className="text-xs mb-0.5" style={DS.text3}>Your offer</div><div className="text-xl font-bold" style={DS.text}>{fmt(result.offer_amount)}</div></div>
          <span className="text-sm font-semibold px-3 py-1 rounded-full" style={{ background: verdictBg, color: verdictColor }}>{result.verdict}</span>
        </div>
        {result.recommended_counter && <div className="mt-3 pt-3" style={{ borderTop: '1px solid var(--border)' }}><span className="text-xs" style={DS.text3}>Recommended counter: </span><span className="text-sm font-bold" style={{ color: '#34d399' }}>{fmt(result.recommended_counter)}</span></div>}
      </div>
      {result.negotiation_script && <div style={DS.card}><div className="flex items-center justify-between mb-2"><span className="section-title">Script</span><CopyButton text={result.negotiation_script} /></div><p className="text-[13px] leading-relaxed italic" style={DS.text2}>"{result.negotiation_script}"</p></div>}
      <div className="grid grid-cols-2 gap-2">
        {result.talking_points?.length > 0 && <div style={DS.card}><span className="section-title">Talking Points</span>{result.talking_points.map((t, i) => <p key={i} className="text-xs mb-1" style={DS.text2}>• {t}</p>)}</div>}
        {result.benefits_to_negotiate?.length > 0 && <div style={DS.card}><span className="section-title">Also Negotiate</span>{result.benefits_to_negotiate.map((b, i) => <p key={i} className="text-xs mb-1" style={DS.text2}>• {b}</p>)}</div>}
      </div>
      {result.advice && <div style={{ ...DS.card, background: 'rgba(37,99,235,0.06)', borderColor: 'rgba(37,99,235,0.18)' }}><p className="text-xs leading-relaxed" style={{ color: '#2563eb' }}>{result.advice}</p></div>}
    </div>
  )
}

function RoastResult({ result }) {
  return (
    <div className="mt-1 space-y-3">
      {result.score != null && <ScoreCard score={result.score} sub="roast score" />}
      <div style={DS.card}><span className="section-title">Roast</span><p className="text-[13px] leading-relaxed whitespace-pre-wrap mt-1" style={DS.text2}>{result.roast_output}</p></div>
      {result.fix_output && <div style={DS.card}><span className="section-title">How to fix it</span><p className="text-[13px] leading-relaxed whitespace-pre-wrap mt-1" style={DS.text2}>{result.fix_output}</p></div>}
    </div>
  )
}

const ENTRY_LABELS = {
  roast:           'Roast My Work',
  resume_builder:  'Resume Builder',
  resume_update:   'Resume Fix',
  jd_match:        'JD Match',
  interview:       'Interview Prep',
  linkedin_dm:     'Outreach',
  linkedin_opt:    'LinkedIn Profile',
  salary:          'Salary Coach',
}

// ── History sidebar ────────────────────────────────────────────────────────────

function HistorySidebar({ onNew, onLoadSession, sessions, user, openAuthModal }) {
  return (
    <aside className="hidden lg:flex flex-shrink-0 flex-col" style={{ width: 248, background: 'var(--surface)', borderRight: '1px solid var(--border)' }}>
      <div className="p-3 w-full" style={{ borderBottom: '1px solid var(--border)' }}>
        <button onClick={onNew} className="w-full h-11 flex items-center justify-center gap-2 rounded-xl text-sm font-semibold transition-all"
          style={{ background: 'rgba(37,99,235,0.08)', border: '1px solid rgba(37,99,235,0.18)', color: 'var(--accent)' }}
          onMouseEnter={e => e.currentTarget.style.background = 'rgba(37,99,235,0.14)'}
          onMouseLeave={e => e.currentTarget.style.background = 'rgba(37,99,235,0.08)'}>
          <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>
          New workspace
        </button>
      </div>
      <div className="flex-1 overflow-y-auto py-3 w-full">
        {!user ? (
          <div className="px-4 py-6 text-center">
            <p className="text-xs mb-3 leading-relaxed" style={{ color: 'var(--text-3)' }}>Sign in to save sessions and continue later.</p>
            <button onClick={openAuthModal} className="text-xs font-semibold transition-colors" style={{ color: 'var(--accent)' }}>Sign in</button>
          </div>
        ) : sessions.length === 0 ? (
          <p className="text-xs text-center px-4 py-6 leading-relaxed" style={{ color: 'var(--text-3)' }}>Your recent workspaces will appear here.</p>
        ) : (
          <div className="space-y-1 px-2">
            <p className="text-[10px] font-semibold uppercase tracking-widest px-3 py-2" style={{ color: 'var(--text-3)' }}>Recent</p>
            {sessions.map(s => (
              <button key={`${s.entry_type}-${s.id}`} onClick={() => onLoadSession(s)}
                className="w-full flex items-start gap-2.5 px-3 py-2.5 rounded-xl transition-all text-left"
                onMouseEnter={e => e.currentTarget.style.background = 'rgba(37,99,235,0.07)'}
                onMouseLeave={e => e.currentTarget.style.background = 'transparent'}>
                <div className="w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0"
                  style={{ background: 'rgba(37,99,235,0.08)', border: '1px solid rgba(37,99,235,0.16)', color: '#2563eb' }}>
                  <ToolIcon toolKey={s.tool_key || 'roast'} size={13} />
                </div>
                <div className="min-w-0">
                  <p className="text-[12px] font-semibold truncate" style={{ color: 'var(--text)' }}>{s.title || 'Activity'}</p>
                  <p className="text-[11px] truncate" style={{ color: 'var(--text-3)' }}>{ENTRY_LABELS[s.entry_type] || s.entry_type || 'Session'}</p>
                </div>
              </button>
            ))}
          </div>
        )}
      </div>
      <div className="border-t p-3 w-full" style={{ borderColor: 'var(--border)' }}>
        {user?.profile?.is_pro ? (
          <div className="rounded-xl px-3 py-2 text-xs font-bold text-center" style={{ background: 'rgba(37,99,235,0.10)', color: 'var(--accent)' }}>PRO - Unlimited</div>
        ) : (
          <Link to="/pricing" className="flex items-center justify-center gap-2 rounded-xl px-3 py-2 text-xs font-semibold transition-colors"
            style={{ color: 'var(--accent-2)' }}
            onMouseEnter={e => e.currentTarget.style.background = 'rgba(37,99,235,0.07)'}
            onMouseLeave={e => e.currentTarget.style.background = 'transparent'}>
            Upgrade
          </Link>
        )}
      </div>
    </aside>
  )
}

// ── Main Home (unified chat interface) ─────────────────────────────────────────

export default function Home() {
  const { user, openAuthModal, openUpgradeModal, refreshUser } = useAuth()
  const [sessions,    setSessions]    = useState([])
  const [activeTool,  setActiveTool]  = useState(null)
  const [msgs,        setMsgs]        = useState([])
  const [step,        setStep]        = useState(null)
  const [text,        setText]        = useState('')
  const [roastText,   setRoastText]   = useState('')
  const [collected,   setCollected]   = useState({})
  const [isLoading,   setIsLoading]   = useState(false)
  const [result,      setResult]      = useState(null)
  const [resumeData,  setResumeData]  = useState(null)
  const [styleConfig, setStyleConfig] = useState(DEFAULT_STYLE)
  const [previewOpen, setPreviewOpen] = useState(false)
  const [roastMode,   setRoastMode]   = useState('text')
  const [roastFile,   setRoastFile]   = useState(null)
  const [sessionId,   setSessionId]   = useState(null)
  const [questions,   setQuestions]   = useState([])
  const [qIdx,        setQIdx]        = useState(0)
  const [answers,     setAnswers]     = useState([])

  const bottomRef    = useRef()
  const inputRef     = useRef()
  const fixFileRef   = useRef()
  const roastFileRef = useRef()
  const pollRef      = useRef(null)

  const chatActive = msgs.length > 0

  const mergeActivity = useCallback((entry) => {
    setSessions(prev => {
      const next = [entry, ...prev.filter(p => !(p.id === entry.id && p.entry_type === entry.entry_type))]
      next.sort((a, b) => new Date(b.created_at) - new Date(a.created_at))
      return next.slice(0, 40)
    })
  }, [])

  const refreshActivity = useCallback(async () => {
    if (!user) return
    try {
      const { data } = await authApi.activity(40)
      setSessions((data.results ?? data).slice(0, 40))
    } catch {
      // ignore transient activity refresh errors
    }
  }, [user])

  useEffect(() => {
    refreshActivity()
  }, [refreshActivity])

  useEffect(() => {
    if (!user) return
    const timer = setInterval(() => { refreshActivity() }, 7000)
    return () => clearInterval(timer)
  }, [user, refreshActivity])

  useEffect(() => { bottomRef.current?.scrollIntoView({ behavior: 'smooth' }) }, [msgs, isLoading])
  useEffect(() => { if (!isLoading) inputRef.current?.focus() }, [step, isLoading])

  const stopPoll = () => { if (pollRef.current) { clearInterval(pollRef.current); pollRef.current = null } }

  const pushAI   = useCallback((msg) => setMsgs(p => [...p, { type: 'ai',  id: Date.now() + Math.random(), ...msg }]), [])
  const pushUser = useCallback((t)   => setMsgs(p => [...p, { type: 'user', id: Date.now() + Math.random(), text: t }]), [])
  const markChosen = (msgId, val)    => setMsgs(p => p.map(m => m.id === msgId ? { ...m, chosen: val } : m))

  const startPoll = (fetchFn, onDone, onFail) => {
    let count = 0
    pollRef.current = setInterval(async () => {
      if (++count > MAX_POLL) { stopPoll(); onFail('Timed out. Please try again.'); return }
      try {
        const { data } = await fetchFn()
        if (data.status === 'completed') { stopPoll(); onDone(data) }
        else if (data.status === 'failed') { stopPoll(); onFail('Something went wrong. Please try again.') }
      } catch { stopPoll(); onFail('Connection error.') }
    }, POLL_MS)
  }

  // Start a fresh session with a given tool and optional pre-populated first message
  const startTool = (toolKey, firstMessage = '') => {
    stopPoll()
    setActiveTool(toolKey)
    setStep(INITIAL_STEPS[toolKey])
    setText('')
    setRoastText('')
    setCollected({})
    setIsLoading(false)
    setResult(null)
    setResumeData(null)
    setRoastMode('text')
    setRoastFile(null)
    setSessionId(null)
    setQuestions([])
    setQIdx(0)
    setAnswers([])

    const greeting = { type: 'ai', id: 'init', ...(GREETINGS[toolKey] || { text: 'How can I help?' }) }

    const textFirstCfg = {
      build_resume: { key: 'role',       nextStep: 'exp',          nextAI: { text: "Tell me about your work experience — companies, roles, achievements. Include dates." } },
      interview:    { key: 'role',       nextStep: 'company_type', nextAI: { text: 'What type of company?', choices: COMPANY_TYPES } },
      linkedin_dm:  { key: 'targetInfo', nextStep: 'purpose',      nextAI: { text: "What's the purpose of reaching out?", choices: DM_PURPOSES } },
      salary:       { key: 'offer',      nextStep: 'experience',   nextAI: { text: "Your background: experience level, years in field, current/previous salary." } },
    }[toolKey]

    if (firstMessage && textFirstCfg) {
      setMsgs([greeting, { type: 'user', id: 'u0', text: firstMessage }, { type: 'ai', id: 'a1', ...textFirstCfg.nextAI }])
      setStep(textFirstCfg.nextStep)
      setCollected({ [textFirstCfg.key]: firstMessage })
    } else {
      setMsgs([greeting])
    }
  }

  const resetToHome = () => {
    stopPoll()
    setActiveTool(null)
    setMsgs([])
    setStep(null)
    setText('')
    setCollected({})
    setIsLoading(false)
    setResult(null)
    setResumeData(null)
  }

  // Load a historical activity inline into the chat
  const loadSession = async (item) => {
    stopPoll()
    setActiveTool(item?.tool_key || 'roast')
    setStep('loading')
    setMsgs([])
    setIsLoading(true)
    setResult(null)
    setResumeData(null)

    const showPending = (label, statusValue) => {
      setMsgs([{ type: 'ai', id: 'hist-pending', text: `${label} is ${statusValue}. Check back shortly.` }])
      setStep(null)
      setActiveTool(null)
    }

    try {
      if (item.entry_type === 'roast') {
        const { data } = await roastApi.get(item.id)
        if (data.status === 'completed') {
          setMsgs([{
            type: 'ai', id: 'hist-roast',
            text: `${WORK_LABELS[data.work_type] || 'Work'} roast — ${new Date(data.created_at).toLocaleDateString()}`,
            kind: 'roast', result: data,
          }])
          setStep('done')
        } else {
          showPending('This roast', data.status)
        }
      } else if (item.entry_type === 'resume_builder') {
        const { data } = await resumeApi.get(item.id)
        if (data.status === 'completed' && data.resume_data) {
          setResumeData(data.resume_data)
          setMsgs([{ type: 'ai', id: 'hist-resume', text: 'Loaded your generated resume.', kind: 'resume' }])
          setStep('done')
        } else {
          showPending('This resume build', data.status)
        }
      } else if (item.entry_type === 'resume_update') {
        const { data } = await updaterApi.get(item.id)
        if (data.status === 'completed' && data.resume_data) {
          setResumeData(data.resume_data)
          setMsgs([{ type: 'ai', id: 'hist-resume-fix', text: 'Loaded your improved resume.', kind: 'resume_fix', issues: data.issues }])
          setStep('done')
        } else {
          showPending('This resume fix', data.status)
        }
      } else if (item.entry_type === 'jd_match') {
        const { data } = await toolsApi.jdMatch.get(item.id)
        if (data.status === 'completed' && data.result) {
          setMsgs([{ type: 'ai', id: 'hist-jd', text: 'Loaded your JD match analysis.', kind: 'jd_match', result: data.result }])
          setStep('done')
        } else {
          showPending('This JD match', data.status)
        }
      } else if (item.entry_type === 'interview') {
        const { data } = await toolsApi.interview.get(item.id)
        if (data.status === 'completed' && data.result) {
          setResult(data.result)
          setMsgs([{ type: 'ai', id: 'hist-interview', text: 'Loaded your interview feedback.', kind: 'interview', result: data.result }])
          setStep('done')
        } else {
          showPending('This interview session', data.status)
        }
      } else if (item.entry_type === 'linkedin_dm') {
        const { data } = await toolsApi.linkedinDm.get(item.id)
        if (data.status === 'completed' && data.result) {
          setMsgs([{ type: 'ai', id: 'hist-lidm', text: 'Loaded your LinkedIn DM variants.', kind: 'linkedin_dm', result: data.result }])
          setStep('done')
        } else {
          showPending('This LinkedIn DM request', data.status)
        }
      } else if (item.entry_type === 'linkedin_opt') {
        const { data } = await toolsApi.linkedinOpt.get(item.id)
        if (data.status === 'completed' && data.result) {
          setMsgs([{ type: 'ai', id: 'hist-liopt', text: 'Loaded your LinkedIn optimization result.', kind: 'linkedin_opt', result: data.result }])
          setStep('done')
        } else {
          showPending('This LinkedIn optimization', data.status)
        }
      } else if (item.entry_type === 'salary') {
        const { data } = await toolsApi.salary.get(item.id)
        if (data.status === 'completed' && data.result) {
          setMsgs([{ type: 'ai', id: 'hist-salary', text: 'Loaded your salary analysis.', kind: 'salary', result: data.result }])
          setStep('done')
        } else {
          showPending('This salary analysis', data.status)
        }
      } else {
        setMsgs([{ type: 'ai', id: 'hist-unknown', text: 'Unsupported history entry type.' }])
        setStep(null)
        setActiveTool(null)
      }
    } catch {
      setMsgs([{ type: 'ai', id: 'hist-err', text: 'Could not load this session. Please try again.' }])
      setStep(null)
      setActiveTool(null)
    }
    setIsLoading(false)
  }

  // ── Choice handler ──────────────────────────────────────────────────────────

  const onChoice = (value, label, msgId) => {
    markChosen(msgId, value)
    pushUser(label)
    if (step === 'intent') {
      const rawContext = collected.rawContext || ''
      if (value === 'outreach') {
        setActiveTool('outreach')
        doOutreach({ rawContext })
      } else if (value === 'roast') {
        setActiveTool('roast')
        setCollected({ workType: 'resume', intensity: 'honest' })
        setRoastText(rawContext)
        pushAI({ text: 'I can review this directly. Send it for critique, or edit the text below first.' })
        setStep('content')
      } else if (value === 'jd_match') {
        setActiveTool('jd_match')
        setCollected({ resumeText: rawContext })
        pushAI({ text: 'I will use that as your resume/context. Now paste the job description to compare against.' })
        setStep('jd_text')
      } else {
        startTool(value, rawContext)
      }
      return
    }

    if (activeTool === 'roast') {
      if (step === 'work_type') {
        setCollected(c => ({ ...c, workType: value }))
        pushAI({ text: 'How brutal should I be?', choices: INTENSITIES })
        setStep('intensity')
      } else if (step === 'intensity') {
        setCollected(c => ({ ...c, intensity: value }))
        pushAI({ text: 'Paste your content below, or switch to upload a file:' })
        setStep('content')
      }
    } else if (activeTool === 'interview') {
      if (step === 'company_type') {
        setCollected(c => ({ ...c, companyType: value }))
        pushAI({ text: 'What type of interview round?', choices: ROUND_TYPES })
        setStep('round_type')
      } else if (step === 'round_type') {
        setCollected(c => ({ ...c, roundType: value }))
        doInterviewStart({ ...collected, roundType: value })
      }
    } else if (activeTool === 'linkedin_dm' && step === 'purpose') {
      setCollected(c => ({ ...c, purpose: value }))
      pushAI({ text: 'Your background in 1–2 lines — role, experience, what you bring:' })
      setStep('background')
    }
  }

  // ── Text submit handler ─────────────────────────────────────────────────────

  const onText = (override) => {
    const t = (override ?? text).trim()
    if (!t) return
    if (!override) setText('')

    if (!chatActive) {
      // Starting chat from welcome state
      if (!activeTool) {
        const choices = detectWorkspaceActions(t)
        if (!choices.length) {
          setMsgs([
            { type: 'user', id: 'u0', text: t },
            {
              type: 'ai',
              id: 'hello',
              text: "Hi. Paste a resume, job post, offer, interview invite, or recruiter profile and I'll suggest the right next step.",
            },
          ])
          setStep('free_context')
          return
        }
        setMsgs([
          { type: 'user', id: 'u0', text: t.length > 260 ? t.slice(0, 260) + '…' : t },
          { type: 'ai', id: 'intent', text: 'I can work with that. What should I do first?', choices },
        ])
        setCollected({ rawContext: t })
        setStep('intent')
        return
      }
      if (activeTool === 'outreach') {
        setMsgs([
          { type: 'ai', id: 'init', ...(GREETINGS.outreach) },
          { type: 'user', id: 'u0', text: t.length > 260 ? t.slice(0, 260) + '…' : t },
        ])
        doOutreach({ rawContext: t })
        return
      }
      startTool(activeTool, t)
      return
    }

    if (!activeTool && step === 'free_context') {
      const choices = detectWorkspaceActions(t)
      pushUser(t.length > 260 ? t.slice(0, 260) + '…' : t)
      if (!choices.length) {
        pushAI({ text: "Send me a little more job-search context: a resume, job post, offer details, interview invite, or recruiter profile." })
        return
      }
      setCollected({ rawContext: t })
      pushAI({ text: 'I can work with that. What should I do first?', choices })
      setStep('intent')
      return
    }

    if (activeTool === 'build_resume') {
      if (step === 'role') {
        pushUser(t); setCollected(c => ({ ...c, role: t }))
        pushAI({ text: "Tell me about your work experience — companies, roles, achievements. Include dates." })
        setStep('exp')
      } else if (step === 'exp') {
        pushUser(t.length > 120 ? t.slice(0, 120) + '…' : t); setCollected(c => ({ ...c, experience: t }))
        pushAI({ text: "Any education? Degree, school, year, GPA — or type skip." })
        setStep('edu')
      } else if (step === 'edu') {
        pushUser(t); setCollected(c => ({ ...c, education: t.toLowerCase() === 'skip' ? '' : t }))
        pushAI({ text: "Skills to highlight? Languages, tools, frameworks — or skip." })
        setStep('skills')
      } else if (step === 'skills') {
        pushUser(t); setCollected(c => ({ ...c, skills: t.toLowerCase() === 'skip' ? '' : t }))
        pushAI({ text: "Almost done — your name and contact info on one line." })
        setStep('contact')
      } else if (step === 'contact') {
        pushUser(t); doBuildResume({ ...collected, contact: t })
      }
    } else if (activeTool === 'interview') {
      if (step === 'role') {
        pushUser(t); setCollected(c => ({ ...c, role: t }))
        pushAI({ text: 'What type of company?', choices: COMPANY_TYPES })
        setStep('company_type')
      } else if (step === 'interview_answer') {
        submitAnswer(t)
      }
    } else if (activeTool === 'outreach') {
      if (step === 'outreach_context') {
        pushUser(t.length > 180 ? t.slice(0, 180) + '…' : t)
        doOutreach({ rawContext: t })
      }
    } else if (activeTool === 'jd_match') {
      if (step === 'resume_text') {
        pushUser(t.length > 100 ? t.slice(0, 100) + '…' : t); setCollected(c => ({ ...c, resumeText: t }))
        pushAI({ text: "Now paste the job description:" })
        setStep('jd_text')
      } else if (step === 'jd_text') {
        pushUser(t.length > 100 ? t.slice(0, 100) + '…' : t); doJDMatch({ ...collected, jdText: t })
      }
    } else if (activeTool === 'linkedin_dm') {
      if (step === 'target') {
        pushUser(t); setCollected(c => ({ ...c, targetInfo: t }))
        pushAI({ text: "What's the purpose of reaching out?", choices: DM_PURPOSES })
        setStep('purpose')
      } else if (step === 'background') {
        pushUser(t); doLinkedInDM({ ...collected, background: t })
      }
    } else if (activeTool === 'linkedin_opt') {
      if (step === 'profile') {
        pushUser(t.length > 100 ? t.slice(0, 100) + '…' : t); setCollected(c => ({ ...c, profile: t }))
        pushAI({ text: "What role are you targeting? (or type 'keep current direction')" })
        setStep('target_role')
      } else if (step === 'target_role') {
        pushUser(t); doLinkedInOpt({ ...collected, targetRole: t })
      }
    } else if (activeTool === 'salary') {
      if (step === 'offer') {
        pushUser(t); setCollected(c => ({ ...c, offer: t }))
        pushAI({ text: "Your background: experience level, years in field, current/previous salary." })
        setStep('experience')
      } else if (step === 'experience') {
        pushUser(t); setCollected(c => ({ ...c, experience: t }))
        pushAI({ text: "Your situation: employed or looking, any competing offers or deadline pressure?" })
        setStep('situation')
      } else if (step === 'situation') {
        pushUser(t); doSalary({ ...collected, situation: t })
      }
    }
  }

  // ── API flows ───────────────────────────────────────────────────────────────

  const doBuildResume = (snap) => {
    if (!user && !localStorage.getItem('access_token')) { openAuthModal(() => doBuildResume(snap)); return }
    setIsLoading(true); setStep('loading')
    pushAI({ text: 'Building your resume… usually 15–30 seconds.' })
    const go = async () => {
      try {
        const raw = [snap.contact, snap.experience, snap.education && `Education: ${snap.education}`, snap.skills && `Skills: ${snap.skills}`].filter(Boolean).join('\n\n')
        const { data } = await resumeApi.generate({ target_role: snap.role || 'Professional', raw_input: raw })
        if (user) {
          mergeActivity({
            id: data.id,
            entry_type: 'resume_builder',
            tool_key: 'build_resume',
            title: `Resume Builder${snap.role ? ` - ${snap.role}` : ''}`,
            status: data.status || 'pending',
            score: null,
            created_at: new Date().toISOString(),
          })
          refreshActivity()
        }
        startPoll(() => resumeApi.get(data.id),
          (r) => { setResumeData(r.resume_data); setIsLoading(false); setStep('done'); pushAI({ kind: 'resume', text: "Here's your resume! Click Customise to change fonts, colors and layout." }); refreshUser(); refreshActivity() },
          (msg) => { setIsLoading(false); setStep('role'); pushAI({ text: msg }); refreshActivity() })
      } catch (err) {
        setIsLoading(false); setStep('role')
        if (err.response?.status === 402) openUpgradeModal()
        else pushAI({ text: 'Something went wrong. Please try again.' })
      }
    }
    go()
  }

  const doFix = (file) => {
    if (!user && !localStorage.getItem('access_token')) { openAuthModal(() => doFix(file)); return }
    setIsLoading(true); setStep('loading')
    pushAI({ text: 'Analyzing and rewriting your resume… 20–40 seconds.' })
    const go = async () => {
      try {
        const fd = new FormData(); fd.append('file', file)
        const { data } = await updaterApi.submit(fd)
        if (user) {
          mergeActivity({
            id: data.id,
            entry_type: 'resume_update',
            tool_key: 'fix_resume',
            title: 'Resume Fix',
            status: data.status || 'pending',
            score: null,
            created_at: new Date().toISOString(),
          })
          refreshActivity()
        }
        startPoll(() => updaterApi.get(data.id),
          (r) => { setResumeData(r.resume_data); setIsLoading(false); setStep('done'); pushAI({ kind: 'resume_fix', text: "Here's your improved resume!", issues: r.issues }); refreshUser(); refreshActivity() },
          (msg) => { setIsLoading(false); setStep('upload'); pushAI({ text: msg }); refreshActivity() })
      } catch (err) {
        setIsLoading(false); setStep('upload')
        if (err.response?.status === 402) openUpgradeModal()
        else pushAI({ text: 'Something went wrong. Please try again.' })
      }
    }
    go()
  }

  const doRoast = () => {
    const hasText = roastText.trim().length > 0
    const hasFile = roastFile !== null
    if (!hasText && !hasFile) return
    const preview = hasFile ? `Uploaded: ${roastFile.name}` : (roastText.length > 100 ? roastText.slice(0, 100) + '…' : roastText)
    pushUser(preview); setIsLoading(true); setStep('loading')
    pushAI({ text: 'Roasting… 20–40 seconds.' })
    const go = async () => {
      try {
        const fd = new FormData()
        fd.append('work_type', collected.workType || 'resume')
        fd.append('intensity', collected.intensity || 'honest')
        if (hasFile) fd.append('file', roastFile)
        else fd.append('input_text', roastText.trim())
        const { data } = await roastApi.submit(fd)
        if (user) {
          mergeActivity({
            id: data.id,
            entry_type: 'roast',
            tool_key: 'roast',
            title: `Roast: ${WORK_LABELS[collected.workType || 'resume'] || 'Resume'}`,
            status: data.status || 'pending',
            score: null,
            created_at: new Date().toISOString(),
          })
          refreshActivity()
        }
        refreshUser()
        startPoll(() => roastApi.get(data.id),
          (r) => { setResult(r); setIsLoading(false); setStep('done'); pushAI({ kind: 'roast', text: "Here's your roast!", result: r }); refreshActivity() },
          (msg) => { setIsLoading(false); setStep('content'); pushAI({ text: msg }); refreshActivity() })
      } catch (err) {
        setIsLoading(false); setStep('content')
        if (err.response?.status === 402) openUpgradeModal()
        else pushAI({ text: 'Something went wrong. Please try again.' })
      }
    }
    go()
  }

  const doInterviewStart = (snap) => {
    if (!user && !localStorage.getItem('access_token')) { openAuthModal(() => doInterviewStart(snap)); return }
    setIsLoading(true); setStep('loading')
    pushAI({ text: `Preparing your ${snap.roundType} interview for ${snap.role} at ${snap.companyType}…` })
    const go = async () => {
      try {
        const { data } = await toolsApi.interview.create({ role: snap.role, company_type: snap.companyType, round_type: snap.roundType })
        if (user) {
          mergeActivity({
            id: data.id,
            entry_type: 'interview',
            tool_key: 'interview',
            title: `Interview Prep${snap.role ? ` - ${snap.role}` : ''}`,
            status: data.status || 'pending',
            score: null,
            created_at: new Date().toISOString(),
          })
          refreshActivity()
        }
        setSessionId(data.id)
        startPoll(() => toolsApi.interview.get(data.id),
          (r) => { if (r.questions?.length > 0) { setQuestions(r.questions); setQIdx(0); setAnswers([]); setIsLoading(false); setStep('interview_answer'); pushAI({ text: `Question 1 of ${r.questions.length}:\n\n${r.questions[0]}` }); refreshActivity() } },
          (msg) => { setIsLoading(false); setStep('role'); pushAI({ text: msg }); refreshActivity() })
      } catch (err) {
        setIsLoading(false); setStep('role')
        if (err.response?.status === 402) openUpgradeModal()
        else pushAI({ text: 'Something went wrong. Please try again.' })
      }
    }
    go()
  }

  const submitAnswer = (ans) => {
    pushUser(ans.length > 120 ? ans.slice(0, 120) + '…' : ans)
    const newAnswers = [...answers, ans]; setAnswers(newAnswers)
    if (newAnswers.length < questions.length) {
      const next = qIdx + 1; setQIdx(next)
      pushAI({ text: `Question ${next + 1} of ${questions.length}:\n\n${questions[next]}` })
    } else {
      setIsLoading(true); setStep('loading')
      pushAI({ text: "All answers in. Evaluating your performance…" })
      const go = async () => {
        try {
          await toolsApi.interview.evaluate(sessionId, { answers: newAnswers })
          startPoll(() => toolsApi.interview.get(sessionId),
            (r) => { setResult(r.result); setIsLoading(false); setStep('done'); pushAI({ kind: 'interview', text: "Here's your interview feedback!" }); refreshActivity() },
            (msg) => { setIsLoading(false); pushAI({ text: msg }); refreshActivity() })
        } catch { setIsLoading(false); pushAI({ text: 'Something went wrong with evaluation.' }) }
      }
      go()
    }
  }

  const doJDMatch = (snap) => {
    if (!user && !localStorage.getItem('access_token')) { openAuthModal(() => doJDMatch(snap)); return }
    setIsLoading(true); setStep('loading')
    pushAI({ text: 'Comparing your resume against the job description… 15–25 seconds.' })
    const go = async () => {
      try {
        const { data } = await toolsApi.jdMatch.submit({ resume_text: snap.resumeText, jd_text: snap.jdText })
        if (user) {
          mergeActivity({
            id: data.id,
            entry_type: 'jd_match',
            tool_key: 'jd_match',
            title: 'JD Match',
            status: data.status || 'pending',
            score: null,
            created_at: new Date().toISOString(),
          })
          refreshActivity()
        }
        startPoll(() => toolsApi.jdMatch.get(data.id),
          (r) => { setResult(r.result); setIsLoading(false); setStep('done'); pushAI({ kind: 'jd_match', text: "Here's your match analysis!", result: r.result }); refreshUser(); refreshActivity() },
          (msg) => { setIsLoading(false); setStep('resume_text'); pushAI({ text: msg }); refreshActivity() })
      } catch (err) {
        setIsLoading(false); setStep('resume_text')
        if (err.response?.status === 402) openUpgradeModal()
        else pushAI({ text: 'Something went wrong. Please try again.' })
      }
    }
    go()
  }

  const doLinkedInDM = (snap) => {
    if (!user && !localStorage.getItem('access_token')) { openAuthModal(() => doLinkedInDM(snap)); return }
    setIsLoading(true); setStep('loading')
    pushAI({ text: 'Crafting your outreach messages… a few seconds.' })
    const go = async () => {
      try {
        const { data } = await toolsApi.linkedinDm.submit({ target_info: snap.targetInfo, purpose: snap.purpose, user_background: snap.background })
        if (user) {
          mergeActivity({
            id: data.id,
            entry_type: 'linkedin_dm',
            tool_key: 'linkedin_dm',
            title: 'LinkedIn DM',
            status: data.status || 'pending',
            score: null,
            created_at: new Date().toISOString(),
          })
          refreshActivity()
        }
        startPoll(() => toolsApi.linkedinDm.get(data.id),
          (r) => { setResult(r.result); setIsLoading(false); setStep('done'); pushAI({ kind: 'linkedin_dm', text: "Here are your outreach messages!", result: r.result }); refreshUser(); refreshActivity() },
          (msg) => { setIsLoading(false); setStep('target'); pushAI({ text: msg }); refreshActivity() })
      } catch (err) {
        setIsLoading(false); setStep('target')
        if (err.response?.status === 402) openUpgradeModal()
        else pushAI({ text: 'Something went wrong. Please try again.' })
      }
    }
    go()
  }

  const doOutreach = (snap) => {
    if (!user && !localStorage.getItem('access_token')) { openAuthModal(() => doOutreach(snap)); return }
    const raw = (snap.rawContext || '').trim()
    const compact = raw.replace(/[^a-z0-9]+/gi, '')
    if (compact.length < 30) {
      setIsLoading(false)
      setStep('outreach_context')
      pushAI({ text: 'I need a little more context first. Paste a job post, company name, recruiter profile, or your background so I can create useful messages instead of placeholders.' })
      return
    }
    setIsLoading(true); setStep('loading')
    pushAI({ text: 'Creating your application kit… messages, follow-ups, and next action.' })
    const go = async () => {
      try {
        const { data } = await outreachWorkspaceApi.generate({
          raw_context: snap.rawContext || '',
          company: snap.company || '',
          target_role: snap.targetRole || '',
          contact_name: snap.contactName || '',
          contact_role: snap.contactRole || '',
          contact_channel: snap.contactChannel || 'Both',
          user_background: snap.userBackground || snap.rawContext || '',
          resume_highlights: snap.resumeHighlights || '',
        })
        setResult(data)
        setIsLoading(false)
        setStep('done')
        pushAI({ kind: 'outreach', text: 'Here is your application kit.', result: data })
        refreshUser()
      } catch (err) {
        setIsLoading(false); setStep('outreach_context')
        if (err.response?.status === 402) openUpgradeModal()
        else pushAI({ text: err.response?.data?.detail || 'Something went wrong. Please try again.' })
      }
    }
    go()
  }

  const doLinkedInOpt = (snap) => {
    if (!user && !localStorage.getItem('access_token')) { openAuthModal(() => doLinkedInOpt(snap)); return }
    setIsLoading(true); setStep('loading')
    pushAI({ text: 'Optimizing your LinkedIn profile… a few seconds.' })
    const go = async () => {
      try {
        const { data } = await toolsApi.linkedinOpt.submit({ current_profile: snap.profile, target_role: snap.targetRole || '' })
        if (user) {
          mergeActivity({
            id: data.id,
            entry_type: 'linkedin_opt',
            tool_key: 'linkedin_opt',
            title: 'LinkedIn Optimize',
            status: data.status || 'pending',
            score: null,
            created_at: new Date().toISOString(),
          })
          refreshActivity()
        }
        startPoll(() => toolsApi.linkedinOpt.get(data.id),
          (r) => { setResult(r.result); setIsLoading(false); setStep('done'); pushAI({ kind: 'linkedin_opt', text: "Here's your optimized profile!", result: r.result }); refreshUser(); refreshActivity() },
          (msg) => { setIsLoading(false); setStep('profile'); pushAI({ text: msg }); refreshActivity() })
      } catch (err) {
        setIsLoading(false); setStep('profile')
        if (err.response?.status === 402) openUpgradeModal()
        else pushAI({ text: 'Something went wrong. Please try again.' })
      }
    }
    go()
  }

  const doSalary = (snap) => {
    if (!user && !localStorage.getItem('access_token')) { openAuthModal(() => doSalary(snap)); return }
    setIsLoading(true); setStep('loading')
    pushAI({ text: 'Analyzing your offer against market data…' })
    const go = async () => {
      try {
        const { data } = await toolsApi.salary.submit({ offer_details: snap.offer, experience_info: snap.experience, situation: snap.situation || '' })
        if (user) {
          mergeActivity({
            id: data.id,
            entry_type: 'salary',
            tool_key: 'salary',
            title: 'Salary Coach',
            status: data.status || 'pending',
            score: null,
            created_at: new Date().toISOString(),
          })
          refreshActivity()
        }
        startPoll(() => toolsApi.salary.get(data.id),
          (r) => { setResult(r.result); setIsLoading(false); setStep('done'); pushAI({ kind: 'salary', text: "Here's your salary analysis!", result: r.result }); refreshUser(); refreshActivity() },
          (msg) => { setIsLoading(false); setStep('offer'); pushAI({ text: msg }); refreshActivity() })
      } catch (err) {
        setIsLoading(false); setStep('offer')
        if (err.response?.status === 402) openUpgradeModal()
        else pushAI({ text: 'Something went wrong. Please try again.' })
      }
    }
    go()
  }

  // ── Input area derived state ────────────────────────────────────────────────

  const isChoiceStep  = ['intent', 'work_type', 'intensity', 'company_type', 'round_type', 'purpose'].includes(step)
  const isMultiline   = ['free_context', 'outreach_context', 'exp', 'edu', 'skills', 'resume_text', 'jd_text', 'profile', 'offer', 'experience', 'situation'].includes(step)
  const isTextStep    = ['free_context', 'outreach_context', 'role', 'exp', 'edu', 'skills', 'contact', 'resume_text', 'jd_text', 'target', 'background', 'target_role', 'offer', 'experience', 'situation', 'interview_answer'].includes(step)
  const activeMeta    = TOOL_META[activeTool]
  const preStartInput = !chatActive && activeTool && activeMeta?.placeholder
  const workspaceInput = !chatActive && !activeTool
  const canSend       = !chatActive ? (!activeTool ? text.trim() : (!activeMeta?.placeholder || text.trim())) : (isTextStep && text.trim())

  const placeholder = {
    role:             activeTool === 'interview' ? 'e.g. Software Engineer' : 'e.g. Senior Product Manager',
    exp:              'Companies, roles, achievements with dates…',
    edu:              'Degree, school, year — or skip',
    skills:           'Python, React, SQL… — or skip',
    contact:          'John Doe, john@email.com, +1-555-0123, New York',
    free_context:     'Paste a resume, job post, offer, interview invite, or recruiter profile...',
    resume_text:      'Paste your full resume text here…',
    jd_text:          'Paste the full job description here…',
    outreach_context: 'Paste the job post, recruiter profile, company lead, or rough context…',
    target:           'e.g. Priya Sharma, Engineering Manager at Swiggy',
    background:       'e.g. 4 years in backend engineering at a fintech startup',
    target_role:      "e.g. Senior SWE at FAANG, or 'keep current direction'",
    profile:          'Paste your LinkedIn headline and About section here…',
    offer:            'e.g. Software Engineer at Zepto, ₹22 LPA base, ₹3L joining bonus, Bangalore',
    experience:       'e.g. 4 years exp, currently at ₹16 LPA, 2 promotions',
    situation:        'e.g. currently employed, no competing offers, decision needed in 1 week',
    interview_answer: questions[qIdx] ? `Answer: "${questions[qIdx].slice(0, 55)}…"` : 'Your answer…',
  }[step] || (preStartInput ? activeMeta.placeholder : 'Paste a resume, job post, offer, interview invite, or recruiter profile...')

  // ── Greeting ────────────────────────────────────────────────────────────────

  const hour = new Date().getHours()
  const name = user?.first_name || user?.username
  const greeting = name
    ? (hour < 12 ? `Good morning, ${name}` : hour < 17 ? `Good afternoon, ${name}` : `Good evening, ${name}`)
    : 'What do you want to work on?'

  // ── Render ──────────────────────────────────────────────────────────────────

  return (
    <div className="flex overflow-hidden h-full">
      <HistorySidebar onNew={resetToHome} onLoadSession={loadSession} sessions={sessions} user={user} openAuthModal={openAuthModal} />

      {/* ONE unified panel — layout never changes */}
      <div className="flex-1 flex flex-col overflow-hidden min-w-0" style={{ background: 'var(--bg)' }}>

        {/* Tool tab strip — only when chat is active, sits at top */}
        {chatActive && (
          <div className="flex-shrink-0" style={{ background: 'var(--surface)', borderBottom: '1px solid var(--border)' }}>
            <div className="max-w-4xl mx-auto px-4 py-2 flex items-center gap-1.5 overflow-x-auto" style={{ scrollbarWidth: 'none' }}>
              {TOOLS.map(t => (
                <button key={t.key} onClick={() => startTool(t.key)}
                  className="flex items-center gap-1 px-3 py-1.5 rounded-full text-[11px] font-medium whitespace-nowrap flex-shrink-0 transition-all"
                  style={activeTool === t.key
                    ? { background: 'var(--accent)', border: '1px solid var(--accent)', color: '#fff' }
                    : { background: 'var(--surface-2)', border: '1px solid var(--border-strong)', color: 'var(--text-2)' }
                  }
                  onMouseEnter={e => { if (activeTool !== t.key) { e.currentTarget.style.borderColor = 'rgba(37,99,235,0.32)'; e.currentTarget.style.color = 'var(--accent)' } }}
                  onMouseLeave={e => { if (activeTool !== t.key) { e.currentTarget.style.borderColor = 'var(--border-strong)'; e.currentTarget.style.color = 'var(--text-2)' } }}>
                  <ToolIcon toolKey={t.key} size={10} />
                  {t.label}
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Messages / Greeting area — fills available space */}
        <div className="flex-1 overflow-y-auto flex flex-col">
          {!chatActive ? (
            /* Greeting — shown when no messages yet */
            <div className="flex-1 flex flex-col items-center px-5 pt-14 pb-6">
              <div className="w-full max-w-5xl mx-auto">
                <div className="grid lg:grid-cols-[1fr_300px] gap-6 items-stretch">
                  <div className="rounded-2xl p-8 md:p-10"
                    style={{ background: 'linear-gradient(135deg,#ffffff 0%,#eef2ff 100%)', border: '1px solid var(--border)', boxShadow: '0 18px 60px rgba(79,70,229,0.10)' }}>
                    <p className="text-xs font-bold uppercase tracking-[0.18em] mb-4" style={{ color: 'var(--accent)' }}>Career workspace</p>
                    <h1 className="text-4xl md:text-5xl font-extrabold mb-4 tracking-tight leading-tight" style={{ color: 'var(--text)' }}>{activeTool ? activeMeta?.label : greeting}</h1>
                    <p className="text-base md:text-lg max-w-2xl" style={{ color: 'var(--text-2)' }}>
                      {activeTool ? 'Type below and I will guide the next step.' : 'Paste a resume, job post, offer, interview invite, or recruiter profile. I will choose the right workflow with you.'}
                    </p>
                    <div className="flex flex-wrap gap-2 mt-7">
                      {STARTER_PROMPTS.map(prompt => (
                        <button key={prompt} onClick={() => setText(prompt)}
                          className="rounded-full px-3.5 py-2 text-sm font-medium transition-all"
                          style={{ background: '#fff', border: '1px solid var(--border-strong)', color: 'var(--text-2)' }}
                          onMouseEnter={e => { e.currentTarget.style.borderColor = 'rgba(37,99,235,0.30)'; e.currentTarget.style.color = 'var(--text)' }}
                          onMouseLeave={e => { e.currentTarget.style.borderColor = 'var(--border-strong)'; e.currentTarget.style.color = 'var(--text-2)' }}>
                          {prompt}
                        </button>
                      ))}
                    </div>
                  </div>
                  <div className="rounded-2xl p-5"
                    style={{ background: 'var(--surface)', border: '1px solid var(--border)', boxShadow: '0 12px 40px rgba(15,23,42,0.06)' }}>
                    <p className="text-xs font-bold uppercase tracking-[0.16em] mb-4" style={{ color: 'var(--text-3)' }}>What I can do</p>
                    <div className="space-y-3">
                      {[
                        ['Resume', 'Build, fix, roast, and tailor it.'],
                        ['Jobs', 'Compare against JDs and find gaps.'],
                        ['Apply', 'Create messages and follow-ups.'],
                        ['Interviews', 'Practice and score your answers.'],
                      ].map(([title, body]) => (
                        <div key={title} className="rounded-xl px-3 py-3" style={{ background: 'var(--surface-2)', border: '1px solid var(--border)' }}>
                          <p className="text-sm font-bold" style={{ color: 'var(--text)' }}>{title}</p>
                          <p className="text-xs mt-1" style={{ color: 'var(--text-3)' }}>{body}</p>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
                {user && !user.profile?.is_pro && (
                  <div className="inline-flex items-center gap-3 rounded-xl px-4 py-2.5 text-sm mt-5"
                    style={{ background: 'var(--surface)', border: '1px solid var(--border)' }}>
                    <span style={{ color: 'var(--text-2)' }}><span className="font-semibold" style={{ color: 'var(--text)' }}>{user.profile?.roast_credits ?? 0}</span> credits</span>
                    <Link to="/pricing" className="text-xs font-semibold pl-3 transition-colors" style={{ color: 'var(--accent-2)', borderLeft: '1px solid var(--border)' }}>Upgrade to Pro</Link>
                  </div>
                )}
              </div>
            </div>
          ) : (
            /* Chat messages — centered column matching input width, pinned to bottom */
            <div className="max-w-4xl mx-auto w-full px-4 pt-4 pb-4 space-y-4 mt-auto">
              {msgs.map(msg => (
                <div key={msg.id}>
                  {msg.type === 'user'
                    ? <UserBubble text={msg.text} />
                    : <AIBubble text={msg.text}>
                        {msg.choices && (
                          <Choices items={msg.choices} chosen={msg.chosen}
                            onChoose={(val) => { const label = msg.choices.find(c => c.value === val)?.label || val; onChoice(val, label, msg.id) }} />
                        )}
                        {(msg.kind === 'resume' || msg.kind === 'resume_fix') && resumeData && (
                          <>
                            {msg.kind === 'resume_fix' && msg.issues && (
                              <div className="mt-2 bg-blue-50 border border-blue-100 rounded-xl px-4 py-3 text-sm text-blue-800">
                                <span className="font-semibold">What we improved: </span>{msg.issues}
                              </div>
                            )}
                            <ResumeResult data={resumeData} styleConfig={styleConfig} setStyleConfig={setStyleConfig} onPreview={() => setPreviewOpen(true)} />
                          </>
                        )}
                        {msg.kind === 'jd_match'   && msg.result && <JDMatchResult result={msg.result} />}
                        {msg.kind === 'roast'       && msg.result && <RoastResult result={msg.result} />}
                        {msg.kind === 'interview'   && (msg.result || result) && <InterviewResult result={msg.result || result} />}
                        {msg.kind === 'outreach'    && msg.result && <OutreachResult result={msg.result} />}
                        {msg.kind === 'linkedin_dm' && msg.result && <LinkedInDMResult result={msg.result} />}
                        {msg.kind === 'linkedin_opt'&& msg.result && <LinkedInOptResult result={msg.result} />}
                        {msg.kind === 'salary'      && msg.result && <SalaryResult result={msg.result} />}
                      </AIBubble>
                  }
                </div>
              ))}
              {isLoading && <TypingDots />}
              <div ref={bottomRef} />
            </div>
          )}
        </div>

        {/* Resume preview modal */}
        {previewOpen && resumeData && (
          <div className="fixed inset-0 z-50 flex">
            <div className="flex-1 overflow-y-auto" style={{ background: 'var(--surface-2)' }}>
              <div className="max-w-3xl mx-auto px-6 py-8">
                <div className="flex items-center gap-3 mb-6 print:hidden">
                  <button onClick={() => setPreviewOpen(false)} className="flex items-center gap-1.5 text-[13px] font-medium rounded-xl px-3 py-2 transition-all"
                    style={{ background: 'var(--surface)', border: '1px solid var(--border)', color: 'var(--text-2)' }}
                    onMouseEnter={e => e.currentTarget.style.color = 'var(--text)'}
                    onMouseLeave={e => e.currentTarget.style.color = 'var(--text-2)'}>
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><line x1="19" y1="12" x2="5" y2="12"/><polyline points="12 19 5 12 12 5"/></svg>Back
                  </button>
                  <button onClick={() => window.print()} className="btn-primary flex items-center gap-2 text-[13px] py-2 px-4">
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="6 9 6 2 18 2 18 9"/><path d="M6 18H4a2 2 0 0 1-2-2v-5a2 2 0 0 1 2-2h16a2 2 0 0 1 2 2v5a2 2 0 0 1-2 2h-2"/><rect x="6" y="14" width="12" height="8"/></svg>
                    Print / Save PDF
                  </button>
                </div>
                <ResumeRenderer data={resumeData} style={styleConfig} />
              </div>
            </div>
            <StylePanel style={styleConfig} onChange={setStyleConfig} />
          </div>
        )}

        {/* ── Input area — ALWAYS at the bottom, NEVER moves ── */}
        <div className="px-4 py-3 flex-shrink-0" style={{ borderTop: '1px solid var(--border)', background: 'var(--surface)' }}>
          <div className="max-w-4xl mx-auto">

            {/* Tool chips — only shown on the greeting/pre-start screen */}
            {!chatActive && (
              <div className="flex items-center gap-2 overflow-x-auto pb-2 mb-2" style={{ scrollbarWidth: 'none' }}>
                {TOOLS.map(t => (
                  <button
                    key={t.key}
                    onClick={() => startTool(t.key)}
                    className="inline-flex items-center gap-2 rounded-full px-3.5 py-2 text-sm font-medium whitespace-nowrap transition-all"
                    style={activeTool === t.key
                      ? { background: 'var(--accent)', border: '1px solid var(--accent)', color: '#fff' }
                      : { background: 'var(--surface-2)', border: '1px solid var(--border-strong)', color: 'var(--text-2)' }
                    }
                    onMouseEnter={e => {
                      if (activeTool !== t.key) {
                        e.currentTarget.style.borderColor = 'rgba(79,70,229,0.35)'
                        e.currentTarget.style.color = 'var(--text)'
                      }
                    }}
                    onMouseLeave={e => {
                      if (activeTool !== t.key) {
                        e.currentTarget.style.borderColor = 'var(--border-strong)'
                        e.currentTarget.style.color = 'var(--text-2)'
                      }
                    }}
                  >
                    <ToolIcon toolKey={t.key} size={14} />
                    {t.label}
                  </button>
                ))}
              </div>
            )}

            {/* Input controls — adapt based on step */}

            {step === 'done' && (
              <button onClick={resetToHome}
                className="w-full flex items-center justify-center gap-2 text-[13px] font-medium py-2.5 rounded-xl transition-all"
                style={{ background: 'var(--surface-2)', border: '1px solid var(--border-strong)', color: 'var(--text-2)' }}
                onMouseEnter={e => { e.currentTarget.style.background = 'var(--surface-3)'; e.currentTarget.style.color = 'var(--text)' }}
                onMouseLeave={e => { e.currentTarget.style.background = 'var(--surface-2)'; e.currentTarget.style.color = 'var(--text-2)' }}>
                <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="1 4 1 10 7 10"/><path d="M3.51 15a9 9 0 1 0 .49-3.5"/></svg>
                Start a new conversation
              </button>
            )}

            {step === 'upload' && !isLoading && (
              <>
                <input ref={fixFileRef} type="file" accept=".txt,.pdf,.md" className="hidden"
                  onChange={e => { if (e.target.files[0]) { const f = e.target.files[0]; pushUser(`Uploaded: ${f.name}`); doFix(f) } }} />
                <button onClick={() => fixFileRef.current?.click()}
                  className="w-full rounded-xl py-6 text-center transition-all"
                  style={{ border: '2px dashed var(--border-strong)', background: 'var(--surface-2)' }}
                  onMouseEnter={e => { e.currentTarget.style.borderColor = 'rgba(37,99,235,0.32)'; e.currentTarget.style.background = 'rgba(37,99,235,0.05)' }}
                  onMouseLeave={e => { e.currentTarget.style.borderColor = 'var(--border-strong)'; e.currentTarget.style.background = 'var(--surface-2)' }}>
                  <div className="w-9 h-9 mx-auto mb-2 rounded-xl flex items-center justify-center" style={{ background: 'var(--surface-3)', border: '1px solid var(--border)' }}>
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="var(--text-3)" strokeWidth="1.5"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="17 8 12 3 7 8"/><line x1="12" y1="3" x2="12" y2="15"/></svg>
                  </div>
                  <p className="text-[13px] font-medium" style={{ color: 'var(--text)' }}>Click to upload your resume</p>
                  <p className="text-xs mt-1" style={{ color: 'var(--text-3)' }}>.pdf · .txt · .md</p>
                </button>
              </>
            )}

            {activeTool === 'roast' && step === 'content' && !isLoading && (
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-medium" style={{ color: 'var(--text-3)' }}>Your content</span>
                  <div className="flex rounded-lg overflow-hidden text-xs" style={{ border: '1px solid var(--border-strong)' }}>
                    {['text', 'file'].map(m => (
                      <button key={m} onClick={() => setRoastMode(m)}
                        className="px-3 py-1.5 font-medium transition-colors"
                        style={roastMode === m
                          ? { background: 'var(--accent)', color: '#fff' }
                          : { background: 'var(--surface-2)', color: 'var(--text-2)' }}>
                        {m === 'text' ? 'Paste text' : 'Upload file'}
                      </button>
                    ))}
                  </div>
                </div>
                {roastMode === 'text'
                  ? <div className="flex gap-2 items-end">
                      <textarea value={roastText} onChange={e => setRoastText(e.target.value)}
                        placeholder="Paste your resume, code, essay, LinkedIn bio…" rows={4}
                        className="flex-1 input-base resize-none text-[13px] font-mono leading-relaxed" />
                      <button onClick={doRoast} disabled={!roastText.trim()}
                        className="w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0 transition-all"
                        style={{ background: roastText.trim() ? 'var(--accent)' : 'var(--surface-3)', cursor: roastText.trim() ? 'pointer' : 'not-allowed' }}>
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5"><line x1="5" y1="12" x2="19" y2="12"/><polyline points="12 5 19 12 12 19"/></svg>
                      </button>
                    </div>
                  : <div className="flex gap-2 items-center">
                      <input ref={roastFileRef} type="file" accept=".txt,.pdf,.md,.py,.js,.ts,.jsx,.tsx,.java,.go,.rs,.cpp,.c" className="hidden"
                        onChange={e => e.target.files[0] && setRoastFile(e.target.files[0])} />
                      <div onClick={() => roastFileRef.current?.click()}
                        className="flex-1 rounded-xl py-5 text-center cursor-pointer transition-all"
                        style={roastFile
                          ? { border: '2px dashed rgba(37,99,235,0.32)', background: 'rgba(37,99,235,0.06)' }
                          : { border: '2px dashed var(--border-strong)', background: 'var(--surface-2)' }}>
                        {roastFile
                          ? <p className="text-sm font-medium" style={{ color: '#2563eb' }}>{roastFile.name} · Click to change</p>
                          : <><p className="text-sm font-medium" style={{ color: 'var(--text)' }}>Click to upload</p><p className="text-xs mt-0.5" style={{ color: 'var(--text-3)' }}>.pdf .txt .py .js and more</p></>}
                      </div>
                      <button onClick={doRoast} disabled={!roastFile}
                        className="w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0 transition-all"
                        style={{ background: roastFile ? 'var(--accent)' : 'var(--surface-3)', cursor: roastFile ? 'pointer' : 'not-allowed' }}>
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5"><line x1="5" y1="12" x2="19" y2="12"/><polyline points="12 5 19 12 12 19"/></svg>
                      </button>
                    </div>
                }
              </div>
            )}

            {isChoiceStep && !isLoading && (
              <p className="text-center text-xs py-1" style={{ color: 'var(--text-3)' }}>Choose an option above to continue</p>
            )}

            {isLoading && (
              <p className="text-center text-xs py-1" style={{ color: 'var(--text-3)' }}>Processing… please wait</p>
            )}

            {/* Main text input — for pre-start and text steps */}
            {step !== 'done' && step !== 'upload' && step !== 'content' && !isChoiceStep && !isLoading && (
              <div className="flex gap-2 items-end">
                {activeTool && !chatActive && (
                  <span className="inline-flex items-center gap-1.5 text-[11px] font-semibold rounded-lg px-2 py-1 flex-shrink-0 mb-0.5"
                    style={{ background: 'rgba(37,99,235,0.10)', border: '1px solid rgba(37,99,235,0.18)', color: '#2563eb' }}>
                    <ToolIcon toolKey={activeTool} size={11} />
                    {activeMeta?.label}
                    <button onClick={() => setActiveTool(null)} className="ml-0.5 transition-colors" style={{ color: 'rgba(165,180,252,0.5)' }}
                      onMouseEnter={e => e.currentTarget.style.color = '#2563eb'}
                      onMouseLeave={e => e.currentTarget.style.color = 'rgba(37,99,235,0.5)'}>
                      <svg width="9" height="9" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round">
                        <line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>
                      </svg>
                    </button>
                  </span>
                )}
                {isMultiline || workspaceInput
                  ? <textarea ref={inputRef} value={text} onChange={e => setText(e.target.value)}
                      onKeyDown={e => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); onText() } }}
                      placeholder={placeholder} rows={workspaceInput ? 3 : 4}
                      className="flex-1 input-base resize-none text-[15px] leading-relaxed" />
                  : <input ref={inputRef} value={text} onChange={e => setText(e.target.value)}
                      onKeyDown={e => e.key === 'Enter' && (chatActive ? onText() : canSend && onText())}
                      placeholder={placeholder}
                      disabled={!!activeTool && !chatActive && !activeMeta?.placeholder}
                      className="flex-1 input-base text-[15px]" />
                }
                <button
                  onClick={() => chatActive ? onText() : (canSend && onText())}
                  disabled={!canSend}
                  className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 transition-all"
                  style={{ background: canSend ? 'var(--accent)' : 'var(--surface-3)', cursor: canSend ? 'pointer' : 'not-allowed' }}
                  onMouseEnter={e => { if (canSend) e.currentTarget.style.boxShadow = '0 0 18px rgba(37,99,235,0.25)' }}
                  onMouseLeave={e => e.currentTarget.style.boxShadow = 'none'}>
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none"
                    stroke={canSend ? 'white' : 'var(--text-3)'} strokeWidth="2.5" strokeLinecap="round">
                    <line x1="5" y1="12" x2="19" y2="12"/><polyline points="12 5 19 12 12 19"/>
                  </svg>
                </button>
              </div>
            )}

          </div>
        </div>
      </div>
    </div>
  )
}
