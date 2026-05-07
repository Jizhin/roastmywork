import { useState, useRef, useEffect } from 'react'
import { resumeApi, updaterApi, roastApi } from '../api/client'
import { useAuth } from '../context/AuthContext'
import ResumeRenderer, { DEFAULT_STYLE } from '../components/ResumeRenderer'
import StylePanel from '../components/StylePanel'

// ─── Conversation steps ────────────────────────────────────────────────────
const S = {
  WELCOME:       'welcome',
  BUILD_ROLE:    'build_role',
  BUILD_EXP:     'build_exp',
  BUILD_EDU:     'build_edu',
  BUILD_SKILLS:  'build_skills',
  BUILD_CONTACT: 'build_contact',
  BUILD_LOADING: 'build_loading',
  BUILD_DONE:    'build_done',
  FIX_UPLOAD:    'fix_upload',
  FIX_LOADING:   'fix_loading',
  FIX_DONE:      'fix_done',
  ROAST_TYPE:      'roast_type',
  ROAST_INTENSITY: 'roast_intensity',
  ROAST_CONTENT:   'roast_content',
  ROAST_LOADING:   'roast_loading',
  ROAST_DONE:      'roast_done',
}

const WORK_TYPES = [
  { value: 'resume',     label: 'Resume / CV' },
  { value: 'code',       label: 'Code'        },
  { value: 'pitch_deck', label: 'Pitch Deck'  },
  { value: 'linkedin',   label: 'LinkedIn'    },
  { value: 'essay',      label: 'Essay'       },
]

const INTENSITIES = [
  { value: 'gentle',        label: 'Gentle',       sub: 'Constructive and kind' },
  { value: 'honest',        label: 'Honest',       sub: 'Direct and clear'      },
  { value: 'gordon_ramsay', label: 'Gordon Ramsay', sub: 'Brutal and passionate' },
  { value: 'simon_cowell',  label: 'Simon Cowell',  sub: 'Cold and blunt'       },
]

const POLL_MS  = 2000
const MAX_POLL = 90

const INITIAL_MSG = {
  type: 'ai',
  id: 'init',
  text: "Hi! I'm your AI career assistant. What would you like to do today?",
  choices: [
    { value: 'build', label: 'Build a Resume' },
    { value: 'fix',   label: 'Fix My Resume'  },
    { value: 'roast', label: 'Roast My Work'  },
  ],
}

// ─── Avatar ────────────────────────────────────────────────────────────────
function AIAvatar() {
  return (
    <div className="w-9 h-9 rounded-full bg-orange-500 flex items-center justify-center flex-shrink-0">
      <svg width="16" height="16" viewBox="0 0 24 24" fill="white">
        <path d="M12 3C9.5 7.5 8 10.5 8 14a4 4 0 0 0 8 0c0-3.5-1.5-6.5-4-11Z" />
        <path d="M12 12c-.8 1.8-1.2 3-1.2 4a1.2 1.2 0 0 0 2.4 0c0-1-.4-2.2-1.2-4Z" fillOpacity="0.45" />
      </svg>
    </div>
  )
}

// ─── Typing dots ───────────────────────────────────────────────────────────
function TypingDots() {
  return (
    <div className="flex gap-3">
      <AIAvatar />
      <div className="bg-white border border-gray-200 rounded-2xl rounded-tl-sm px-5 py-4 shadow-sm">
        <div className="flex gap-1.5 items-center h-4">
          {[0, 150, 300].map(delay => (
            <span key={delay} className="w-2 h-2 bg-orange-400 rounded-full animate-bounce"
              style={{ animationDelay: `${delay}ms` }} />
          ))}
        </div>
      </div>
    </div>
  )
}

// ─── Inline resume thumbnail ───────────────────────────────────────────────
function InlineResume({ resumeData, styleConfig, onRestart, onViewFull }) {
  return (
    <div className="mt-3 print:hidden">
      <div className="flex flex-wrap items-center gap-2 mb-3">
        <button onClick={onViewFull} className="btn-primary py-1.5 px-3 text-xs gap-1.5">
          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <polyline points="15 3 21 3 21 9" /><polyline points="9 21 3 21 3 15" />
            <line x1="21" y1="3" x2="14" y2="10" /><line x1="3" y1="21" x2="10" y2="14" />
          </svg>
          Customise &amp; Preview
        </button>
        <button onClick={onRestart} className="btn-secondary py-1.5 px-3 text-xs">
          Start over
        </button>
      </div>
      {/* Scaled thumbnail */}
      <div className="rounded-xl overflow-hidden border border-gray-200 shadow-sm"
        style={{ height: 270 }}>
        <div style={{ width: 816, transformOrigin: 'top left', transform: 'scale(0.7)' }}>
          <ResumeRenderer data={resumeData} style={styleConfig} />
        </div>
      </div>
    </div>
  )
}

// ─── Inline roast result ───────────────────────────────────────────────────
function InlineRoast({ result, onRestart }) {
  return (
    <div className="mt-3 space-y-3">
      {result.score != null && (
        <div className="bg-white border border-gray-200 rounded-xl px-5 py-4 shadow-sm flex items-center gap-4">
          <div className="text-5xl font-extrabold text-gray-900 leading-none">{result.score}</div>
          <div>
            <div className="text-xs text-gray-400 mb-1.5">out of 100</div>
            <div className="w-36 h-2 bg-gray-100 rounded-full overflow-hidden">
              <div
                className={`h-full rounded-full ${result.score >= 70 ? 'bg-green-500' : result.score >= 50 ? 'bg-yellow-400' : 'bg-red-500'}`}
                style={{ width: `${result.score}%` }}
              />
            </div>
          </div>
        </div>
      )}
      <div className="bg-white border border-gray-200 rounded-xl px-5 py-4 shadow-sm">
        <p className="text-[10px] font-bold uppercase tracking-widest text-gray-400 mb-3">Roast</p>
        <p className="text-gray-700 text-sm leading-relaxed whitespace-pre-wrap">{result.roast_output}</p>
      </div>
      {result.fix_output && (
        <div className="bg-white border border-gray-200 rounded-xl px-5 py-4 shadow-sm">
          <p className="text-[10px] font-bold uppercase tracking-widest text-gray-400 mb-3">How to fix it</p>
          <p className="text-gray-700 text-sm leading-relaxed whitespace-pre-wrap">{result.fix_output}</p>
        </div>
      )}
      <button onClick={onRestart} className="btn-secondary py-2 px-4 text-sm">Start over</button>
    </div>
  )
}

// ─── Main component ────────────────────────────────────────────────────────
export default function Home() {
  const { user, openAuthModal, openUpgradeModal, refreshUser } = useAuth()

  const [messages,    setMessages]    = useState([INITIAL_MSG])
  const [step,        setStep]        = useState(S.WELCOME)
  const [text,        setText]        = useState('')
  const [collected,   setCollected]   = useState({})
  const [resumeData,  setResumeData]  = useState(null)
  const [roastResult, setRoastResult] = useState(null)
  const [styleConfig, setStyleConfig] = useState(DEFAULT_STYLE)
  const [previewOpen, setPreviewOpen] = useState(false)
  const [roastText,   setRoastText]   = useState('')
  const [roastFile,   setRoastFile]   = useState(null)
  const [roastMode,   setRoastMode]   = useState('text')
  const [fixFile,     setFixFile]     = useState(null)

  const inputRef     = useRef()
  const bottomRef    = useRef()
  const fixFileRef   = useRef()
  const roastFileRef = useRef()
  const pollRef      = useRef(null)

  useEffect(() => { bottomRef.current?.scrollIntoView({ behavior: 'smooth' }) }, [messages])
  useEffect(() => { inputRef.current?.focus() }, [step])

  const stopPoll = () => { if (pollRef.current) { clearInterval(pollRef.current); pollRef.current = null } }

  const pushAI  = msg => setMessages(p => [...p, { type: 'ai', id: Date.now() + Math.random(), ...msg }])
  const pushUser = t  => setMessages(p => [...p, { type: 'user', id: Date.now() + Math.random(), text: t }])
  const markChosen = (msgId, value) =>
    setMessages(p => p.map(m => m.id === msgId ? { ...m, chosen: value } : m))

  const restart = () => {
    stopPoll()
    setMessages([INITIAL_MSG])
    setStep(S.WELCOME)
    setText('')
    setCollected({})
    setResumeData(null)
    setRoastResult(null)
    setStyleConfig(DEFAULT_STYLE)
    setRoastText('')
    setRoastFile(null)
    setFixFile(null)
    setPreviewOpen(false)
  }

  // ── CHOICE handler ─────────────────────────────────────────────────────────
  const onChoice = (value, msgId) => {
    markChosen(msgId, value)

    if (step === S.WELCOME) {
      if (value === 'build') {
        pushUser('Build a Resume')
        pushAI({ text: "Great! Let's build your resume. What role are you targeting?" })
        setStep(S.BUILD_ROLE)
      } else if (value === 'fix') {
        pushUser('Fix My Resume')
        pushAI({ text: "Upload your resume and I'll rewrite every weak bullet, fix ATS issues, and deliver a clean improved version — all your original content preserved." })
        setStep(S.FIX_UPLOAD)
      } else if (value === 'roast') {
        pushUser('Roast My Work')
        pushAI({ text: "What are we roasting?", choices: WORK_TYPES })
        setStep(S.ROAST_TYPE)
      }
    } else if (step === S.ROAST_TYPE) {
      const label = WORK_TYPES.find(w => w.value === value)?.label || value
      pushUser(label)
      setCollected(c => ({ ...c, workType: value }))
      pushAI({ text: "How brutal should I be?", choices: INTENSITIES })
      setStep(S.ROAST_INTENSITY)
    } else if (step === S.ROAST_INTENSITY) {
      const label = INTENSITIES.find(i => i.value === value)?.label || value
      pushUser(label)
      setCollected(c => ({ ...c, intensity: value }))
      pushAI({ text: "Paste your content below, or switch to upload a file:" })
      setStep(S.ROAST_CONTENT)
    }
  }

  // ── TEXT handler ───────────────────────────────────────────────────────────
  const onText = () => {
    const t = text.trim()
    if (!t) return
    setText('')

    if (step === S.BUILD_ROLE) {
      pushUser(t)
      setCollected(c => ({ ...c, role: t }))
      pushAI({ text: "Tell me about your work experience — companies, roles, what you built or achieved. Include dates. Don't worry about formatting." })
      setStep(S.BUILD_EXP)
    } else if (step === S.BUILD_EXP) {
      pushUser(t.length > 120 ? t.slice(0, 120) + '…' : t)
      setCollected(c => ({ ...c, experience: t }))
      pushAI({ text: "Any education to include? Degree, school, graduation year, GPA — or type skip." })
      setStep(S.BUILD_EDU)
    } else if (step === S.BUILD_EDU) {
      pushUser(t)
      setCollected(c => ({ ...c, education: t.toLowerCase() === 'skip' ? '' : t }))
      pushAI({ text: "What skills should we highlight? Languages, frameworks, tools, certifications — or skip." })
      setStep(S.BUILD_SKILLS)
    } else if (step === S.BUILD_SKILLS) {
      pushUser(t)
      setCollected(c => ({ ...c, skills: t.toLowerCase() === 'skip' ? '' : t }))
      pushAI({ text: "Almost there — your name and contact info. You can type it all on one line." })
      setStep(S.BUILD_CONTACT)
    } else if (step === S.BUILD_CONTACT) {
      pushUser(t)
      const snap = { ...collected, contact: t }
      setCollected(snap)
      doBuild(snap)
    }
  }

  // ── BUILD flow ─────────────────────────────────────────────────────────────
  const doBuild = snap => {
    setStep(S.BUILD_LOADING)
    pushAI({ text: "Building your resume… this usually takes 15–30 seconds." })

    const go = async () => {
      try {
        const raw = [
          snap.contact,
          snap.experience,
          snap.education && `Education: ${snap.education}`,
          snap.skills    && `Skills: ${snap.skills}`,
        ].filter(Boolean).join('\n\n')

        const { data } = await resumeApi.generate({
          target_role: snap.role || 'Professional',
          raw_input:   raw,
        })

        let count = 0
        pollRef.current = setInterval(async () => {
          if (++count > MAX_POLL) {
            stopPoll()
            pushAI({ text: "Generation timed out. Please try again." })
            setStep(S.WELCOME)
            return
          }
          try {
            const { data: r } = await resumeApi.get(data.id)
            if (r.status === 'completed' && r.resume_data) {
              stopPoll()
              setResumeData(r.resume_data)
              setStep(S.BUILD_DONE)
              pushAI({ kind: 'resume', text: "Here's your resume! Click Customise to change the style, layout, font and more." })
              refreshUser()
            } else if (r.status === 'failed') {
              stopPoll()
              pushAI({ text: "Something went wrong generating the resume. Please try again." })
              setStep(S.WELCOME)
            }
          } catch {
            stopPoll()
            pushAI({ text: "Connection error. Please try again." })
            setStep(S.WELCOME)
          }
        }, POLL_MS)
      } catch (err) {
        if (err.response?.status === 402) { openUpgradeModal(); setStep(S.WELCOME) }
        else { pushAI({ text: "Something went wrong. Please try again." }); setStep(S.WELCOME) }
      }
    }

    if (!user) { openAuthModal(go); return }
    go()
  }

  // ── FIX flow ───────────────────────────────────────────────────────────────
  const doFix = selectedFile => {
    setStep(S.FIX_LOADING)
    pushAI({ text: "Analyzing your resume… usually takes 20–40 seconds." })

    const go = async () => {
      try {
        const fd = new FormData()
        fd.append('file', selectedFile)
        const { data } = await updaterApi.submit(fd)

        let count = 0
        pollRef.current = setInterval(async () => {
          if (++count > MAX_POLL) {
            stopPoll()
            pushAI({ text: "Processing timed out. Please try again." })
            setStep(S.FIX_UPLOAD)
            return
          }
          try {
            const { data: r } = await updaterApi.get(data.id)
            if (r.status === 'completed' && r.resume_data) {
              stopPoll()
              setResumeData(r.resume_data)
              setStep(S.FIX_DONE)
              pushAI({ kind: 'resume_fix', text: "Here's your improved resume! Click Customise to change the style.", issues: r.issues })
              refreshUser()
            } else if (r.status === 'failed') {
              stopPoll()
              pushAI({ text: "Processing failed. Please try again." })
              setStep(S.FIX_UPLOAD)
            }
          } catch {
            stopPoll()
            pushAI({ text: "Connection error." })
            setStep(S.WELCOME)
          }
        }, POLL_MS)
      } catch (err) {
        if (err.response?.status === 402) { openUpgradeModal(); setStep(S.WELCOME) }
        else { pushAI({ text: "Something went wrong. Please try again." }); setStep(S.FIX_UPLOAD) }
      }
    }

    if (!user) { openAuthModal(go); return }
    go()
  }

  // ── ROAST flow ─────────────────────────────────────────────────────────────
  const doRoast = () => {
    const hasText = roastText.trim().length > 0
    const hasFile = roastFile !== null
    if (!hasText && !hasFile) return

    const preview = hasText
      ? (roastText.length > 100 ? roastText.slice(0, 100) + '…' : roastText)
      : `Uploaded: ${roastFile.name}`
    pushUser(preview)
    setStep(S.ROAST_LOADING)
    pushAI({ text: "Roasting… this usually takes 20–40 seconds." })

    const go = async () => {
      try {
        const fd = new FormData()
        fd.append('work_type', collected.workType || 'resume')
        fd.append('intensity', collected.intensity || 'honest')
        if (hasFile) fd.append('file', roastFile)
        else         fd.append('input_text', roastText.trim())
        const { data } = await roastApi.submit(fd)
        refreshUser()

        let count = 0
        pollRef.current = setInterval(async () => {
          if (++count > MAX_POLL) {
            stopPoll()
            pushAI({ text: "Roast timed out. Please try again." })
            setStep(S.WELCOME)
            return
          }
          try {
            const { data: r } = await roastApi.get(data.id)
            if (r.status === 'completed') {
              stopPoll()
              setRoastResult(r)
              setStep(S.ROAST_DONE)
              pushAI({ kind: 'roast', text: "Here's your roast!", result: r })
              refreshUser()
            } else if (r.status === 'failed') {
              stopPoll()
              pushAI({ text: "Roast failed. Please try again." })
              setStep(S.WELCOME)
            }
          } catch {
            stopPoll()
            pushAI({ text: "Connection error." })
            setStep(S.WELCOME)
          }
        }, POLL_MS)
      } catch (err) {
        if (err.response?.status === 402) { openUpgradeModal(); setStep(S.WELCOME) }
        else { pushAI({ text: "Something went wrong. Please try again." }); setStep(S.ROAST_CONTENT) }
      }
    }
    go()
  }

  // ── Derived ────────────────────────────────────────────────────────────────
  const isTextStep   = [S.BUILD_ROLE, S.BUILD_EXP, S.BUILD_EDU, S.BUILD_SKILLS, S.BUILD_CONTACT].includes(step)
  const isMultiline  = [S.BUILD_EXP, S.BUILD_EDU, S.BUILD_SKILLS].includes(step)
  const isLoading    = [S.BUILD_LOADING, S.FIX_LOADING, S.ROAST_LOADING].includes(step)
  const isDone       = [S.BUILD_DONE, S.FIX_DONE, S.ROAST_DONE].includes(step)
  const isChoiceStep = [S.WELCOME, S.ROAST_TYPE, S.ROAST_INTENSITY].includes(step)

  const placeholder =
    step === S.BUILD_ROLE    ? 'e.g. Software Engineer, Product Manager…'           :
    step === S.BUILD_EXP     ? 'e.g. Senior Engineer at Google (2022–2024), led team of 4, built payment APIs…' :
    step === S.BUILD_EDU     ? 'e.g. BS Computer Science, NYU 2021, GPA 3.8 — or skip' :
    step === S.BUILD_SKILLS  ? 'e.g. Python, Django, PostgreSQL, AWS, Docker — or skip' :
    step === S.BUILD_CONTACT ? 'e.g. John Doe, john@example.com, +1-555-0123, New York' :
    'Type your answer…'

  return (
    <div className="flex flex-col" style={{ height: 'calc(100vh - 56px)' }}>

      {/* ── Messages ──────────────────────────────────────────────────── */}
      <div className="flex-1 overflow-y-auto px-4 py-6">
        <div className="max-w-2xl mx-auto space-y-5">

          {messages.map(msg => (
            <div key={msg.id}>
              {msg.type === 'user' ? (
                <div className="flex justify-end">
                  <div className="bg-orange-500 text-white rounded-2xl rounded-tr-sm px-5 py-3 max-w-[80%] text-[15px] leading-relaxed">
                    {msg.text}
                  </div>
                </div>
              ) : (
                <div className="flex gap-3 items-start">
                  <AIAvatar />
                  <div className="flex-1 min-w-0">
                    {msg.text && (
                      <div className="bg-white border border-gray-200 rounded-2xl rounded-tl-sm px-5 py-3.5 shadow-sm inline-block max-w-full">
                        <p className="text-gray-800 text-[15px] leading-relaxed">{msg.text}</p>
                      </div>
                    )}

                    {/* Choice buttons */}
                    {msg.choices && (
                      <div className="flex flex-wrap gap-2 mt-3">
                        {msg.choices.map(c => {
                          const chosen = msg.chosen
                          const isThis = chosen === c.value
                          return (
                            <button
                              key={c.value}
                              onClick={() => !chosen && onChoice(c.value, msg.id)}
                              disabled={!!chosen}
                              className={`px-4 py-2.5 rounded-xl border-2 text-sm font-semibold transition-all duration-150 text-left
                                ${isThis
                                  ? 'border-orange-500 bg-orange-500 text-white'
                                  : chosen
                                    ? 'border-gray-200 bg-white text-gray-300 cursor-default'
                                    : 'border-orange-200 bg-orange-50 text-orange-700 hover:bg-orange-100 hover:border-orange-300'
                                }`}
                            >
                              <span className="block">{c.label}</span>
                              {c.sub && (
                                <span className={`block text-xs font-normal mt-0.5 ${isThis ? 'text-orange-100' : chosen ? 'text-gray-300' : 'text-orange-400'}`}>
                                  {c.sub}
                                </span>
                              )}
                            </button>
                          )
                        })}
                      </div>
                    )}

                    {/* Inline resume (build or fix) */}
                    {(msg.kind === 'resume' || msg.kind === 'resume_fix') && resumeData && (
                      <>
                        {msg.kind === 'resume_fix' && msg.issues && (
                          <div className="mt-3 bg-blue-50 border border-blue-100 rounded-xl px-4 py-3 text-sm text-blue-800">
                            <span className="font-semibold">What we improved: </span>{msg.issues}
                          </div>
                        )}
                        <InlineResume
                          resumeData={resumeData}
                          styleConfig={styleConfig}
                          onRestart={restart}
                          onViewFull={() => setPreviewOpen(true)}
                        />
                      </>
                    )}

                    {/* Inline roast */}
                    {msg.kind === 'roast' && msg.result && (
                      <InlineRoast result={msg.result} onRestart={restart} />
                    )}
                  </div>
                </div>
              )}
            </div>
          ))}

          {isLoading && <TypingDots />}
          <div ref={bottomRef} />
        </div>
      </div>

      {/* ── Full-screen customiser overlay ────────────────────────────── */}
      {previewOpen && resumeData && (
        <div className="fixed inset-0 z-50 flex" style={{ fontFamily: 'inherit' }}>

          {/* Resume area */}
          <div className="flex-1 bg-gray-100 overflow-y-auto">
            <div className="max-w-3xl mx-auto px-6 py-8">
              {/* Top bar */}
              <div className="flex flex-wrap items-center gap-3 mb-6 print:hidden">
                <button onClick={() => setPreviewOpen(false)} className="btn-secondary py-2 px-3 text-sm gap-1.5">
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <line x1="19" y1="12" x2="5" y2="12" /><polyline points="12 19 5 12 12 5" />
                  </svg>
                  Back to chat
                </button>
                <button onClick={() => window.print()} className="btn-primary py-2 px-4 text-sm gap-2">
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <polyline points="6 9 6 2 18 2 18 9" />
                    <path d="M6 18H4a2 2 0 0 1-2-2v-5a2 2 0 0 1 2-2h16a2 2 0 0 1 2 2v5a2 2 0 0 1-2 2h-2" />
                    <rect x="6" y="14" width="12" height="8" />
                  </svg>
                  Print / Save PDF
                </button>
              </div>
              {/* Resume */}
              <ResumeRenderer data={resumeData} style={styleConfig} />
            </div>
          </div>

          {/* Style panel */}
          <StylePanel style={styleConfig} onChange={setStyleConfig} />
        </div>
      )}

      {/* ── Input area ────────────────────────────────────────────────── */}
      <div className="border-t border-gray-200 bg-white px-4 py-4 flex-shrink-0">
        <div className="max-w-2xl mx-auto">

          {/* Text steps */}
          {isTextStep && (
            <div className="flex gap-2 items-end">
              {isMultiline ? (
                <textarea
                  ref={inputRef}
                  value={text}
                  onChange={e => setText(e.target.value)}
                  onKeyDown={e => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); onText() } }}
                  placeholder={placeholder}
                  rows={3}
                  className="flex-1 input-base resize-none text-[14px] leading-relaxed"
                />
              ) : (
                <input
                  ref={inputRef}
                  value={text}
                  onChange={e => setText(e.target.value)}
                  onKeyDown={e => e.key === 'Enter' && onText()}
                  placeholder={placeholder}
                  className="flex-1 input-base text-[14px]"
                />
              )}
              <button
                onClick={onText}
                disabled={!text.trim()}
                className="w-10 h-10 rounded-xl bg-orange-500 hover:bg-orange-600 disabled:bg-gray-200 flex items-center justify-center transition-colors flex-shrink-0"
              >
                <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5">
                  <line x1="5" y1="12" x2="19" y2="12" /><polyline points="12 5 19 12 12 19" />
                </svg>
              </button>
            </div>
          )}

          {/* Fix: upload zone */}
          {step === S.FIX_UPLOAD && (
            <>
              <input ref={fixFileRef} type="file" accept=".txt,.pdf,.md" className="hidden"
                onChange={e => { if (e.target.files[0]) { setFixFile(e.target.files[0]); doFix(e.target.files[0]) } }} />
              <button onClick={() => fixFileRef.current?.click()}
                className="w-full rounded-xl border-2 border-dashed border-gray-300 hover:border-orange-400 bg-gray-50 hover:bg-orange-50 py-8 text-center transition-all duration-150">
                <div className="w-10 h-10 mx-auto mb-3 rounded-lg bg-gray-200 flex items-center justify-center">
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#9ca3af" strokeWidth="1.5">
                    <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
                    <polyline points="17 8 12 3 7 8" />
                    <line x1="12" y1="3" x2="12" y2="15" />
                  </svg>
                </div>
                <p className="text-sm font-medium text-gray-700">Click to upload your resume</p>
                <p className="text-xs text-gray-400 mt-1">.pdf · .txt · .md</p>
              </button>
            </>
          )}

          {/* Roast: paste or upload */}
          {step === S.ROAST_CONTENT && (
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-xs font-medium text-gray-500">Your content</span>
                <div className="flex border border-gray-200 rounded-lg overflow-hidden text-xs">
                  {['text', 'file'].map(m => (
                    <button key={m} onClick={() => setRoastMode(m)}
                      className={`px-3 py-1.5 font-semibold transition-colors ${roastMode === m ? 'bg-gray-900 text-white' : 'bg-white text-gray-500 hover:text-gray-800'}`}>
                      {m === 'text' ? 'Paste text' : 'Upload file'}
                    </button>
                  ))}
                </div>
              </div>
              {roastMode === 'text' ? (
                <div className="flex gap-2 items-end">
                  <textarea
                    ref={inputRef}
                    value={roastText}
                    onChange={e => setRoastText(e.target.value)}
                    placeholder="Paste your resume, code, essay, LinkedIn bio…"
                    rows={4}
                    className="flex-1 input-base resize-none text-[13px] leading-relaxed font-mono"
                  />
                  <button onClick={doRoast} disabled={!roastText.trim()}
                    className="w-10 h-10 rounded-xl bg-orange-500 hover:bg-orange-600 disabled:bg-gray-200 flex items-center justify-center transition-colors flex-shrink-0">
                    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5">
                      <line x1="5" y1="12" x2="19" y2="12" /><polyline points="12 5 19 12 12 19" />
                    </svg>
                  </button>
                </div>
              ) : (
                <div className="flex gap-2 items-center">
                  <input ref={roastFileRef} type="file" accept=".txt,.pdf,.md,.py,.js,.ts,.jsx,.tsx,.java,.go,.rs,.cpp,.c" className="hidden"
                    onChange={e => e.target.files[0] && setRoastFile(e.target.files[0])} />
                  <div onClick={() => roastFileRef.current?.click()}
                    className={`flex-1 rounded-xl border-2 border-dashed py-5 text-center cursor-pointer transition-all ${roastFile ? 'border-orange-300 bg-orange-50/50' : 'border-gray-200 bg-gray-50 hover:border-gray-300'}`}>
                    {roastFile
                      ? <p className="text-sm text-orange-700 font-medium">{roastFile.name} · Click to change</p>
                      : <><p className="text-sm font-medium text-gray-700">Click to upload</p><p className="text-xs text-gray-400 mt-0.5">.pdf .txt .py .js and more</p></>}
                  </div>
                  <button onClick={doRoast} disabled={!roastFile}
                    className="w-10 h-10 rounded-xl bg-orange-500 hover:bg-orange-600 disabled:bg-gray-200 flex items-center justify-center transition-colors flex-shrink-0">
                    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5">
                      <line x1="5" y1="12" x2="19" y2="12" /><polyline points="12 5 19 12 12 19" />
                    </svg>
                  </button>
                </div>
              )}
            </div>
          )}

          {isChoiceStep && !isLoading && (
            <p className="text-center text-xs text-gray-400">Choose an option above to continue</p>
          )}

          {isDone && (
            <button onClick={restart} className="w-full btn-secondary py-3">
              Start a new conversation
            </button>
          )}
        </div>
      </div>
    </div>
  )
}
