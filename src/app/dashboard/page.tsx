'use client'
import { useEffect, useState } from 'react'
import Link from 'next/link'
import { useAuth } from '@/lib/AuthContext'
import { apiGet } from '@/lib/fetchClient'
import type { IKit } from '@/types'
import { ROLE_LABEL_MAP, STAGE_ROLE_MAP } from '@/types'

function KitStatusBadge({ kit }: { kit: IKit }) {
  if (kit.status === 'draft') return <span className="badge-draft">Draft</span>
  if (kit.status === 'approved') return <span className="badge-approved">Approved</span>
  if (kit.status === 'rejected') return <span className="badge-rejected">Rejected</span>
  const stage = kit.stages.find((s) => s.stage === kit.currentStage)
  if (!stage) return <span className="badge-pending">Pending</span>
  if (stage.assignedAt) {
    const days = Math.floor((Date.now() - new Date(stage.assignedAt).getTime()) / 86400000)
    const delay = days - 4
    if (delay >= 7) return <span className="badge-delayed">Escalated</span>
    if (delay >= 5) return <span className="badge-delayed">Warning</span>
    if (delay > 0) return <span className="badge-delayed">{delay}d late</span>
  }
  return <span className="badge-pending">{stage.label}</span>
}

function StatSkeleton() {
  return (
    <div className="card p-5 space-y-3">
      <div className="skeleton h-3 w-20 rounded" />
      <div className="skeleton h-8 w-12 rounded" />
    </div>
  )
}

function StatCard({ label, value, color, bgColor, icon }: {
  label: string; value: number; color: string; bgColor: string; icon: React.ReactNode
}) {
  return (
    <div className="card p-5">
      <div className="flex items-start justify-between mb-3">
        <div className={`w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0 ${bgColor}`}>
          {icon}
        </div>
      </div>
      <p className={`text-3xl font-bold tabular-nums tracking-tight ${color}`}>{value}</p>
      <p className="text-xs font-medium text-slate-500 dark:text-slate-400 mt-1">{label}</p>
    </div>
  )
}

export default function DashboardPage() {
  const { user } = useAuth()
  const [kits, setKits] = useState<IKit[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    apiGet<IKit[]>('/api/kits').then(setKits).catch(() => {}).finally(() => setLoading(false))
  }, [])

  if (!user) return null

  const stats = {
    total: kits.length,
    approved: kits.filter((k) => k.status === 'approved').length,
    pending: kits.filter((k) => k.status === 'in_review').length,
    delayed: kits.filter((k) => {
      if (k.status !== 'in_review') return false
      const s = k.stages.find((st) => st.stage === k.currentStage)
      if (!s?.assignedAt) return false
      return Math.floor((Date.now() - new Date(s.assignedAt).getTime()) / 86400000) > 4
    }).length,
  }

  const myStageNum = Object.entries(STAGE_ROLE_MAP).find(([, r]) => r === user.role)?.[0]
  const myPendingKits =
    user.role !== 'admin' && user.role !== 'store' && myStageNum
      ? kits.filter(
          (k) =>
            k.status === 'in_review' &&
            k.currentStage === Number(myStageNum) &&
            k.stages.find((s) => s.stage === Number(myStageNum))?.status === 'pending'
        )
      : []

  const recentKits = kits.slice(0, 8)

  return (
    <div className="space-y-6">
      {/* ── Header ──────────────────────── */}
      <div className="page-header">
        <div>
          <h1 className="page-title">
            {(() => {
              const h = new Date().getHours()
              return h < 12 ? 'Good morning' : h < 17 ? 'Good afternoon' : 'Good evening'
            })()}, {user.name.split(' ')[0]}
          </h1>
          <p className="page-sub">{ROLE_LABEL_MAP[user.role]} · {new Date().toLocaleDateString('en-IN', { weekday: 'long', day: 'numeric', month: 'long' })}</p>
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

      {/* ── Stats ─────────────────────── */}
      {loading ? (
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          {[...Array(4)].map((_, i) => <StatSkeleton key={i} />)}
        </div>
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          <StatCard label="Total Kits" value={stats.total}
            color="text-slate-700 dark:text-slate-200"
            bgColor="bg-slate-100 dark:bg-slate-800"
            icon={<svg className="w-4.5 h-4.5 text-slate-500 dark:text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.75}><path strokeLinecap="round" strokeLinejoin="round" d="M9 12h3.75M9 15h3.75M9 18h3.75m3 .75H18a2.25 2.25 0 002.25-2.25V6.108c0-1.135-.845-2.098-1.976-2.192a48.424 48.424 0 00-1.123-.08m-5.801 0c-.065.21-.1.433-.1.664 0 .414.336.75.75.75h4.5a.75.75 0 00.75-.75 2.25 2.25 0 00-.1-.664m-5.8 0A2.251 2.251 0 0113.5 2.25H15c1.012 0 1.867.668 2.15 1.586m-5.8 0c-.376.023-.75.05-1.124.08C9.095 4.01 8.25 4.973 8.25 6.108V8.25m0 0H4.875c-.621 0-1.125.504-1.125 1.125v11.25c0 .621.504 1.125 1.125 1.125h9.75c.621 0 1.125-.504 1.125-1.125V9.375c0-.621-.504-1.125-1.125-1.125H8.25z" /></svg>}
          />
          <StatCard label="In Review" value={stats.pending}
            color="text-amber-600 dark:text-amber-400"
            bgColor="bg-amber-50 dark:bg-amber-500/10"
            icon={<svg className="w-4.5 h-4.5 text-amber-500 dark:text-amber-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.75}><path strokeLinecap="round" strokeLinejoin="round" d="M12 6v6h4.5m4.5 0a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>}
          />
          <StatCard label="Approved" value={stats.approved}
            color="text-emerald-600 dark:text-emerald-400"
            bgColor="bg-emerald-50 dark:bg-emerald-500/10"
            icon={<svg className="w-4.5 h-4.5 text-emerald-500 dark:text-emerald-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.75}><path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>}
          />
          <StatCard label="Delayed" value={stats.delayed}
            color="text-red-600 dark:text-red-400"
            bgColor="bg-red-50 dark:bg-red-500/10"
            icon={<svg className="w-4.5 h-4.5 text-red-500 dark:text-red-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.75}><path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126zM12 15.75h.007v.008H12v-.008z" /></svg>}
          />
        </div>
      )}

      {/* ── My Pending Approvals ──────── */}
      {!loading && myPendingKits.length > 0 && (
        <div>
          <div className="flex items-center gap-2.5 mb-3">
            <div className="w-2 h-2 rounded-full bg-amber-400 animate-pulse" />
            <h2 className="text-sm font-bold text-slate-700 dark:text-slate-300">Awaiting your approval</h2>
            <span className="badge bg-amber-50 dark:bg-amber-500/10 text-amber-700 dark:text-amber-400 ring-1 ring-amber-200 dark:ring-amber-500/30">
              {myPendingKits.length}
            </span>
          </div>
          <div className="space-y-2">
            {myPendingKits.map((kit) => {
              const s = kit.stages.find((st) => st.stage === kit.currentStage)
              const days = s?.assignedAt ? Math.floor((Date.now() - new Date(s.assignedAt).getTime()) / 86400000) : 0
              const delay = days - 4
              return (
                <Link key={kit._id} href={`/kits/${kit._id}`}
                  className="card-hover flex items-center justify-between p-4 group">
                  <div className="min-w-0">
                    <p className="text-sm font-bold text-slate-900 dark:text-slate-100 group-hover:text-violet-700 dark:group-hover:text-violet-300 transition-colors truncate">{kit.styleNo}</p>
                    <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">{kit.season} · {kit.fabrics.length} fabric{kit.fabrics.length !== 1 ? 's' : ''}</p>
                  </div>
                  <div className="flex items-center gap-2.5 flex-shrink-0">
                    {delay > 0 && <span className="text-xs font-bold text-red-600 dark:text-red-400">{delay}d late</span>}
                    <KitStatusBadge kit={kit} />
                    <svg className="h-4 w-4 text-slate-300 dark:text-slate-600 group-hover:text-violet-500 transition-colors" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                    </svg>
                  </div>
                </Link>
              )
            })}
          </div>
        </div>
      )}

      {/* ── Recent kits ──────────────── */}
      {loading ? (
        <div className="card overflow-hidden">
          <div className="px-5 py-4 border-b border-slate-100 dark:border-white/[0.06]">
            <div className="skeleton h-4 w-28 rounded" />
          </div>
          <div className="divide-y divide-slate-100 dark:divide-white/[0.04]">
            {[...Array(5)].map((_, i) => (
              <div key={i} className="flex items-center gap-4 px-5 py-3.5">
                <div className="skeleton h-4 w-28 rounded" />
                <div className="skeleton h-4 w-16 rounded hidden sm:block" />
                <div className="ml-auto skeleton h-5 w-16 rounded-full" />
              </div>
            ))}
          </div>
        </div>
      ) : kits.length === 0 ? (
        <div className="card p-14 text-center">
          <div className="w-14 h-14 rounded-2xl bg-slate-100 dark:bg-slate-800 flex items-center justify-center mx-auto mb-4">
            <svg className="w-7 h-7 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M9 12h3.75M9 15h3.75M9 18h3.75m3 .75H18a2.25 2.25 0 002.25-2.25V6.108c0-1.135-.845-2.098-1.976-2.192a48.424 48.424 0 00-1.123-.08m-5.801 0c-.065.21-.1.433-.1.664 0 .414.336.75.75.75h4.5a.75.75 0 00.75-.75 2.25 2.25 0 00-.1-.664m-5.8 0A2.251 2.251 0 0113.5 2.25H15c1.012 0 1.867.668 2.15 1.586m-5.8 0c-.376.023-.75.05-1.124.08C9.095 4.01 8.25 4.973 8.25 6.108V8.25m0 0H4.875c-.621 0-1.125.504-1.125 1.125v11.25c0 .621.504 1.125 1.125 1.125h9.75c.621 0 1.125-.504 1.125-1.125V9.375c0-.621-.504-1.125-1.125-1.125H8.25z" />
            </svg>
          </div>
          <p className="text-sm font-bold text-slate-700 dark:text-slate-300">No kits yet</p>
          <p className="text-xs text-slate-400 mt-1 mb-5">Kits created by the store team will appear here.</p>
          {(user.role === 'store' || user.role === 'admin') && (
            <Link href="/kits/new" className="btn-primary inline-flex">
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}><path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" /></svg>
              Create first kit
            </Link>
          )}
        </div>
      ) : (
        <div>
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-sm font-bold text-slate-700 dark:text-slate-300">Recent kits</h2>
            <Link href="/kits" className="text-xs text-violet-600 dark:text-violet-400 hover:text-violet-700 dark:hover:text-violet-300 font-semibold transition-colors">
              View all →
            </Link>
          </div>
          <div className="card overflow-hidden">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-slate-100 dark:border-white/[0.06] bg-slate-50/60 dark:bg-white/[0.02]">
                  <th className="text-left px-5 py-3 text-[11px] font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wide">Style</th>
                  <th className="text-left px-5 py-3 text-[11px] font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wide hidden sm:table-cell">Season</th>
                  <th className="text-left px-5 py-3 text-[11px] font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wide hidden md:table-cell">Stage</th>
                  <th className="text-left px-5 py-3 text-[11px] font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wide">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-white/[0.04]">
                {recentKits.map((kit) => (
                  <tr key={kit._id} className="table-row-hover group">
                    <td className="px-5 py-3.5">
                      <Link href={`/kits/${kit._id}`} className="font-semibold text-slate-900 dark:text-slate-100 group-hover:text-violet-600 dark:group-hover:text-violet-400 transition-colors">
                        {kit.styleNo}
                      </Link>
                      <p className="text-xs text-slate-400 sm:hidden mt-0.5">{kit.season}</p>
                    </td>
                    <td className="px-5 py-3.5 text-slate-500 dark:text-slate-400 hidden sm:table-cell">{kit.season}</td>
                    <td className="px-5 py-3.5 text-slate-400 dark:text-slate-500 hidden md:table-cell text-xs">
                      {kit.status === 'in_review' ? kit.stages.find((s) => s.stage === kit.currentStage)?.label ?? '—' : '—'}
                    </td>
                    <td className="px-5 py-3.5"><KitStatusBadge kit={kit} /></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  )
}
