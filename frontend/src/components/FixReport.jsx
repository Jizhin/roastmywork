import { useState } from 'react'

export default function FixReport({ fixOutput }) {
  const [open, setOpen] = useState(true)
  if (!fixOutput) return null

  return (
    <div className="card p-6 animate-fade-up" style={{ animationDelay: '60ms' }}>
      <button
        onClick={() => setOpen((o) => !o)}
        className="w-full flex items-center justify-between text-left"
      >
        <div>
          <h2 className="text-base font-bold text-gray-900">Fix Report</h2>
          <p className="text-gray-500 text-sm mt-0.5">Actionable steps to improve your work</p>
        </div>
        <div className={`w-7 h-7 rounded-md border border-gray-200 bg-gray-50 flex items-center justify-center text-gray-400 transition-transform duration-200 ${open ? 'rotate-180' : ''}`}>
          <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
            <polyline points="6 9 12 15 18 9"/>
          </svg>
        </div>
      </button>

      {open && (
        <div className="mt-5 border-t border-gray-100 pt-5">
          <MarkdownRenderer content={fixOutput} />
        </div>
      )}
    </div>
  )
}

function MarkdownRenderer({ content }) {
  const lines = content.split('\n')
  const elements = []
  let listItems = []

  const flushList = () => {
    if (listItems.length > 0) {
      elements.push(
        <ul key={elements.length} className="mt-2 space-y-2">
          {listItems.map((item, i) => (
            <li key={i} className="flex gap-2.5 text-sm text-gray-700 leading-relaxed">
              <span className="mt-2 w-1.5 h-1.5 rounded-full bg-orange-400 flex-shrink-0" />
              <span dangerouslySetInnerHTML={{ __html: formatInline(item) }} />
            </li>
          ))}
        </ul>
      )
      listItems = []
    }
  }

  lines.forEach((line, i) => {
    if (line.startsWith('## ')) {
      flushList()
      elements.push(
        <h3 key={i} className="text-xs font-bold uppercase tracking-wider text-orange-600 mt-5 mb-1">
          {line.replace('## ', '')}
        </h3>
      )
    } else if (line.startsWith('# ')) {
      flushList()
      elements.push(
        <h2 key={i} className="text-sm font-bold text-gray-900 mt-5 mb-1">
          {line.replace('# ', '')}
        </h2>
      )
    } else if (line.match(/^(\d+\.|-|\*)\s/)) {
      listItems.push(line.replace(/^(\d+\.|-|\*)\s/, ''))
    } else if (line.trim() === '') {
      flushList()
      elements.push(<div key={i} className="h-1" />)
    } else {
      flushList()
      elements.push(
        <p key={i} className="text-sm text-gray-700 leading-relaxed"
          dangerouslySetInnerHTML={{ __html: formatInline(line) }} />
      )
    }
  })
  flushList()
  return <div className="space-y-0.5">{elements}</div>
}

function formatInline(text) {
  return text
    .replace(/\*\*(.+?)\*\*/g, '<strong class="font-semibold text-gray-900">$1</strong>')
    .replace(/\*(.+?)\*/g, '<em class="italic">$1</em>')
    .replace(/`(.+?)`/g, '<code class="bg-gray-100 border border-gray-200 px-1.5 py-0.5 rounded text-orange-600 font-mono text-xs">$1</code>')
}
