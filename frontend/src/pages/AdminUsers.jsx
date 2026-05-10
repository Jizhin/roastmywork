import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import api from '../api/client'

const ADMIN_EMAIL = 'jisprofessional2@gmail.com'

function fmt(dateStr) {
  if (!dateStr) return '—'
  return new Date(dateStr).toLocaleDateString('en-IN', {
    day: '2-digit', month: 'short', year: 'numeric',
  })
}

function fmtTime(dateStr) {
  if (!dateStr) return '—'
  return new Date(dateStr).toLocaleString('en-IN', {
    day: '2-digit', month: 'short', year: 'numeric',
    hour: '2-digit', minute: '2-digit',
  })
}

export default function AdminUsers() {
  const { user, loading } = useAuth()
  const navigate = useNavigate()
  const [data, setData] = useState(null)
  const [error, setError] = useState('')
  const [search, setSearch] = useState('')

  useEffect(() => {
    if (loading) return
    if (!user) { navigate('/'); return }
    if (user.email !== ADMIN_EMAIL) { navigate('/'); return }

    api.get('/users/admin-users/')
      .then(r => setData(r.data))
      .catch(() => setError('Failed to load users.'))
  }, [user, loading])

  if (loading || !data) {
    return (
      <div className="flex items-center justify-center h-64 text-sm text-gray-400">
        {error || 'Loading…'}
      </div>
    )
  }

  const filtered = data.users.filter(u =>
    u.email.toLowerCase().includes(search.toLowerCase()) ||
    u.username.toLowerCase().includes(search.toLowerCase())
  )

  return (
    <div className="max-w-5xl mx-auto px-4 py-8">
      {/* Header */}
      <div className="mb-6 flex items-center justify-between gap-4 flex-wrap">
        <div>
          <h1 className="text-xl font-bold text-gray-900">Signed-up Users</h1>
          <p className="text-sm text-gray-500 mt-0.5">{data.count} total users</p>
        </div>
        <input
          type="text"
          placeholder="Search email or username…"
          value={search}
          onChange={e => setSearch(e.target.value)}
          className="input-base text-sm w-64"
        />
      </div>

      {/* Stats row */}
      <div className="grid grid-cols-3 gap-3 mb-6">
        <div className="bg-white border border-gray-200 rounded-xl px-4 py-3">
          <div className="text-2xl font-bold text-gray-900">{data.count}</div>
          <div className="text-xs text-gray-400 mt-0.5">Total users</div>
        </div>
        <div className="bg-white border border-gray-200 rounded-xl px-4 py-3">
          <div className="text-2xl font-bold text-orange-600">
            {data.users.filter(u => u.is_pro).length}
          </div>
          <div className="text-xs text-gray-400 mt-0.5">Pro users</div>
        </div>
        <div className="bg-white border border-gray-200 rounded-xl px-4 py-3">
          <div className="text-2xl font-bold text-gray-900">
            {data.users.filter(u => {
              const d = new Date(u.date_joined)
              const now = new Date()
              return now - d < 7 * 24 * 60 * 60 * 1000
            }).length}
          </div>
          <div className="text-xs text-gray-400 mt-0.5">Last 7 days</div>
        </div>
      </div>

      {/* Table */}
      <div className="bg-white border border-gray-200 rounded-xl overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-gray-100 bg-gray-50">
                <th className="text-left px-4 py-3 text-[11px] font-semibold text-gray-400 uppercase tracking-wider">#</th>
                <th className="text-left px-4 py-3 text-[11px] font-semibold text-gray-400 uppercase tracking-wider">Email</th>
                <th className="text-left px-4 py-3 text-[11px] font-semibold text-gray-400 uppercase tracking-wider">Username</th>
                <th className="text-left px-4 py-3 text-[11px] font-semibold text-gray-400 uppercase tracking-wider">Joined</th>
                <th className="text-left px-4 py-3 text-[11px] font-semibold text-gray-400 uppercase tracking-wider">Last Login</th>
                <th className="text-left px-4 py-3 text-[11px] font-semibold text-gray-400 uppercase tracking-wider">Credits</th>
                <th className="text-left px-4 py-3 text-[11px] font-semibold text-gray-400 uppercase tracking-wider">Plan</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((u, i) => (
                <tr key={u.id} className="border-b border-gray-50 hover:bg-gray-50 transition-colors">
                  <td className="px-4 py-3 text-gray-400 text-xs">{i + 1}</td>
                  <td className="px-4 py-3 text-gray-800 font-medium">{u.email}</td>
                  <td className="px-4 py-3 text-gray-500">{u.username}</td>
                  <td className="px-4 py-3 text-gray-500 text-xs">{fmt(u.date_joined)}</td>
                  <td className="px-4 py-3 text-gray-500 text-xs">{fmtTime(u.last_login)}</td>
                  <td className="px-4 py-3">
                    <span className="text-gray-700 font-semibold">{u.roast_credits}</span>
                  </td>
                  <td className="px-4 py-3">
                    {u.is_pro
                      ? <span className="text-[11px] font-bold text-orange-600 bg-orange-50 border border-orange-200 px-2 py-0.5 rounded-full">PRO</span>
                      : <span className="text-[11px] text-gray-400 bg-gray-50 border border-gray-200 px-2 py-0.5 rounded-full">Free</span>
                    }
                  </td>
                </tr>
              ))}
              {filtered.length === 0 && (
                <tr>
                  <td colSpan={7} className="px-4 py-8 text-center text-sm text-gray-400">No users found</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}
