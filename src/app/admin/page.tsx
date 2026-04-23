'use client'
import { useEffect, useState, FormEvent } from 'react'
import { useAuth } from '@/lib/AuthContext'
import { apiGet, apiPost, apiDelete } from '@/lib/fetchClient'
import { useRouter } from 'next/navigation'
import type { IUser, IAllowedEmail, UserRole } from '@/types'
import { ROLE_LABEL_MAP } from '@/types'

const ROLE_OPTIONS: UserRole[] = ['store', 'qc', 'cad', 'design', 'bnm', 'fgsourcing']

function UsersSection() {
  const [users, setUsers] = useState<IUser[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    apiGet<IUser[]>('/api/admin/users').then(setUsers).catch(() => {}).finally(() => setLoading(false))
  }, [])

  async function removeUser(id: string) {
    if (!confirm('Remove this user?')) return
    try {
      await apiDelete(`/api/admin/users?id=${id}`)
      setUsers((prev) => prev.filter((u) => u._id !== id))
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Error')
    }
  }

  return (
    <div className="card overflow-hidden">
      <div className="px-5 py-4 border-b border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/30">
        <h2 className="text-sm font-bold text-slate-900 dark:text-slate-100">Registered Users</h2>
      </div>
      {loading ? (
        <div className="p-6 text-sm text-gray-400"><div className="skeleton h-4 w-24 rounded m-6" /></div>
      ) : (
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-slate-100 dark:border-slate-800">
              <th className="text-left px-4 py-3 text-xs font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wide">Name</th>
              <th className="text-left px-4 py-3 text-xs font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wide hidden sm:table-cell">Email</th>
              <th className="text-left px-4 py-3 text-xs font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wide">Role</th>
              <th className="text-left px-4 py-3 text-xs font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wide hidden md:table-cell">Joined</th>
              <th></th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
            {users.map((u) => (
              <tr key={u._id} className="table-row-hover">
                <td className="px-4 py-3 font-medium text-slate-900 dark:text-slate-100">{u.name}</td>
                <td className="px-4 py-3 text-slate-500 dark:text-slate-400 hidden sm:table-cell">{u.email}</td>
                <td className="px-4 py-3">
                  <span className={`badge-${u.role === 'admin' ? 'approved' : 'draft'}`}>
                    {ROLE_LABEL_MAP[u.role]}
                  </span>
                </td>
                <td className="px-4 py-3 text-slate-400 text-xs hidden md:table-cell">
                  {new Date(u.createdAt).toLocaleDateString('en-IN')}
                </td>
                <td className="px-4 py-3 text-right">
                  {u.role !== 'admin' && (
                    <button
                      onClick={() => removeUser(u._id)}
                      className="text-xs text-red-500 hover:underline"
                    >
                      Remove
                    </button>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  )
}

function AllowedEmailsSection() {
  const [list, setList] = useState<IAllowedEmail[]>([])
  const [loading, setLoading] = useState(true)
  const [email, setEmail] = useState('')
  const [role, setRole] = useState<UserRole>('store')
  const [adding, setAdding] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    apiGet<IAllowedEmail[]>('/api/admin/allowed-emails')
      .then(setList)
      .catch(() => {})
      .finally(() => setLoading(false))
  }, [])

  async function handleAdd(e: FormEvent) {
    e.preventDefault()
    setError('')
    setAdding(true)
    try {
      const doc = await apiPost<IAllowedEmail>('/api/admin/allowed-emails', { email, role })
      setList((prev) => [doc, ...prev])
      setEmail('')
      setRole('store')
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error')
    } finally {
      setAdding(false)
    }
  }

  async function handleRemove(id: string) {
    try {
      await apiDelete(`/api/admin/allowed-emails?id=${id}`)
      setList((prev) => prev.filter((e) => e._id !== id))
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Error')
    }
  }

  return (
    <div className="card overflow-hidden">
      <div className="px-5 py-4 border-b border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/30">
        <h2 className="text-sm font-bold text-slate-900 dark:text-slate-100">Allowed Email List</h2>
        <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
          Only these emails (plus admin) can create accounts.
        </p>
      </div>

      {/* Add form */}
      <form onSubmit={handleAdd} className="px-5 py-4 border-b border-slate-100 dark:border-slate-800 flex flex-col sm:flex-row gap-3">
        <input
          type="email"
          required
          className="input text-sm flex-1"
          placeholder="colleague@company.com"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
        />
        <select
          className="input text-sm sm:w-44"
          value={role}
          onChange={(e) => setRole(e.target.value as UserRole)}
        >
          {ROLE_OPTIONS.map((r) => (
            <option key={r} value={r}>{ROLE_LABEL_MAP[r]}</option>
          ))}
        </select>
        <button type="submit" disabled={adding} className="btn-primary text-sm whitespace-nowrap">
          {adding ? 'Adding…' : 'Add'}
        </button>
      </form>
      {error && <p className="px-5 py-2 text-xs text-red-600 dark:text-red-400">{error}</p>}

      {loading ? (
        <div className="p-6 text-sm text-slate-400"><div className="skeleton h-4 w-24 rounded m-6" /></div>
      ) : list.length === 0 ? (
        <div className="p-6 text-sm text-slate-400">No allowed emails yet.</div>
      ) : (
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-slate-100 dark:border-slate-800">
              <th className="text-left px-4 py-3 text-xs font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wide">Email</th>
              <th className="text-left px-4 py-3 text-xs font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wide">Role</th>
              <th className="text-left px-4 py-3 text-xs font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wide hidden md:table-cell">Added</th>
              <th></th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
            {list.map((item) => (
              <tr key={item._id} className="table-row-hover">
                <td className="px-4 py-3 text-slate-700 dark:text-slate-300">{item.email}</td>
                <td className="px-4 py-3">
                  <span className="badge-draft">{ROLE_LABEL_MAP[item.role]}</span>
                </td>
                <td className="px-4 py-3 text-slate-400 text-xs hidden md:table-cell">
                  {new Date(item.createdAt).toLocaleDateString('en-IN')}
                </td>
                <td className="px-4 py-3 text-right">
                  <button
                    onClick={() => handleRemove(item._id)}
                    className="text-xs text-red-500 hover:underline"
                  >
                    Remove
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  )
}

export default function AdminPage() {
  const { user, loading } = useAuth()
  const router = useRouter()

  useEffect(() => {
    if (!loading && user?.role !== 'admin') router.replace('/dashboard')
  }, [user, loading, router])

  if (!user || user.role !== 'admin') return null

  return (
    <div className="space-y-6 max-w-5xl">
      <div className="page-header">
        <div>
          <h1 className="page-title">Admin</h1>
          <p className="page-sub">Manage users and email access control.</p>
        </div>
      </div>
      <UsersSection />
      <AllowedEmailsSection />
    </div>
  )
}
