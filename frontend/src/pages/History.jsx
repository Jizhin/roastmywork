import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { roastApi } from '../api/client'

const STATUS = {
  completed:  { dot: 'bg-green-500',  text: 'text-green-700',  bg: 'bg-green-50 border-green-200',  label: 'Completed'  },
  processing: { dot: 'bg-amber-500',  text: 'text-amber-700',  bg: 'bg-amber-50 border-amber-200',  label: 'Processing' },
  pending:    { dot: 'bg-gray-400',   text: 'text-gray-600',   bg: 'bg-gray-100 border-gray-200',   label: 'Pending'    },
  failed:     { dot: 'bg-red-500',    text: 'text-red-700',    bg: 'bg-red-50 border-red-200',      label: 'Failed'     },
}

const WORK_LABELS = {
  resume: 'Resume / CV', code: 'Code', pitch_deck: 'Pitch Deck',
  linkedin: 'LinkedIn', essay: 'Essay', ui_design: 'UI Design',
}

function ScoreBadge({ score }) {
  if (score == null) return <span className="text-gray-300 text-sm">—</span>
  const color =
    score >= 80 ? 'text-green-700 bg-green-50 border-green-200' :
    score >= 60 ? 'text-amber-700 bg-amber-50 border-amber-200' :
    score >= 40 ? 'text-orange-700 bg-orange-50 border-orange-200' :
                  'text-red-700 bg-red-50 border-red-200'
  return (
    <span className={`text-[12px] font-bold tabular-nums border px-2.5 py-0.5 rounded-full ${color}`}>
      {score}
    </span>
  )
}

export default function History() {
  const [roasts,  setRoasts]  = useState([])
  const [loading, setLoading] = useState(true)
  const [error,   setError]   = useState('')

  useEffect(() => {
    roastApi.history()
      .then(({ data }) => setRoasts(data.results ?? data))
      .catch(() => setError('Sign in to view your roast history.'))
      .finally(() => setLoading(false))
  }, [])

  if (loading) {
    return (
      <div className="max-w-8xl mx-auto px-6 py-32 flex justify-center">
        <div className="w-8 h-8 rounded-full border-4 border-gray-200 border-t-blue-600 animate-spin" />
      </div>
    )
  }

  if (error) {
    return (
      <div className="max-w-8xl mx-auto px-6 py-32 text-center">
        <p className="text-gray-600 text-lg mb-7">{error}</p>
        <Link to="/" className="btn-primary">Go Home</Link>
      </div>
    )
  }

  if (roasts.length === 0) {
    return (
      <div className="max-w-8xl mx-auto px-6 py-32 text-center">
        <h2 className="text-xl font-bold text-gray-900 mb-2">No roasts yet</h2>
        <p className="text-gray-500 mb-8">Your courage is admirable. Your work — we'll see.</p>
        <Link to="/" className="btn-primary">Submit Your First Roast</Link>
      </div>
    )
  }

  return (
    <div className="max-w-8xl mx-auto px-6 py-10">
      <div className="flex items-center justify-between mb-7">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Roast History</h1>
          <p className="text-gray-500 text-sm mt-0.5">{roasts.length} submission{roasts.length !== 1 ? 's' : ''}</p>
        </div>
        <Link to="/" className="btn-secondary">New Roast</Link>
      </div>

      <div className="card overflow-hidden">
        <table className="w-full">
          <thead>
            <tr className="border-b border-gray-100 bg-gray-50">
              <th className="text-left px-5 py-3 section-title">Type</th>
              <th className="text-left px-5 py-3 section-title">Intensity</th>
              <th className="text-left px-5 py-3 section-title">Score</th>
              <th className="text-left px-5 py-3 section-title">Status</th>
              <th className="text-left px-5 py-3 section-title">Date</th>
              <th className="px-5 py-3" />
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {roasts.map((roast) => {
              const sc = STATUS[roast.status] || STATUS.pending
              return (
                <tr
                  key={roast.id}
                  className="hover:bg-gray-50 transition-colors cursor-pointer group"
                  onClick={() => window.location.href = `/result/${roast.id}`}
                >
                  <td className="px-5 py-3.5">
                    <span className="text-sm font-semibold text-gray-900">{WORK_LABELS[roast.work_type] || roast.work_type_display}</span>
                  </td>
                  <td className="px-5 py-3.5">
                    <span className="text-sm text-gray-500">{roast.intensity_display}</span>
                  </td>
                  <td className="px-5 py-3.5">
                    <ScoreBadge score={roast.score} />
                  </td>
                  <td className="px-5 py-3.5">
                    <span className={`inline-flex items-center gap-1.5 text-[12px] font-medium border px-2.5 py-0.5 rounded-full ${sc.bg} ${sc.text}`}>
                      <span className={`w-1.5 h-1.5 rounded-full ${sc.dot}`} />
                      {sc.label}
                    </span>
                  </td>
                  <td className="px-5 py-3.5">
                    <span className="text-sm text-gray-400">{new Date(roast.created_at).toLocaleDateString()}</span>
                  </td>
                  <td className="px-5 py-3.5 text-right">
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="text-gray-300 group-hover:text-gray-500 transition-colors ml-auto">
                      <polyline points="9 18 15 12 9 6"/>
                    </svg>
                  </td>
                </tr>
              )
            })}
          </tbody>
        </table>
      </div>
    </div>
  )
}
