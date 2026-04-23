'use client'
import { useEffect, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import Link from 'next/link'
import { useAuth } from '@/lib/AuthContext'
import { apiGet, apiPost, apiDelete } from '@/lib/fetchClient'
import type { IKit, IApprovalStage } from '@/types'
import { STAGE_ROLE_MAP, STAGE_CHECK_MAP } from '@/types'

function ApprovalProgress({ stages, currentStage, kitStatus }: {
  stages: IApprovalStage[]
  currentStage: number
  kitStatus: string
}) {
  const completedCount = stages.filter(s => s.status === 'approved').length
  const trackFillPercent = stages.length > 1 && completedCount > 0
    ? Math.min((completedCount / (stages.length - 1)) * 100, 100)
    : 0

  return (
    <div className="overflow-x-auto -mx-1 px-1">
      <div className="relative min-w-[480px] pb-2 pt-1">
        {/* Track wrapper (between first and last circle centers) */}
        <div
          className="absolute top-[20px] h-0.5 rounded-full overflow-hidden"
          style={{ left: `${100 / (2 * stages.length)}%`, right: `${100 / (2 * stages.length)}%` }}
        >
          <div className="absolute inset-0 bg-slate-200 dark:bg-slate-700/60" />
          <div
            className="absolute inset-y-0 left-0 bg-gradient-to-r from-violet-500 to-emerald-400 transition-all duration-700"
            style={{ width: `${trackFillPercent}%` }}
          />
        </div>

        {/* Stage circles */}
        <div className="relative flex justify-between">
          {stages.map((stage) => {
            const isDone = stage.status === 'approved'
            const isRejected = stage.status === 'rejected'
            const isActive = stage.stage === currentStage && kitStatus === 'in_review'

            return (
              <div key={stage.stage} className="flex flex-col items-center gap-2.5" style={{ width: `${100 / stages.length}%` }}>
                <div className={`
                  relative w-10 h-10 rounded-full flex items-center justify-center
                  text-sm font-bold z-10 transition-all duration-300
                  ${isDone
                    ? 'bg-emerald-500 text-white shadow-lg shadow-emerald-500/30'
                    : isRejected
                    ? 'bg-red-500 text-white shadow-lg shadow-red-500/30'
                    : isActive
                    ? 'bg-violet-600 text-white shadow-lg shadow-violet-600/35'
                    : 'bg-white dark:bg-[#0f1628] text-slate-400 dark:text-slate-500 ring-2 ring-slate-200 dark:ring-slate-700'
                  }
                `}>
                  {isActive && (
                    <span className="absolute inset-0 rounded-full ring-4 ring-violet-500/20 animate-pulse" />
                  )}
                  {isDone ? (
                    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" />
                    </svg>
                  ) : isRejected ? (
                    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  ) : (
                    stage.stage
                  )}
                </div>
                <span className={`text-[11px] font-semibold text-center leading-tight ${
                  isDone ? 'text-emerald-600 dark:text-emerald-400'
                    : isActive ? 'text-violet-600 dark:text-violet-400'
                    : isRejected ? 'text-red-500 dark:text-red-400'
                    : 'text-slate-400 dark:text-slate-500'
                }`}>
                  {stage.label.split(' ')[0]}
                </span>
              </div>
            )
          })}
        </div>
      </div>
    </div>
  )
}

export default function KitDetailPage() {
  const { id } = useParams<{ id: string }>()
  const { user } = useAuth()
  const router = useRouter()
  const [kit, setKit] = useState<IKit | null>(null)
  const [loading, setLoading] = useState(true)
  const [approving, setApproving] = useState(false)
  const [notes, setNotes] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [deleting, setDeleting] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    apiGet<IKit>(`/api/kits/${id}`)
      .then(setKit)
      .catch(() => setError('Kit not found'))
      .finally(() => setLoading(false))
  }, [id])

  if (!user) return null
  if (loading) return (
    <div className="max-w-4xl space-y-4 animate-pulse">
      <div className="skeleton h-4 w-48 rounded" />
      <div className="skeleton h-8 w-72 rounded-lg" />
      <div className="card p-6 space-y-4">
        <div className="skeleton h-4 w-32 rounded" />
        <div className="flex justify-between">
          {[...Array(6)].map((_, i) => <div key={i} className="skeleton w-10 h-10 rounded-full" />)}
        </div>
      </div>
    </div>
  )
  if (error || !kit) return (
    <div className="card p-10 text-center max-w-md mx-auto">
      <p className="text-sm font-medium text-red-600 dark:text-red-400">{error || 'Kit not found'}</p>
      <Link href="/kits" className="btn-secondary mt-4 inline-flex">← Back to Kits</Link>
    </div>
  )

  const currentStageData = kit.stages.find((s) => s.stage === kit.currentStage)
  const expectedRole = kit.currentStage ? STAGE_ROLE_MAP[kit.currentStage] : null
  const canApprove =
    kit.status === 'in_review' &&
    expectedRole &&
    user.role === expectedRole &&
    currentStageData?.status === 'pending'

  const canEdit = (user.role === 'store' || user.role === 'admin') && kit.status === 'draft'
  const canSubmit = (user.role === 'store' || user.role === 'admin') && kit.status === 'draft'
  const canDelete = user.role === 'store' && kit.status === 'draft' && kit.createdBy?.toString() === user.id

  async function handleApprove(action: 'approved' | 'rejected') {
    setApproving(true)
    setError('')
    try {
      const updated = await apiPost<IKit>(`/api/kits/${id}/approve`, { action, notes })
      setKit(updated)
      setNotes('')
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Action failed')
    } finally {
      setApproving(false)
    }
  }

  async function handleSubmitForReview() {
    setSubmitting(true)
    setError('')
    try {
      const updated = await apiPost<IKit>(`/api/kits/${id}/submit`, {})
      setKit(updated)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Submit failed')
    } finally {
      setSubmitting(false)
    }
  }

  async function handleDelete() {
    if (!confirm('Delete this kit permanently?')) return
    setDeleting(true)
    try {
      await apiDelete(`/api/kits/${id}`)
      router.replace('/kits')
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Delete failed')
      setDeleting(false)
    }
  }

  const assignedAt = currentStageData?.assignedAt
  const daysSinceAssigned = assignedAt
    ? Math.floor((Date.now() - new Date(assignedAt).getTime()) / 86400000)
    : null
  const delay = daysSinceAssigned !== null ? daysSinceAssigned - 4 : null

  return (
    <div className="max-w-4xl space-y-5">
      {/* ── Breadcrumb + header ───────────────── */}
      <div className="flex items-start justify-between gap-4 flex-wrap">
        <div className="space-y-1.5">
          <nav className="flex items-center gap-1.5 text-sm text-slate-400 dark:text-slate-500">
            <Link href="/kits" className="hover:text-violet-600 dark:hover:text-violet-400 transition-colors font-medium">
              Kits
            </Link>
            <svg className="w-3.5 h-3.5 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
            </svg>
            <span className="text-slate-600 dark:text-slate-300 font-semibold">{kit.styleNo}</span>
          </nav>
          <div className="flex items-center gap-3 flex-wrap">
            <h1 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-white">{kit.styleNo}</h1>
            {kit.status === 'approved' && <span className="badge-approved">Fully Approved</span>}
            {kit.status === 'rejected' && <span className="badge-rejected">Rejected</span>}
            {kit.status === 'draft' && <span className="badge-draft">Draft</span>}
            {kit.status === 'in_review' && delay !== null && delay > 0
              ? <span className="badge-delayed">Delayed {delay}d</span>
              : kit.status === 'in_review' && <span className="badge-pending">In Review</span>}
          </div>
          <div className="flex items-center gap-3 text-xs text-slate-400 dark:text-slate-500">
            <span>{kit.season}</span>
            <span className="w-1 h-1 rounded-full bg-slate-300 dark:bg-slate-600" />
            <span>{new Date(kit.date).toLocaleDateString('en-IN', { day: '2-digit', month: 'long', year: 'numeric' })}</span>
            <span className="w-1 h-1 rounded-full bg-slate-300 dark:bg-slate-600" />
            <span>by {kit.createdByName}</span>
          </div>
        </div>

        <div className="flex items-center gap-2 flex-shrink-0 flex-wrap">
          {canEdit && (
            <Link href={`/kits/${id}/edit`} className="btn-secondary text-xs">
              <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M16.862 4.487l1.687-1.688a1.875 1.875 0 112.652 2.652L10.582 16.07a4.5 4.5 0 01-1.897 1.13L6 18l.8-2.685a4.5 4.5 0 011.13-1.897l8.932-8.931z" />
              </svg>
              Edit
            </Link>
          )}
          {canSubmit && (
            <button onClick={handleSubmitForReview} disabled={submitting} className="btn-primary text-xs">
              {submitting ? <><span className="spinner" /> Submitting…</> : <>
                <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M6 12L3.269 3.126A59.768 59.768 0 0121.485 12 59.77 59.77 0 013.27 20.876L5.999 12zm0 0h7.5" />
                </svg>
                Submit for Review
              </>}
            </button>
          )}
          <Link href={`/kits/${id}/print`} target="_blank" className="btn-secondary text-xs">
            <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M6.72 13.829c-.24.03-.48.062-.72.096m.72-.096a42.415 42.415 0 0110.56 0m-10.56 0L6.34 18m10.94-4.171c.24.03.48.062.72.096m-.72-.096L17.66 18m0 0l.229 2.523a1.125 1.125 0 01-1.12 1.227H7.231c-.662 0-1.18-.568-1.12-1.227L6.34 18m11.318 0h1.091A2.25 2.25 0 0021 15.75V9.456c0-1.081-.768-2.015-1.837-2.175a48.055 48.055 0 00-1.913-.247M6.34 18H5.25A2.25 2.25 0 013 15.75V9.456c0-1.081.768-2.015 1.837-2.175a48.041 48.041 0 011.913-.247m10.5 0a48.536 48.536 0 00-10.5 0m10.5 0V3.375c0-.621-.504-1.125-1.125-1.125h-8.25c-.621 0-1.125.504-1.125 1.125v3.659M18 10.5h.008v.008H18V10.5zm-3 0h.008v.008H15V10.5z" />
            </svg>
            Print
          </Link>
          {canDelete && (
            <button onClick={handleDelete} disabled={deleting} className="btn-danger text-xs">
              {deleting ? <span className="spinner" /> : (
                <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M14.74 9l-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 01-2.244 2.077H8.084a2.25 2.25 0 01-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 00-3.478-.397m-12 .562c.34-.059.68-.114 1.022-.165m0 0a48.11 48.11 0 013.478-.397m7.5 0v-.916c0-1.18-.91-2.164-2.09-2.201a51.964 51.964 0 00-3.32 0c-1.18.037-2.09 1.022-2.09 2.201v.916m7.5 0a48.667 48.667 0 00-7.5 0" />
                </svg>
              )}
              Delete
            </button>
          )}
        </div>
      </div>

      {error && (
        <div className="flex items-center gap-2.5 rounded-xl bg-red-50 dark:bg-red-500/10 px-4 py-3 text-sm text-red-700 dark:text-red-400 ring-1 ring-red-200 dark:ring-red-500/30">
          <svg className="w-4 h-4 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126zM12 15.75h.007v.008H12v-.008z" />
          </svg>
          {error}
        </div>
      )}

      {/* ── Approval progress card ───────────────── */}
      {kit.status !== 'draft' && (
        <div className="card p-5 space-y-5">
          <div className="flex items-center justify-between">
            <h2 className="text-sm font-bold text-slate-800 dark:text-slate-100">Approval Progress</h2>
            <span className="text-xs text-slate-400 dark:text-slate-500">
              {kit.stages.filter(s => s.status === 'approved').length} of {kit.stages.length} stages complete
            </span>
          </div>

          <ApprovalProgress stages={kit.stages} currentStage={kit.currentStage} kitStatus={kit.status} />

          {/* Current stage info */}
          {currentStageData && kit.status === 'in_review' && (
            <div className="rounded-xl bg-violet-50 dark:bg-violet-500/[0.07] ring-1 ring-violet-200 dark:ring-violet-500/20 p-4 space-y-1.5">
              <div className="flex items-center gap-2">
                <span className="w-5 h-5 rounded-full bg-violet-600 flex items-center justify-center text-white text-[10px] font-bold flex-shrink-0">
                  {kit.currentStage}
                </span>
                <p className="text-xs font-bold text-violet-800 dark:text-violet-300 uppercase tracking-wide">
                  {currentStageData.label}
                </p>
              </div>
              <p className="text-xs text-violet-700/70 dark:text-violet-300/70 pl-7">
                Check: {STAGE_CHECK_MAP[kit.currentStage]}
              </p>
              {assignedAt && (
                <p className="text-xs text-violet-600/60 dark:text-violet-400/60 pl-7">
                  Assigned {daysSinceAssigned}d ago
                  {delay !== null && delay > 0 && (
                    <span className="ml-1.5 text-red-600 dark:text-red-400 font-semibold">· {delay}d overdue</span>
                  )}
                </p>
              )}
            </div>
          )}

          {/* Approve / Reject panel */}
          {canApprove && (
            <div className="border-t border-slate-100 dark:border-white/[0.06] pt-4 space-y-3">
              <p className="text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wide">Your Action</p>
              <textarea
                className="input resize-none h-20 text-sm"
                placeholder="Add notes (optional) — visible to all reviewers"
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                maxLength={500}
              />
              <div className="flex gap-2">
                <button
                  onClick={() => handleApprove('approved')}
                  disabled={approving}
                  className="btn-primary text-sm"
                >
                  {approving ? <><span className="spinner" /> Processing…</> : <>
                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" />
                    </svg>
                    Approve
                  </>}
                </button>
                <button
                  onClick={() => handleApprove('rejected')}
                  disabled={approving}
                  className="btn-danger text-sm"
                >
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                  </svg>
                  Reject
                </button>
              </div>
            </div>
          )}

          {/* History timeline */}
          <div className="border-t border-slate-100 dark:border-white/[0.06] pt-4 space-y-1">
            <p className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wide mb-3">History</p>
            <div className="space-y-0">
              {kit.stages.filter(s => s.status !== 'pending' || s.stage <= kit.currentStage).map((stage, idx, arr) => (
                <div key={stage.stage} className="flex gap-3 pb-3">
                  {/* Timeline indicator */}
                  <div className="flex flex-col items-center flex-shrink-0">
                    <div className={`w-7 h-7 rounded-full flex items-center justify-center text-white text-xs font-bold flex-shrink-0 ${
                      stage.status === 'approved' ? 'bg-emerald-500'
                        : stage.status === 'rejected' ? 'bg-red-500'
                        : stage.stage === kit.currentStage ? 'bg-violet-600'
                        : 'bg-slate-200 dark:bg-slate-700'
                    }`}>
                      {stage.status === 'approved' ? (
                        <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                          <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" />
                        </svg>
                      ) : stage.status === 'rejected' ? (
                        <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                          <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                        </svg>
                      ) : (
                        <span className="text-slate-500 dark:text-slate-400">{stage.stage}</span>
                      )}
                    </div>
                    {idx < arr.length - 1 && (
                      <div className="w-px flex-1 mt-1 bg-slate-100 dark:bg-slate-800 min-h-[12px]" />
                    )}
                  </div>
                  {/* Content */}
                  <div className="pb-1 min-w-0">
                    <p className={`text-xs font-semibold leading-none ${
                      stage.status === 'approved' ? 'text-emerald-700 dark:text-emerald-400'
                        : stage.status === 'rejected' ? 'text-red-600 dark:text-red-400'
                        : stage.stage === kit.currentStage ? 'text-violet-700 dark:text-violet-400'
                        : 'text-slate-400 dark:text-slate-500'
                    }`}>
                      {stage.label}
                    </p>
                    <p className="text-[11px] text-slate-400 mt-0.5">
                      {stage.status === 'approved'
                        ? `${stage.approverName} · ${new Date(stage.approvedAt!).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })}`
                        : stage.status === 'rejected'
                        ? `Rejected by ${stage.approverName}`
                        : stage.stage === kit.currentStage ? 'Waiting for review…'
                        : 'Not started'}
                    </p>
                    {stage.notes && (
                      <p className="text-[11px] text-slate-400 dark:text-slate-500 italic mt-0.5 truncate max-w-xs">&ldquo;{stage.notes}&rdquo;</p>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* ── Fabrics table ───────────────── */}
      <div className="card overflow-hidden">
        <div className="px-5 py-4 border-b border-slate-100 dark:border-white/[0.06]">
          <h2 className="text-sm font-bold text-slate-800 dark:text-slate-100">
            Fabrics <span className="text-slate-400 font-normal">({kit.fabrics.length})</span>
          </h2>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-slate-100 dark:border-white/[0.06] bg-slate-50/60 dark:bg-white/[0.02]">
                <th className="text-left px-4 py-3 text-[11px] font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wide w-10">#</th>
                <th className="text-left px-4 py-3 text-[11px] font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wide">Fabric Name</th>
                <th className="text-left px-4 py-3 text-[11px] font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wide">Color</th>
                <th className="text-left px-4 py-3 text-[11px] font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wide hidden sm:table-cell">Usage</th>
                <th className="text-left px-4 py-3 text-[11px] font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wide hidden md:table-cell">Lot</th>
                <th className="text-left px-4 py-3 text-[11px] font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wide hidden md:table-cell">Qty</th>
                <th className="text-left px-4 py-3 text-[11px] font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wide hidden lg:table-cell">CW Width</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-white/[0.04]">
              {kit.fabrics.map((fabric, i) => (
                <tr key={i} className="hover:bg-slate-50/80 dark:hover:bg-white/[0.02] transition-colors">
                  <td className="px-4 py-3.5 text-slate-400 text-xs font-medium">{i + 1}</td>
                  <td className="px-4 py-3.5 font-semibold text-slate-900 dark:text-slate-100">{fabric.fabricName}</td>
                  <td className="px-4 py-3.5 text-slate-500 dark:text-slate-400">{fabric.color}</td>
                  <td className="px-4 py-3.5 text-slate-500 dark:text-slate-400 hidden sm:table-cell">{fabric.usage}</td>
                  <td className="px-4 py-3.5 text-slate-500 dark:text-slate-400 hidden md:table-cell font-mono text-xs">{fabric.lot}</td>
                  <td className="px-4 py-3.5 text-slate-500 dark:text-slate-400 hidden md:table-cell">{fabric.qty}</td>
                  <td className="px-4 py-3.5 text-slate-500 dark:text-slate-400 hidden lg:table-cell">{fabric.cwWidth}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}
