import { useState, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import { roastApi } from '../api/client'
import { useAuth } from '../context/AuthContext'

const WORK_TYPES = [
  { value: 'resume',     label: 'Resume / CV'   },
  { value: 'code',       label: 'Code'          },
  { value: 'pitch_deck', label: 'Pitch Deck'    },
  { value: 'linkedin',   label: 'LinkedIn'      },
  { value: 'essay',      label: 'Essay'         },
  { value: 'ui_design',  label: 'UI Design'     },
]

const INTENSITIES = [
  { value: 'gentle',        label: 'Gentle'  },
  { value: 'honest',        label: 'Honest'  },
  { value: 'gordon_ramsay', label: 'Gordon'  },
  { value: 'simon_cowell',  label: 'Simon'   },
]

export default function UploadForm() {
  const [workType,  setWorkType]  = useState('resume')
  const [intensity, setIntensity] = useState('honest')
  const [inputText, setInputText] = useState('')
  const [file,      setFile]      = useState(null)
  const [inputMode, setInputMode] = useState('text')
  const [loading,   setLoading]   = useState(false)
  const [error,     setError]     = useState('')
  const fileRef  = useRef()
  const navigate = useNavigate()
  const { user, refreshUser, openAuthModal, openUpgradeModal } = useAuth()

  const validate = () => {
    if (inputMode === 'text' && !inputText.trim()) { setError('Paste some content to roast.'); return false }
    if (inputMode === 'file' && !file)             { setError('Select a file to upload.');      return false }
    return true
  }

  const buildAndSubmit = async () => {
    if (!validate()) return
    setLoading(true); setError('')
    try {
      const fd = new FormData()
      fd.append('work_type', workType)
      fd.append('intensity', intensity)
      if (inputMode === 'text') fd.append('input_text', inputText)
      else fd.append('file', file)
      const { data } = await roastApi.submit(fd)
      refreshUser()
      navigate(`/result/${data.id}`)
    } catch (err) {
      if (err.response?.status === 402) openUpgradeModal()
      else setError(err.response?.data?.detail || 'Something went wrong. Try again.')
    } finally {
      setLoading(false)
    }
  }

  const handleSubmit = (e) => {
    e.preventDefault(); setError('')
    if (!user) { openAuthModal(buildAndSubmit); return }
    buildAndSubmit()
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-5">

      {/* Work type */}
      <div>
        <p className="section-title mb-2.5">What are we roasting?</p>
        <div className="flex flex-wrap gap-1.5">
          {WORK_TYPES.map((wt) => (
            <button
              key={wt.value}
              type="button"
              onClick={() => setWorkType(wt.value)}
              className={`px-3.5 py-2 rounded-lg border text-sm font-medium transition-all duration-150 ${
                workType === wt.value
                  ? 'border-orange-400 bg-orange-50 text-orange-700'
                  : 'border-gray-200 bg-white text-gray-600 hover:border-gray-300 hover:text-gray-900'
              }`}
            >
              {wt.label}
            </button>
          ))}
        </div>
      </div>

      <div className="border-t border-gray-100" />

      {/* Intensity */}
      <div>
        <p className="section-title mb-2.5">Roast intensity</p>
        <div className="grid grid-cols-4 gap-1.5">
          {INTENSITIES.map((it) => (
            <button
              key={it.value}
              type="button"
              onClick={() => setIntensity(it.value)}
              className={`py-2.5 px-2 rounded-lg border text-sm font-medium text-center transition-all duration-150 ${
                intensity === it.value
                  ? 'border-orange-400 bg-orange-50 text-orange-700'
                  : 'border-gray-200 bg-white text-gray-600 hover:border-gray-300 hover:text-gray-900'
              }`}
            >
              {it.label}
            </button>
          ))}
        </div>
      </div>

      <div className="border-t border-gray-100" />

      {/* Content */}
      <div>
        <div className="flex items-center justify-between mb-2.5">
          <p className="section-title">Your content</p>
          <div className="flex border border-gray-200 rounded-lg overflow-hidden">
            {['text', 'file'].map((mode) => (
              <button
                key={mode}
                type="button"
                onClick={() => setInputMode(mode)}
                className={`px-3.5 py-1.5 text-[12px] font-semibold transition-colors ${
                  inputMode === mode
                    ? 'bg-gray-900 text-white'
                    : 'bg-white text-gray-500 hover:text-gray-800'
                }`}
              >
                {mode === 'text' ? 'Paste text' : 'Upload file'}
              </button>
            ))}
          </div>
        </div>

        {inputMode === 'text' ? (
          <textarea
            value={inputText}
            onChange={(e) => setInputText(e.target.value)}
            placeholder="Paste your resume, code, LinkedIn bio, pitch deck content, essay..."
            rows={9}
            className="input-base resize-none font-mono text-[13px] leading-relaxed"
          />
        ) : (
          <div
            onClick={() => fileRef.current?.click()}
            className={`rounded-xl p-10 text-center cursor-pointer transition-all duration-150 border-2 border-dashed ${
              file
                ? 'border-orange-300 bg-orange-50/50'
                : 'border-gray-200 hover:border-gray-300 bg-gray-50'
            }`}
          >
            <input
              ref={fileRef}
              type="file"
              accept=".txt,.pdf,.md,.py,.js,.ts,.jsx,.tsx,.java,.go,.rs,.cpp,.c,.html,.css,.json,.csv"
              className="hidden"
              onChange={(e) => setFile(e.target.files[0])}
            />
            {file ? (
              <div>
                <div className="w-10 h-10 mx-auto mb-3 rounded-lg bg-orange-100 border border-orange-200 flex items-center justify-center">
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#f97316" strokeWidth="1.5"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/></svg>
                </div>
                <p className="text-orange-700 font-semibold text-sm">{file.name}</p>
                <p className="text-gray-400 text-xs mt-1">{(file.size / 1024).toFixed(1)} KB · Click to change</p>
              </div>
            ) : (
              <div>
                <div className="w-10 h-10 mx-auto mb-3 rounded-lg bg-gray-200 flex items-center justify-center">
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#9ca3af" strokeWidth="1.5"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="17 8 12 3 7 8"/><line x1="12" y1="3" x2="12" y2="15"/></svg>
                </div>
                <p className="text-gray-700 text-sm font-medium">Click to upload</p>
                <p className="text-gray-400 text-xs mt-1">.pdf .txt .md .py .js .ts and more</p>
              </div>
            )}
          </div>
        )}
      </div>

      {error && (
        <div className="flex items-center gap-2 text-sm text-red-600 bg-red-50 border border-red-200 rounded-lg px-4 py-3">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="flex-shrink-0"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>
          {error}
        </div>
      )}

      <button type="submit" disabled={loading} className="btn-primary w-full py-3 text-[15px]">
        {loading ? (
          <>
            <svg className="animate-spin" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M21 12a9 9 0 1 1-6.219-8.56"/></svg>
            Generating roast...
          </>
        ) : (
          'Roast My Work'
        )}
      </button>

      {!user && (
        <p className="text-center text-[12px] text-gray-400">
          Free to try · Sign in with Google · 5 roasts included
        </p>
      )}
    </form>
  )
}
