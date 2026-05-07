import { useState, useRef, useEffect, useCallback } from 'react'
import { resumeApi, updaterApi, roastApi, toolsApi } from '../api/client'
import { useAuth } from '../context/AuthContext'
import ResumeRenderer, { DEFAULT_STYLE } from '../components/ResumeRenderer'
import StylePanel from '../components/StylePanel'

const POLL_MS  = 2000
const MAX_POLL = 90

// ── Static configs (defined first so GREETINGS can reference them) ────────────

const WORK_TYPES = [
  { value: 'resume',     label: 'Resume / CV'  },
  { value: 'code',       label: 'Code'          },
  { value: 'pitch_deck', label: 'Pitch Deck'   },
  { value: 'linkedin',   label: 'LinkedIn'      },
  { value: 'essay',      label: 'Essay'         },
]
const INTENSITIES = [
  { value: 'gentle',        label: 'Gentle',        sub: 'Constructive and kind'   },
  { value: 'honest',        label: 'Honest',        sub: 'Direct and clear'        },
  { value: 'gordon_ramsay', label: 'Gordon Ramsay', sub: 'Brutal and passionate'   },
  { value: 'simon_cowell',  label: 'Simon Cowell',  sub: 'Cold and blunt'          },
]
const COMPANY_TYPES = [
  { value: 'Big Tech',  label: 'Big Tech',       sub: 'FAANG-style'         },
  { value: 'Startup',   label: 'Startup',        sub: 'Fast-paced, lean'    },
  { value: 'Mid-size',  label: 'Mid-size',       sub: 'Growth stage'        },
  { value: 'MNC',       label: 'MNC / Enterprise', sub: 'Large corporate'   },
]
const ROUND_TYPES = [
  { value: 'Behavioral',   label: 'Behavioral',    sub: 'Culture, STAR questions' },
  { value: 'Technical',    label: 'Technical',      sub: 'Role-specific skills'    },
  { value: 'System Design',label: 'System Design',  sub: 'Architecture & scale'    },
  { value: 'HR',           label: 'HR Round',       sub: 'Compensation, fit'       },
  { value: 'Case Study',   label: 'Case Study',     sub: 'Problem solving'         },
]
const DM_PURPOSES = [
  { value: 'Job inquiry',      label: 'Job inquiry'      },
  { value: 'Referral request', label: 'Referral request' },
  { value: 'Networking',       label: 'Networking'       },
  { value: 'Collaboration',    label: 'Collaboration'    },
]

const TOOL_META = {
  build_resume: { name: 'Build Resume',       category: 'Resume',    dot: 'bg-orange-500'  },
  fix_resume:   { name: 'Fix Resume',         category: 'Resume',    dot: 'bg-orange-500'  },
  roast:        { name: 'Roast My Work',      category: 'Resume',    dot: 'bg-orange-500'  },
  jd_match:     { name: 'JD Match Score',     category: 'Apply',     dot: 'bg-sky-500'     },
  interview:    { name: 'Interview Prep',     category: 'Apply',     dot: 'bg-sky-500'     },
  linkedin_dm:  { name: 'LinkedIn DM',        category: 'Network',   dot: 'bg-violet-500'  },
  linkedin_opt: { name: 'LinkedIn Optimizer', category: 'Network',   dot: 'bg-violet-500'  },
  salary:       { name: 'Salary Coach',       category: 'Negotiate', dot: 'bg-emerald-500' },
}

const GREETINGS = {
  build_resume: { text: "Let's build your resume. What role are you targeting?" },
  fix_resume:   { text: "Upload your existing resume — I'll rewrite weak bullets, fix ATS issues, and preserve all your original content." },
  roast:        { text: "What would you like roasted today?", choices: WORK_TYPES },
  jd_match:     { text: "Paste your resume text below — I'll score it against any job description." },
  interview:    { text: "What role are you interviewing for?" },
  linkedin_dm:  { text: "Who are you reaching out to? Tell me their name, role, and company." },
  linkedin_opt: { text: "Paste your current LinkedIn headline and About section — I'll rewrite both for maximum recruiter visibility." },
  salary:       { text: "Tell me about the offer — role, company, base salary, location, and any other comp details." },
}

const INITIAL_STEPS = {
  build_resume: 'role', fix_resume: 'upload', roast: 'work_type',
  jd_match: 'resume_text', interview: 'role',
  linkedin_dm: 'target', linkedin_opt: 'profile', salary: 'offer',
}

// ── Shared UI primitives ──────────────────────────────────────────────────────

function AIAvatar() {
  return (
    <div className="w-7 h-7 rounded-full bg-gray-900 flex items-center justify-center flex-shrink-0">
      <svg width="13" height="13" viewBox="0 0 24 24" fill="white">
        <path d="M12 3C9.5 7.5 8 10.5 8 14a4 4 0 0 0 8 0c0-3.5-1.5-6.5-4-11Z"/>
        <path d="M12 12c-.8 1.8-1.2 3-1.2 4a1.2 1.2 0 0 0 2.4 0c0-1-.4-2.2-1.2-4Z" fillOpacity="0.4"/>
      </svg>
    </div>
  )
}

function TypingDots() {
  return (
    <div className="flex gap-2.5 items-start">
      <AIAvatar />
      <div className="bg-white border border-gray-100 rounded-2xl rounded-tl-sm px-4 py-3 shadow-sm">
        <div className="flex gap-1 items-center h-4">
          {[0, 140, 280].map(d => (
            <span key={d} className="w-1.5 h-1.5 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: `${d}ms` }} />
          ))}
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
          <div className="bg-white border border-gray-100 rounded-2xl rounded-tl-sm px-4 py-3 shadow-sm">
            <p className="text-gray-800 text-sm leading-relaxed whitespace-pre-wrap break-words">{text}</p>
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
      <div className="bg-orange-500 text-white rounded-2xl rounded-tr-sm px-4 py-3 max-w-[78%] text-sm leading-relaxed">
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
            className={`px-3.5 py-2 rounded-xl border-2 text-sm font-medium transition-all text-left
              ${isThis
                ? 'border-orange-500 bg-orange-500 text-white'
                : chosen
                  ? 'border-gray-100 bg-gray-50 text-gray-300 cursor-default'
                  : 'border-gray-200 bg-white text-gray-700 hover:border-orange-300 hover:bg-orange-50 hover:text-orange-700'
              }`}>
            <span className="block">{c.label}</span>
            {c.sub && (
              <span className={`block text-xs font-normal mt-0.5 ${isThis ? 'text-orange-100' : chosen ? 'text-gray-300' : 'text-gray-400'}`}>
                {c.sub}
              </span>
            )}
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
      className={`text-xs px-2.5 py-1 rounded-lg font-medium transition-all ${copied ? 'bg-green-100 text-green-700' : 'bg-gray-100 hover:bg-gray-200 text-gray-600'}`}>
      {copied ? 'Copied!' : 'Copy'}
    </button>
  )
}

// ── Result components ─────────────────────────────────────────────────────────

function ResumeResult({ data, styleConfig, setStyleConfig, onPreview }) {
  return (
    <div className="mt-1 print:hidden">
      <button onClick={onPreview}
        className="flex items-center gap-2 px-4 py-2 mb-3 rounded-xl bg-orange-500 hover:bg-orange-600 text-white text-sm font-medium transition-colors">
        <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <polyline points="15 3 21 3 21 9"/><polyline points="9 21 3 21 3 15"/>
          <line x1="21" y1="3" x2="14" y2="10"/><line x1="3" y1="21" x2="10" y2="14"/>
        </svg>
        Customise &amp; Download
      </button>
      <div className="rounded-xl overflow-hidden border border-gray-200 shadow-sm" style={{ height: 230 }}>
        <div style={{ width: 816, transformOrigin: 'top left', transform: 'scale(0.62)' }}>
          <ResumeRenderer data={data} style={styleConfig} />
        </div>
      </div>
    </div>
  )
}

function JDMatchResult({ result }) {
  const verdictCls = { strong_match: 'text-green-700 bg-green-50 border-green-200', good_match: 'text-blue-700 bg-blue-50 border-blue-200', partial_match: 'text-yellow-700 bg-yellow-50 border-yellow-200', weak_match: 'text-red-700 bg-red-50 border-red-200' }[result.verdict] || 'text-gray-700 bg-gray-50 border-gray-200'
  return (
    <div className="mt-1 space-y-3">
      <div className="bg-white border border-gray-200 rounded-2xl p-4 shadow-sm">
        <div className="flex items-center gap-4 mb-3">
          <div>
            <div className="text-4xl font-bold text-gray-900 leading-none">{result.score}</div>
            <div className="text-xs text-gray-400 mt-0.5">out of 100</div>
          </div>
          <div className="flex-1">
            <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
              <div className={`h-full rounded-full ${result.score >= 70 ? 'bg-green-500' : result.score >= 50 ? 'bg-yellow-400' : 'bg-red-500'}`} style={{ width: `${result.score}%` }} />
            </div>
            <span className={`inline-block mt-2 text-xs font-semibold px-2.5 py-0.5 rounded-full border ${verdictCls}`}>
              {(result.verdict || '').replace(/_/g, ' ').replace(/\b\w/g, c => c.toUpperCase())}
            </span>
          </div>
        </div>
        <p className="text-sm text-gray-600 leading-relaxed border-t border-gray-100 pt-3">{result.summary}</p>
      </div>
      <div className="grid grid-cols-2 gap-2">
        {result.matching_keywords?.length > 0 && (
          <div className="bg-green-50 border border-green-100 rounded-xl p-3">
            <p className="text-[10px] font-bold uppercase tracking-widest text-green-600 mb-2">Matching</p>
            <div className="flex flex-wrap gap-1">
              {result.matching_keywords.map((k, i) => <span key={i} className="text-xs px-2 py-0.5 bg-green-100 text-green-700 rounded-full">{k}</span>)}
            </div>
          </div>
        )}
        {result.missing_keywords?.length > 0 && (
          <div className="bg-red-50 border border-red-100 rounded-xl p-3">
            <p className="text-[10px] font-bold uppercase tracking-widest text-red-600 mb-2">Missing</p>
            <div className="flex flex-wrap gap-1">
              {result.missing_keywords.map((k, i) => <span key={i} className="text-xs px-2 py-0.5 bg-red-100 text-red-700 rounded-full">{k}</span>)}
            </div>
          </div>
        )}
      </div>
      {result.improvements?.length > 0 && (
        <div className="bg-white border border-gray-200 rounded-xl p-4 shadow-sm">
          <p className="text-[10px] font-bold uppercase tracking-widest text-gray-400 mb-3">What to fix</p>
          <div className="space-y-2">
            {result.improvements.map((imp, i) => (
              <div key={i} className="flex gap-2.5">
                <div className="w-1 h-1 rounded-full bg-orange-400 mt-2 flex-shrink-0" />
                <p className="text-xs text-gray-600 leading-relaxed"><span className="font-semibold text-gray-800">{imp.section}: </span>{imp.suggestion}</p>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}

function InterviewResult({ result }) {
  const recCls = { 'Strong Hire': 'text-green-700 bg-green-50 border-green-200', 'Hire': 'text-blue-700 bg-blue-50 border-blue-200', 'Maybe': 'text-yellow-700 bg-yellow-50 border-yellow-200', 'No Hire': 'text-red-700 bg-red-50 border-red-200' }[result.hiring_recommendation] || 'text-gray-700 bg-gray-50 border-gray-200'
  return (
    <div className="mt-1 space-y-3">
      <div className="bg-white border border-gray-200 rounded-2xl p-4 shadow-sm flex items-center gap-4">
        <div>
          <div className="text-4xl font-bold text-gray-900 leading-none">{result.overall_score}</div>
          <div className="text-xs text-gray-400 mt-0.5">/ 100</div>
        </div>
        <div>
          <span className={`text-sm font-bold px-3 py-1 rounded-full border ${recCls}`}>{result.hiring_recommendation}</span>
          <p className="text-xs text-gray-500 mt-2 leading-relaxed max-w-xs">{result.summary}</p>
        </div>
      </div>
      {result.per_question?.length > 0 && (
        <div className="bg-white border border-gray-200 rounded-xl p-4 shadow-sm">
          <p className="text-[10px] font-bold uppercase tracking-widest text-gray-400 mb-3">Per Question</p>
          <div className="space-y-4">
            {result.per_question.map((q, i) => (
              <div key={i} className="border-l-2 border-gray-100 pl-3">
                <div className="flex items-center gap-2 mb-1">
                  <span className="text-xs font-bold text-gray-500">Q{i + 1}</span>
                  <span className={`text-xs font-bold px-1.5 py-0.5 rounded ${q.score >= 7 ? 'bg-green-100 text-green-700' : q.score >= 5 ? 'bg-yellow-100 text-yellow-700' : 'bg-red-100 text-red-700'}`}>{q.score}/10</span>
                </div>
                {q.what_was_good && <p className="text-xs text-green-700 mb-0.5"><span className="font-semibold">Good: </span>{q.what_was_good}</p>}
                {q.what_was_missing && <p className="text-xs text-red-600"><span className="font-semibold">Improve: </span>{q.what_was_missing}</p>}
              </div>
            ))}
          </div>
        </div>
      )}
      <div className="grid grid-cols-2 gap-2">
        {result.strengths?.length > 0 && (
          <div className="bg-green-50 border border-green-100 rounded-xl p-3">
            <p className="text-[10px] font-bold uppercase tracking-widest text-green-600 mb-2">Strengths</p>
            {result.strengths.map((s, i) => <p key={i} className="text-xs text-green-800 mb-1">• {s}</p>)}
          </div>
        )}
        {result.areas_to_improve?.length > 0 && (
          <div className="bg-amber-50 border border-amber-100 rounded-xl p-3">
            <p className="text-[10px] font-bold uppercase tracking-widest text-amber-600 mb-2">Improve</p>
            {result.areas_to_improve.map((a, i) => <p key={i} className="text-xs text-amber-800 mb-1">• {a}</p>)}
          </div>
        )}
      </div>
    </div>
  )
}

function LinkedInDMResult({ result }) {
  return (
    <div className="mt-1 space-y-2">
      {result.variants?.map((v, i) => (
        <div key={i} className="bg-white border border-gray-200 rounded-xl p-4 shadow-sm">
          <div className="flex items-center justify-between mb-2">
            <span className="text-[10px] font-bold uppercase tracking-widest text-gray-400">{v.style}</span>
            <CopyButton text={v.message} />
          </div>
          <p className="text-sm text-gray-700 leading-relaxed">{v.message}</p>
          <p className="text-[11px] text-gray-400 mt-2">{v.message?.length || 0} chars</p>
        </div>
      ))}
      {result.tips?.length > 0 && (
        <div className="bg-blue-50 border border-blue-100 rounded-xl p-3">
          <p className="text-[10px] font-bold uppercase tracking-widest text-blue-600 mb-2">Tips</p>
          {result.tips.map((t, i) => <p key={i} className="text-xs text-blue-800 mb-1">• {t}</p>)}
        </div>
      )}
    </div>
  )
}

function LinkedInOptResult({ result }) {
  return (
    <div className="mt-1 space-y-3">
      {result.score_before != null && (
        <div className="bg-white border border-gray-200 rounded-xl p-4 shadow-sm flex items-center gap-4">
          <div className="text-center">
            <div className="text-2xl font-bold text-gray-400">{result.score_before}</div>
            <div className="text-[10px] text-gray-400">Before</div>
          </div>
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#9ca3af" strokeWidth="2"><line x1="5" y1="12" x2="19" y2="12"/><polyline points="12 5 19 12 12 19"/></svg>
          <div className="text-center">
            <div className="text-2xl font-bold text-green-600">{result.score_after}</div>
            <div className="text-[10px] text-gray-400">After</div>
          </div>
        </div>
      )}
      {result.headline && (
        <div className="bg-white border border-gray-200 rounded-xl p-4 shadow-sm">
          <div className="flex items-center justify-between mb-2">
            <p className="text-[10px] font-bold uppercase tracking-widest text-gray-400">New Headline</p>
            <CopyButton text={result.headline} />
          </div>
          <p className="text-sm font-semibold text-gray-800">{result.headline}</p>
        </div>
      )}
      {result.about && (
        <div className="bg-white border border-gray-200 rounded-xl p-4 shadow-sm">
          <div className="flex items-center justify-between mb-2">
            <p className="text-[10px] font-bold uppercase tracking-widest text-gray-400">About Section</p>
            <CopyButton text={result.about} />
          </div>
          <p className="text-sm text-gray-700 leading-relaxed whitespace-pre-wrap">{result.about}</p>
        </div>
      )}
      {result.top_keywords?.length > 0 && (
        <div className="bg-white border border-gray-200 rounded-xl p-4 shadow-sm">
          <p className="text-[10px] font-bold uppercase tracking-widest text-gray-400 mb-2">Top Keywords</p>
          <div className="flex flex-wrap gap-1.5">
            {result.top_keywords.map((k, i) => (
              <span key={i} className="text-xs px-2.5 py-1 bg-violet-50 text-violet-700 border border-violet-100 rounded-full">{k}</span>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}

function SalaryResult({ result }) {
  const fmt = (n) => n ? (n >= 100000 ? `₹${(n / 100000).toFixed(1)}L` : `$${(n / 1000).toFixed(0)}K`) : '—'
  const verdictCls = { 'Below Market': 'text-red-700 bg-red-50 border-red-200', 'At Market': 'text-yellow-700 bg-yellow-50 border-yellow-200', 'Above Market': 'text-green-700 bg-green-50 border-green-200' }[result.verdict] || 'text-gray-700 bg-gray-50 border-gray-200'
  const range = result.market_range || {}
  return (
    <div className="mt-1 space-y-3">
      <div className="bg-white border border-gray-200 rounded-2xl p-4 shadow-sm">
        <div className="flex justify-between text-xs text-gray-500 mb-1">
          <span>{fmt(range.low)}</span><span className="font-semibold text-gray-800">{fmt(range.mid)} mid</span><span>{fmt(range.high)}</span>
        </div>
        <div className="h-2 bg-gray-100 rounded-full overflow-hidden mb-3">
          <div className="h-full bg-gradient-to-r from-red-400 via-yellow-400 to-green-500 rounded-full" style={{ width: '100%' }} />
        </div>
        <div className="flex items-center justify-between">
          <div>
            <div className="text-xs text-gray-400 mb-0.5">Your offer</div>
            <div className="text-xl font-bold text-gray-900">{fmt(result.offer_amount)}</div>
          </div>
          <span className={`text-sm font-semibold px-3 py-1 rounded-full border ${verdictCls}`}>{result.verdict}</span>
        </div>
        {result.recommended_counter && (
          <div className="mt-3 pt-3 border-t border-gray-100">
            <span className="text-xs text-gray-400">Recommended counter: </span>
            <span className="text-sm font-bold text-green-700">{fmt(result.recommended_counter)}</span>
          </div>
        )}
      </div>
      {result.negotiation_script && (
        <div className="bg-white border border-gray-200 rounded-xl p-4 shadow-sm">
          <div className="flex items-center justify-between mb-2">
            <p className="text-[10px] font-bold uppercase tracking-widest text-gray-400">Script</p>
            <CopyButton text={result.negotiation_script} />
          </div>
          <p className="text-sm text-gray-700 leading-relaxed italic">"{result.negotiation_script}"</p>
        </div>
      )}
      <div className="grid grid-cols-2 gap-2">
        {result.talking_points?.length > 0 && (
          <div className="bg-white border border-gray-200 rounded-xl p-3 shadow-sm">
            <p className="text-[10px] font-bold uppercase tracking-widest text-gray-400 mb-2">Talking Points</p>
            {result.talking_points.map((t, i) => <p key={i} className="text-xs text-gray-700 mb-1">• {t}</p>)}
          </div>
        )}
        {result.benefits_to_negotiate?.length > 0 && (
          <div className="bg-white border border-gray-200 rounded-xl p-3 shadow-sm">
            <p className="text-[10px] font-bold uppercase tracking-widest text-gray-400 mb-2">Also Negotiate</p>
            {result.benefits_to_negotiate.map((b, i) => <p key={i} className="text-xs text-gray-700 mb-1">• {b}</p>)}
          </div>
        )}
      </div>
      {result.advice && (
        <div className="bg-orange-50 border border-orange-100 rounded-xl p-3">
          <p className="text-xs text-orange-800 leading-relaxed">{result.advice}</p>
        </div>
      )}
    </div>
  )
}

function RoastResult({ result }) {
  return (
    <div className="mt-1 space-y-3">
      {result.score != null && (
        <div className="bg-white border border-gray-200 rounded-2xl p-4 shadow-sm flex items-center gap-4">
          <div className="text-4xl font-bold text-gray-900 leading-none">{result.score}</div>
          <div>
            <div className="text-xs text-gray-400 mb-1.5">out of 100</div>
            <div className="w-32 h-2 bg-gray-100 rounded-full overflow-hidden">
              <div className={`h-full rounded-full ${result.score >= 70 ? 'bg-green-500' : result.score >= 50 ? 'bg-yellow-400' : 'bg-red-500'}`} style={{ width: `${result.score}%` }} />
            </div>
          </div>
        </div>
      )}
      <div className="bg-white border border-gray-200 rounded-xl p-4 shadow-sm">
        <p className="text-[10px] font-bold uppercase tracking-widest text-gray-400 mb-2">Roast</p>
        <p className="text-sm text-gray-700 leading-relaxed whitespace-pre-wrap">{result.roast_output}</p>
      </div>
      {result.fix_output && (
        <div className="bg-white border border-gray-200 rounded-xl p-4 shadow-sm">
          <p className="text-[10px] font-bold uppercase tracking-widest text-gray-400 mb-2">How to fix it</p>
          <p className="text-sm text-gray-700 leading-relaxed whitespace-pre-wrap">{result.fix_output}</p>
        </div>
      )}
    </div>
  )
}

// ── Tool header with back navigation ─────────────────────────────────────────

function ToolHeader({ tool, onBack }) {
  const meta = TOOL_META[tool] || { name: tool, category: '', dot: 'bg-gray-400' }
  return (
    <div className="flex items-center gap-3 px-6 h-11 border-b border-gray-200 bg-white flex-shrink-0">
      <button onClick={onBack}
        className="flex items-center gap-1.5 text-gray-400 hover:text-gray-700 transition-colors">
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
          <line x1="19" y1="12" x2="5" y2="12"/><polyline points="12 19 5 12 12 5"/>
        </svg>
        <span className="text-[12px] font-medium">All Tools</span>
      </button>
      <span className="text-gray-300 text-sm">/</span>
      <span className="text-[13px] font-semibold text-gray-900">{meta.name}</span>
      <span className="ml-auto text-[11px] font-medium text-gray-400">{meta.category}</span>
    </div>
  )
}

// ── Main ToolChat ─────────────────────────────────────────────────────────────

export default function ToolChat({ tool, onRestart }) {
  const { user, openAuthModal, openUpgradeModal, refreshUser } = useAuth()

  // Initialize messages directly — avoids double-fire in React StrictMode
  const [msgs,        setMsgs]        = useState(() => [{ type: 'ai', id: 'init', ...(GREETINGS[tool] || { text: 'How can I help?' }) }])
  const [step,        setStep]        = useState(() => INITIAL_STEPS[tool] || 'init')
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

  const stopPoll = () => { if (pollRef.current) { clearInterval(pollRef.current); pollRef.current = null } }

  const pushAI   = useCallback((msg) => setMsgs(p => [...p, { type: 'ai',  id: Date.now() + Math.random(), ...msg }]), [])
  const pushUser = useCallback((t)   => setMsgs(p => [...p, { type: 'user', id: Date.now() + Math.random(), text: t }]), [])
  const markChosen = (msgId, val) => setMsgs(p => p.map(m => m.id === msgId ? { ...m, chosen: val } : m))

  useEffect(() => { bottomRef.current?.scrollIntoView({ behavior: 'smooth' }) }, [msgs, isLoading])
  useEffect(() => { if (!isLoading) inputRef.current?.focus() }, [step, isLoading])

  // Poll helper
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

  // ── Choice handler ──────────────────────────────────────────────────────────

  const onChoice = (value, label, msgId) => {
    markChosen(msgId, value)
    pushUser(label)
    if (tool === 'roast') {
      if (step === 'work_type') {
        setCollected(c => ({ ...c, workType: value }))
        pushAI({ text: 'How brutal should I be?', choices: INTENSITIES })
        setStep('intensity')
      } else if (step === 'intensity') {
        setCollected(c => ({ ...c, intensity: value }))
        pushAI({ text: 'Paste your content below, or switch to upload a file:' })
        setStep('content')
      }
    } else if (tool === 'interview') {
      if (step === 'company_type') {
        setCollected(c => ({ ...c, companyType: value }))
        pushAI({ text: 'What type of interview round?', choices: ROUND_TYPES })
        setStep('round_type')
      } else if (step === 'round_type') {
        setCollected(c => ({ ...c, roundType: value }))
        doInterviewStart({ ...collected, roundType: value })
      }
    } else if (tool === 'linkedin_dm' && step === 'purpose') {
      setCollected(c => ({ ...c, purpose: value }))
      pushAI({ text: 'Your background in 1–2 lines — role, experience, what you bring:' })
      setStep('background')
    }
  }

  // ── Text submit handler ─────────────────────────────────────────────────────

  const onText = () => {
    const t = text.trim()
    if (!t) return
    setText('')
    if (tool === 'build_resume') {
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
        pushUser(t)
        doBuildResume({ ...collected, contact: t })
      }
    } else if (tool === 'interview') {
      if (step === 'role') {
        pushUser(t); setCollected(c => ({ ...c, role: t }))
        pushAI({ text: 'What type of company?', choices: COMPANY_TYPES })
        setStep('company_type')
      } else if (step === 'interview_answer') {
        submitAnswer(t)
      }
    } else if (tool === 'jd_match') {
      if (step === 'resume_text') {
        pushUser(t.length > 100 ? t.slice(0, 100) + '…' : t)
        setCollected(c => ({ ...c, resumeText: t }))
        pushAI({ text: "Now paste the job description:" })
        setStep('jd_text')
      } else if (step === 'jd_text') {
        pushUser(t.length > 100 ? t.slice(0, 100) + '…' : t)
        doJDMatch({ ...collected, jdText: t })
      }
    } else if (tool === 'linkedin_dm') {
      if (step === 'target') {
        pushUser(t); setCollected(c => ({ ...c, targetInfo: t }))
        pushAI({ text: "What's the purpose of reaching out?", choices: DM_PURPOSES })
        setStep('purpose')
      } else if (step === 'background') {
        pushUser(t)
        doLinkedInDM({ ...collected, background: t })
      }
    } else if (tool === 'linkedin_opt') {
      if (step === 'profile') {
        pushUser(t.length > 100 ? t.slice(0, 100) + '…' : t)
        setCollected(c => ({ ...c, profile: t }))
        pushAI({ text: "What role are you targeting? (or type 'keep current direction')" })
        setStep('target_role')
      } else if (step === 'target_role') {
        pushUser(t)
        doLinkedInOpt({ ...collected, targetRole: t })
      }
    } else if (tool === 'salary') {
      if (step === 'offer') {
        pushUser(t); setCollected(c => ({ ...c, offer: t }))
        pushAI({ text: "Your background: experience level, years in field, current/previous salary." })
        setStep('experience')
      } else if (step === 'experience') {
        pushUser(t); setCollected(c => ({ ...c, experience: t }))
        pushAI({ text: "Your situation: employed or looking, any competing offers or deadline pressure?" })
        setStep('situation')
      } else if (step === 'situation') {
        pushUser(t)
        doSalary({ ...collected, situation: t })
      }
    }
  }

  // ── API flows ───────────────────────────────────────────────────────────────

  const doBuildResume = (snap) => {
    if (!user) { openAuthModal(() => doBuildResume(snap)); return }
    setIsLoading(true); setStep('loading')
    pushAI({ text: 'Building your resume… usually 15–30 seconds.' })
    const go = async () => {
      try {
        const raw = [snap.contact, snap.experience, snap.education && `Education: ${snap.education}`, snap.skills && `Skills: ${snap.skills}`].filter(Boolean).join('\n\n')
        const { data } = await resumeApi.generate({ target_role: snap.role || 'Professional', raw_input: raw })
        startPoll(
          () => resumeApi.get(data.id),
          (r) => { setResumeData(r.resume_data); setIsLoading(false); setStep('done'); pushAI({ kind: 'resume', text: "Here's your resume! Click Customise to change fonts, colors and layout." }); refreshUser() },
          (msg) => { setIsLoading(false); setStep('role'); pushAI({ text: msg }) }
        )
      } catch (err) {
        setIsLoading(false); setStep('role')
        if (err.response?.status === 402) openUpgradeModal()
        else pushAI({ text: 'Something went wrong. Please try again.' })
      }
    }
    go()
  }

  const doFix = (file) => {
    if (!user) { openAuthModal(() => doFix(file)); return }
    setIsLoading(true); setStep('loading')
    pushAI({ text: 'Analyzing and rewriting your resume… 20–40 seconds.' })
    const go = async () => {
      try {
        const fd = new FormData(); fd.append('file', file)
        const { data } = await updaterApi.submit(fd)
        startPoll(
          () => updaterApi.get(data.id),
          (r) => { setResumeData(r.resume_data); setIsLoading(false); setStep('done'); pushAI({ kind: 'resume_fix', text: "Here's your improved resume!", issues: r.issues }); refreshUser() },
          (msg) => { setIsLoading(false); setStep('upload'); pushAI({ text: msg }) }
        )
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
    pushUser(preview)
    setIsLoading(true); setStep('loading')
    pushAI({ text: 'Roasting… 20–40 seconds.' })
    const go = async () => {
      try {
        const fd = new FormData()
        fd.append('work_type', collected.workType || 'resume')
        fd.append('intensity', collected.intensity || 'honest')
        if (hasFile) fd.append('file', roastFile)
        else fd.append('input_text', roastText.trim())
        const { data } = await roastApi.submit(fd)
        refreshUser()
        startPoll(
          () => roastApi.get(data.id),
          (r) => { setResult(r); setIsLoading(false); setStep('done'); pushAI({ kind: 'roast', text: "Here's your roast!", result: r }) },
          (msg) => { setIsLoading(false); setStep('content'); pushAI({ text: msg }) }
        )
      } catch (err) {
        setIsLoading(false); setStep('content')
        if (err.response?.status === 402) openUpgradeModal()
        else pushAI({ text: 'Something went wrong. Please try again.' })
      }
    }
    go()
  }

  const doInterviewStart = (snap) => {
    if (!user) { openAuthModal(() => doInterviewStart(snap)); return }
    setIsLoading(true); setStep('loading')
    pushAI({ text: `Preparing your ${snap.roundType} interview for ${snap.role} at ${snap.companyType}… generating questions.` })
    const go = async () => {
      try {
        const { data } = await toolsApi.interview.create({ role: snap.role, company_type: snap.companyType, round_type: snap.roundType })
        setSessionId(data.id)
        startPoll(
          () => toolsApi.interview.get(data.id),
          (r) => {
            if (r.questions?.length > 0) {
              setQuestions(r.questions); setQIdx(0); setAnswers([])
              setIsLoading(false); setStep('interview_answer')
              pushAI({ text: `Question 1 of ${r.questions.length}:\n\n${r.questions[0]}` })
            }
          },
          (msg) => { setIsLoading(false); setStep('role'); pushAI({ text: msg }) }
        )
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
    const newAnswers = [...answers, ans]
    setAnswers(newAnswers)
    if (newAnswers.length < questions.length) {
      const next = qIdx + 1
      setQIdx(next)
      pushAI({ text: `Question ${next + 1} of ${questions.length}:\n\n${questions[next]}` })
    } else {
      setIsLoading(true); setStep('loading')
      pushAI({ text: "All answers in. Evaluating your performance…" })
      const go = async () => {
        try {
          await toolsApi.interview.evaluate(sessionId, { answers: newAnswers })
          startPoll(
            () => toolsApi.interview.get(sessionId),
            (r) => { setResult(r.result); setIsLoading(false); setStep('done'); pushAI({ kind: 'interview', text: "Here's your interview feedback!" }) },
            (msg) => { setIsLoading(false); pushAI({ text: msg }) }
          )
        } catch { setIsLoading(false); pushAI({ text: 'Something went wrong with evaluation.' }) }
      }
      go()
    }
  }

  const doJDMatch = (snap) => {
    if (!user) { openAuthModal(() => doJDMatch(snap)); return }
    setIsLoading(true); setStep('loading')
    pushAI({ text: 'Comparing your resume against the job description… 15–25 seconds.' })
    const go = async () => {
      try {
        const { data } = await toolsApi.jdMatch.submit({ resume_text: snap.resumeText, jd_text: snap.jdText })
        startPoll(
          () => toolsApi.jdMatch.get(data.id),
          (r) => { setResult(r.result); setIsLoading(false); setStep('done'); pushAI({ kind: 'jd_match', text: "Here's your match analysis!", result: r.result }); refreshUser() },
          (msg) => { setIsLoading(false); setStep('resume_text'); pushAI({ text: msg }) }
        )
      } catch (err) {
        setIsLoading(false); setStep('resume_text')
        if (err.response?.status === 402) openUpgradeModal()
        else pushAI({ text: 'Something went wrong. Please try again.' })
      }
    }
    go()
  }

  const doLinkedInDM = (snap) => {
    if (!user) { openAuthModal(() => doLinkedInDM(snap)); return }
    setIsLoading(true); setStep('loading')
    pushAI({ text: 'Crafting your outreach messages… a few seconds.' })
    const go = async () => {
      try {
        const { data } = await toolsApi.linkedinDm.submit({ target_info: snap.targetInfo, purpose: snap.purpose, user_background: snap.background })
        startPoll(
          () => toolsApi.linkedinDm.get(data.id),
          (r) => { setResult(r.result); setIsLoading(false); setStep('done'); pushAI({ kind: 'linkedin_dm', text: "Here are your outreach messages!", result: r.result }); refreshUser() },
          (msg) => { setIsLoading(false); setStep('target'); pushAI({ text: msg }) }
        )
      } catch (err) {
        setIsLoading(false); setStep('target')
        if (err.response?.status === 402) openUpgradeModal()
        else pushAI({ text: 'Something went wrong. Please try again.' })
      }
    }
    go()
  }

  const doLinkedInOpt = (snap) => {
    if (!user) { openAuthModal(() => doLinkedInOpt(snap)); return }
    setIsLoading(true); setStep('loading')
    pushAI({ text: 'Optimizing your LinkedIn profile… a few seconds.' })
    const go = async () => {
      try {
        const { data } = await toolsApi.linkedinOpt.submit({ current_profile: snap.profile, target_role: snap.targetRole || '' })
        startPoll(
          () => toolsApi.linkedinOpt.get(data.id),
          (r) => { setResult(r.result); setIsLoading(false); setStep('done'); pushAI({ kind: 'linkedin_opt', text: "Here's your optimized profile!", result: r.result }); refreshUser() },
          (msg) => { setIsLoading(false); setStep('profile'); pushAI({ text: msg }) }
        )
      } catch (err) {
        setIsLoading(false); setStep('profile')
        if (err.response?.status === 402) openUpgradeModal()
        else pushAI({ text: 'Something went wrong. Please try again.' })
      }
    }
    go()
  }

  const doSalary = (snap) => {
    if (!user) { openAuthModal(() => doSalary(snap)); return }
    setIsLoading(true); setStep('loading')
    pushAI({ text: 'Analyzing your offer against market data…' })
    const go = async () => {
      try {
        const { data } = await toolsApi.salary.submit({ offer_details: snap.offer, experience_info: snap.experience, situation: snap.situation || '' })
        startPoll(
          () => toolsApi.salary.get(data.id),
          (r) => { setResult(r.result); setIsLoading(false); setStep('done'); pushAI({ kind: 'salary', text: "Here's your salary analysis!", result: r.result }); refreshUser() },
          (msg) => { setIsLoading(false); setStep('offer'); pushAI({ text: msg }) }
        )
      } catch (err) {
        setIsLoading(false); setStep('offer')
        if (err.response?.status === 402) openUpgradeModal()
        else pushAI({ text: 'Something went wrong. Please try again.' })
      }
    }
    go()
  }

  // ── Derived ─────────────────────────────────────────────────────────────────

  const isMultiline = ['exp', 'edu', 'skills', 'resume_text', 'jd_text', 'profile', 'offer', 'experience', 'situation'].includes(step)
  const isTextStep  = ['role', 'exp', 'edu', 'skills', 'contact', 'resume_text', 'jd_text', 'target', 'background', 'target_role', 'offer', 'experience', 'situation', 'interview_answer'].includes(step)

  const placeholder = {
    role:             'e.g. Senior Product Manager',
    exp:              'Companies, roles, achievements with dates…',
    edu:              'Degree, school, year — or skip',
    skills:           'Python, React, SQL… — or skip',
    contact:          'John Doe, john@email.com, +1-555-0123, New York',
    resume_text:      'Paste your full resume text here…',
    jd_text:          'Paste the full job description here…',
    target:           'e.g. Priya Sharma, Engineering Manager at Swiggy',
    background:       'e.g. 4 years in backend engineering at a fintech startup',
    target_role:      "e.g. Senior SWE at FAANG, or 'keep current direction'",
    profile:          'Paste your LinkedIn headline and About section here…',
    offer:            'e.g. Software Engineer at Zepto, ₹22 LPA base, ₹3L joining bonus, Bangalore',
    experience:       'e.g. 4 years exp, currently at ₹16 LPA, 2 promotions',
    situation:        'e.g. currently employed, no competing offers, decision needed in 1 week',
    interview_answer: questions[qIdx] ? `Answer: "${questions[qIdx].slice(0, 55)}…"` : 'Your answer…',
  }[step] || 'Type your answer…'

  // ── Render ──────────────────────────────────────────────────────────────────

  return (
    <div className="flex flex-col h-full bg-gray-50">
      <ToolHeader tool={tool} onBack={onRestart} />

      {/* Messages */}
      <div className="flex-1 overflow-y-auto">
        <div className="px-6 py-6 space-y-5 max-w-3xl">
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
                    {msg.kind === 'jd_match'     && msg.result && <JDMatchResult result={msg.result} />}
                    {msg.kind === 'roast'         && msg.result && <RoastResult result={msg.result} />}
                    {msg.kind === 'interview'     && result     && <InterviewResult result={result} />}
                    {msg.kind === 'linkedin_dm'   && msg.result && <LinkedInDMResult result={msg.result} />}
                    {msg.kind === 'linkedin_opt'  && msg.result && <LinkedInOptResult result={msg.result} />}
                    {msg.kind === 'salary'        && msg.result && <SalaryResult result={msg.result} />}
                  </AIBubble>
              }
            </div>
          ))}
          {isLoading && <TypingDots />}
          <div ref={bottomRef} />
        </div>
      </div>

      {/* Full-screen resume customiser */}
      {previewOpen && resumeData && (
        <div className="fixed inset-0 z-50 flex">
          <div className="flex-1 bg-gray-100 overflow-y-auto">
            <div className="max-w-3xl mx-auto px-6 py-8">
              <div className="flex items-center gap-3 mb-6 print:hidden">
                <button onClick={() => setPreviewOpen(false)}
                  className="flex items-center gap-1.5 text-sm text-gray-600 hover:text-gray-900 border border-gray-200 bg-white rounded-xl px-3 py-2 transition-colors">
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><line x1="19" y1="12" x2="5" y2="12"/><polyline points="12 19 5 12 12 5"/></svg>
                  Back
                </button>
                <button onClick={() => window.print()}
                  className="flex items-center gap-2 text-sm text-white bg-orange-500 hover:bg-orange-600 rounded-xl px-4 py-2 transition-colors">
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

      {/* Input area */}
      <div className="border-t border-gray-200 bg-white px-6 py-3.5 flex-shrink-0">
        <div className="max-w-3xl">

          {/* Text input */}
          {isTextStep && !isLoading && (
            <div className="flex gap-2 items-end">
              {isMultiline
                ? <textarea ref={inputRef} value={text} onChange={e => setText(e.target.value)}
                    onKeyDown={e => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); onText() } }}
                    placeholder={placeholder} rows={3}
                    className="flex-1 input-base resize-none text-sm leading-relaxed" />
                : <input ref={inputRef} value={text} onChange={e => setText(e.target.value)}
                    onKeyDown={e => e.key === 'Enter' && onText()}
                    placeholder={placeholder} className="flex-1 input-base text-sm" />
              }
              <button onClick={onText} disabled={!text.trim()}
                className="w-9 h-9 rounded-xl bg-orange-500 hover:bg-orange-600 disabled:bg-gray-100 disabled:text-gray-300 flex items-center justify-center transition-colors flex-shrink-0">
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5"><line x1="5" y1="12" x2="19" y2="12"/><polyline points="12 5 19 12 12 19"/></svg>
              </button>
            </div>
          )}

          {/* Fix resume: upload zone */}
          {tool === 'fix_resume' && step === 'upload' && !isLoading && (
            <>
              <input ref={fixFileRef} type="file" accept=".txt,.pdf,.md" className="hidden"
                onChange={e => { if (e.target.files[0]) { const f = e.target.files[0]; pushUser(`Uploaded: ${f.name}`); doFix(f) } }} />
              <button onClick={() => fixFileRef.current?.click()}
                className="w-full rounded-xl border-2 border-dashed border-gray-200 hover:border-orange-400 bg-gray-50/50 hover:bg-orange-50/50 py-8 text-center transition-all">
                <div className="w-10 h-10 mx-auto mb-3 rounded-xl bg-white border border-gray-200 flex items-center justify-center shadow-sm">
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#9ca3af" strokeWidth="1.5"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="17 8 12 3 7 8"/><line x1="12" y1="3" x2="12" y2="15"/></svg>
                </div>
                <p className="text-sm font-medium text-gray-700">Click to upload your resume</p>
                <p className="text-xs text-gray-400 mt-1">.pdf · .txt · .md — max 10 MB</p>
              </button>
            </>
          )}

          {/* Roast: paste or upload */}
          {tool === 'roast' && step === 'content' && !isLoading && (
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-xs font-medium text-gray-400">Your content</span>
                <div className="flex border border-gray-200 rounded-lg overflow-hidden text-xs">
                  {['text', 'file'].map(m => (
                    <button key={m} onClick={() => setRoastMode(m)}
                      className={`px-3 py-1.5 font-medium transition-colors ${roastMode === m ? 'bg-gray-900 text-white' : 'bg-white text-gray-500 hover:text-gray-800'}`}>
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
                      className="w-9 h-9 rounded-xl bg-orange-500 hover:bg-orange-600 disabled:bg-gray-100 flex items-center justify-center flex-shrink-0 transition-colors">
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5"><line x1="5" y1="12" x2="19" y2="12"/><polyline points="12 5 19 12 12 19"/></svg>
                    </button>
                  </div>
                : <div className="flex gap-2 items-center">
                    <input ref={roastFileRef} type="file" accept=".txt,.pdf,.md,.py,.js,.ts,.jsx,.tsx,.java,.go,.rs,.cpp,.c" className="hidden"
                      onChange={e => e.target.files[0] && setRoastFile(e.target.files[0])} />
                    <div onClick={() => roastFileRef.current?.click()}
                      className={`flex-1 rounded-xl border-2 border-dashed py-5 text-center cursor-pointer transition-all ${roastFile ? 'border-orange-300 bg-orange-50/50' : 'border-gray-200 bg-gray-50 hover:border-gray-300'}`}>
                      {roastFile
                        ? <p className="text-sm text-orange-700 font-medium">{roastFile.name} · Click to change</p>
                        : <><p className="text-sm font-medium text-gray-700">Click to upload</p><p className="text-xs text-gray-400 mt-0.5">.pdf .txt .py .js and more</p></>}
                    </div>
                    <button onClick={doRoast} disabled={!roastFile}
                      className="w-9 h-9 rounded-xl bg-orange-500 hover:bg-orange-600 disabled:bg-gray-100 flex items-center justify-center flex-shrink-0 transition-colors">
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5"><line x1="5" y1="12" x2="19" y2="12"/><polyline points="12 5 19 12 12 19"/></svg>
                    </button>
                  </div>
              }
            </div>
          )}

          {/* Choice hint */}
          {['work_type', 'intensity', 'company_type', 'round_type', 'purpose'].includes(step) && !isLoading && (
            <p className="text-center text-xs text-gray-400 py-1">Choose an option above to continue</p>
          )}

          {/* Done state */}
          {step === 'done' && (
            <button onClick={onRestart}
              className="w-full flex items-center justify-center gap-2 text-sm text-gray-600 hover:text-gray-900 border border-gray-200 bg-white hover:bg-gray-50 rounded-xl py-2.5 transition-colors">
              <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="1 4 1 10 7 10"/><path d="M3.51 15a9 9 0 1 0 .49-3.5"/></svg>
              Start a new conversation
            </button>
          )}

          {isLoading && (
            <p className="text-center text-xs text-gray-400 py-1">Processing… please wait</p>
          )}
        </div>
      </div>
    </div>
  )
}
