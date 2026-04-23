'use client'
import { useEffect, useState } from 'react'
import Link from 'next/link'
import { useAuth } from '@/lib/AuthContext'
import { apiGet } from '@/lib/fetchClient'
import type { IKit } from '@/types'
import { STAGE_ROLE_MAP } from '@/types'

function KitRow({ kit }: { kit: IKit }) {
  const currentStage = kit.stages.find((s) => s.stage === kit.currentStage)
  const assignedAt = currentStage?.assignedAt
  const days = assignedAt
    ? Math.floor((Date.now() - new Date(assignedAt).getTime()) / 86400000)
    : null
  const delay = days !== null ? days - 4 : null

  function getStatusBadge() {
    if (kit.status === 'draft') return <span className="badge-draft">Draft</span>
    if (kit.status === 'approved') return <span className="badge-approved">Approved</span>
    if (kit.status === 'rejected') return <span className="badge-rejected">Rejected</span>
    if (delay !== null && delay >= 5) return <span className="badge-delayed">Warn: {delay}d</span>
    if (delay !== null && delay > 0) return <span className="badge-delayed">Late {delay}d</span>
    return <span className="badge-pending">{currentStage?.label ?? 'Review'}</span>
  }

  return (
    <tr className="table-row-hover group">
      <td className="px-5 py-3.5">
        <Link href={`/kits/${kit._id}`} className="font-semibold text-slate-900 dark:text-slate-100 group-hover:text-violet-600 dark:group-hover:text-violet-400 transition-colors">
          {kit.styleNo}
        </Link>
      </td>
      <td className="px-5 py-3.5 text-slate-500 dark:text-slate-400 hidden sm:table-cell">{kit.season}</td>
      <td className="px-5 py-3.5 text-slate-500 dark:text-slate-400 hidden md:table-cell text-xs">
        {new Date(kit.date).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })}
      </td>
      <td className="px-5 py-3.5 text-slate-500 dark:text-slate-400 hidden lg:table-cell">{kit.fabrics.length}</td>
      <td className="px-5 py-3.5 text-xs text-slate-400 dark:text-slate-500 hidden md:table-cell">
        {kit.status === 'in_review' ? currentStage?.label ?? '—' : '—'}
      </td>
      <td className="px-5 py-3.5">{getStatusBadge()}</td>
      <td className="px-5 py-3.5 text-right">
        <Link href={`/kits/${kit._id}`} className="text-xs font-semibold text-violet-600 dark:text-violet-400 hover:text-violet-700 dark:hover:text-violet-300 transition-colors">
          View →
        </Link>
      </td>
    </tr>
  )
}

export default function KitsPage() {
  const { user } = useAuth()
  const [kits, setKits] = useState<IKit[]>([])
  const [loading, setLoading] = useState(true)
  const [filter, setFilter] = useState<'all' | 'draft' | 'in_review' | 'approved' | 'rejected'>('all')

  useEffect(() => {
    apiGet<IKit[]>('/api/kits')
      .then(setKits)
      .catch(() => {})
      .finally(() => setLoading(false))
  }, [])

  if (!user) return null

  const myStageNum = Object.entries(STAGE_ROLE_MAP).find(([, r]) => r === user.role)?.[0]

  const filtered = kits.filter((k) => {
    if (filter !== 'all' && k.status !== filter) return false
    return true
  })

  const myPendingCount = user.role !== 'admin' && user.role !== 'store' && myStageNum
    ? kits.filter(
        (k) =>
          k.status === 'in_review' &&
          k.currentStage === Number(myStageNum) &&
          k.stages.find((s) => s.stage === Number(myStageNum))?.status === 'pending'
      ).length
    : 0

  return (
    <div className="space-y-5">
      <div className="page-header">
        <div>
          <h1 className="page-title">Kit Cards</h1>
          {myPendingCount > 0 && (
            <p className="text-sm text-amber-600 dark:text-amber-400 font-semibold mt-0.5 flex items-center gap-1.5">
              <span className="w-1.5 h-1.5 rounded-full bg-amber-400 animate-pulse inline-block" />
              {myPendingCount} kit{myPendingCount !== 1 ? 's' : ''} awaiting your approval
            </p>
          )}
        </div>
        {(user.role === 'store' || user.role === 'admin') && (
          <Link href="/kits/new" className="btn-primary">
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
            </svg>
            New Kit
          </Link>
        )}
      </div>

      {/* Filter tabs */}
      <div className="flex gap-1.5 flex-wrap">
        {(['all', 'draft', 'in_review', 'approved', 'rejected'] as const).map((f) => {
          const count = f === 'all' ? kits.length : kits.filter(k => k.status === f).length
          const isActive = filter === f
          return (
            <button
              key={f}
              onClick={() => setFilter(f)}
              className={`px-3.5 py-1.5 rounded-lg text-xs font-semibold transition-all duration-150 ${
                isActive
                  ? 'bg-violet-600 text-white shadow-sm shadow-violet-600/30'
                  : 'text-slate-500 dark:text-slate-400 bg-white dark:bg-white/[0.04] ring-1 ring-slate-200 dark:ring-white/[0.06] hover:ring-violet-200 dark:hover:ring-violet-500/30 hover:text-slate-700 dark:hover:text-slate-200'
              }`}
            >
              {f === 'all' ? 'All' : f === 'in_review' ? 'In Review' : f.charAt(0).toUpperCase() + f.slice(1)}
              <span className={`ml-1.5 ${isActive ? 'text-white/70' : 'text-slate-400 dark:text-slate-500'}`}>
                {count}
              </span>
            </button>
          )
        })}
      </div>

      {loading ? (
        <div className="card overflow-hidden">
          <div className="divide-y divide-slate-100 dark:divide-white/[0.04]">
            {[...Array(5)].map((_, i) => (
              <div key={i} className="flex items-center gap-4 px-5 py-4">
                <div className="skeleton h-4 w-28 rounded" />
                <div className="skeleton h-4 w-16 rounded hidden sm:block" />
                <div className="skeleton h-4 w-20 rounded hidden md:block" />
                <div className="ml-auto skeleton h-5 w-16 rounded-full" />
              </div>
            ))}
          </div>
        </div>
      ) : filtered.length === 0 ? (
        <div className="card p-12 text-center">
          <div className="w-12 h-12 rounded-2xl bg-slate-100 dark:bg-slate-800 flex items-center justify-center mx-auto mb-4">
            <svg className="w-6 h-6 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-5.197-5.197m0 0A7.5 7.5 0 105.196 5.196a7.5 7.5 0 0010.607 10.607z" />
            </svg>
          </div>
          <p className="text-sm font-bold text-slate-700 dark:text-slate-300">No kits found</p>
          <p className="text-xs text-slate-400 mt-1">Try a different filter.</p>
        </div>
      ) : (
        <div className="card overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-slate-100 dark:border-white/[0.06] bg-slate-50/60 dark:bg-white/[0.02]">
                  <th className="text-left px-5 py-3 text-[11px] font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wide">Style No</th>
                  <th className="text-left px-5 py-3 text-[11px] font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wide hidden sm:table-cell">Season</th>
                  <th className="text-left px-5 py-3 text-[11px] font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wide hidden md:table-cell">Date</th>
                  <th className="text-left px-5 py-3 text-[11px] font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wide hidden lg:table-cell">Fabrics</th>
                  <th className="text-left px-5 py-3 text-[11px] font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wide hidden md:table-cell">Stage</th>
                  <th className="text-left px-5 py-3 text-[11px] font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wide">Status</th>
                  <th />
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-white/[0.04]">
                {filtered.map((kit) => <KitRow key={kit._id} kit={kit} />)}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  )
}
