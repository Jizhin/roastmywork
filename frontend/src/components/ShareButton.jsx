import { useState } from 'react'

export default function ShareButton({ roastId }) {
  const [copied, setCopied] = useState(false)
  const shareUrl = `${window.location.origin}/result/${roastId}`

  const handleCopy = async () => {
    try { await navigator.clipboard.writeText(shareUrl) }
    catch {
      const el = document.createElement('textarea')
      el.value = shareUrl
      document.body.appendChild(el); el.select()
      document.execCommand('copy')
      document.body.removeChild(el)
    }
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  return (
    <button
      onClick={handleCopy}
      className={`flex items-center gap-2 text-[13px] px-3.5 py-1.5 rounded-lg border font-medium transition-all duration-150 ${
        copied
          ? 'border-green-300 bg-green-50 text-green-700'
          : 'border-gray-200 bg-white text-gray-600 hover:border-gray-300 hover:text-gray-900'
      }`}
    >
      {copied ? (
        <>
          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"><path d="M20 6L9 17l-5-5"/></svg>
          Copied
        </>
      ) : (
        <>
          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71"/>
            <path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71"/>
          </svg>
          Share link
        </>
      )}
    </button>
  )
}
