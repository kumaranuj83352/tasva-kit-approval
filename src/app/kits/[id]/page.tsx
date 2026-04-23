'use client'
import { useEffect, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import Link from 'next/link'
import { useAuth } from '@/lib/AuthContext'
import { apiGet, apiPost, apiDelete } from '@/lib/fetchClient'
import type { IKit, IApprovalStage } from '@/types'
import { STAGE_ROLE_MAP, STAGE_CHECK_MAP } from '@/types'

function StageIndicator({ stages, currentStage }: { stages: IApprovalStage[]; currentStage: number }) {
  return (
    <div className="flex items-center gap-0 overflow-x-auto pb-1">
      {stages.map((stage, i) => {
        const isActive = stage.stage === currentStage
        const isDone = stage.status === 'approved'
        const isRejected = stage.status === 'rejected'

        return (
          <div key={stage.stage} className="flex items-center">
            <div className="flex flex-col items-center min-w-[64px]">
              <div
                className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-semibold flex-shrink-0 ${
                  isDone
                    ? 'bg-green-500 text-white'
                    : isRejected
                    ? 'bg-red-500 text-white'
                    : isActive
                    ? 'bg-indigo-600 text-white ring-2 ring-indigo-300 dark:ring-indigo-800'
                    : 'bg-gray-200 dark:bg-gray-700 text-gray-400'
                }`}
              >
                {isDone ? '✓' : isRejected ? '✗' : stage.stage}
              </div>
              <span className="text-xs text-gray-400 dark:text-gray-500 mt-1 text-center leading-tight w-16 truncate">
                {stage.label.split(' ')[0]}
              </span>
            </div>
            {i < stages.length - 1 && (
              <div className={`h-px w-8 flex-shrink-0 mb-5 ${isDone ? 'bg-green-400' : 'bg-gray-200 dark:bg-gray-700'}`} />
            )}
          </div>
        )
      })}
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
  if (loading) return <div className="card p-8 text-center text-sm text-gray-500 dark:text-gray-400">Loading…</div>
  if (error || !kit) return <div className="card p-8 text-center text-sm text-red-500">{error || 'Not found'}</div>

  const currentStageData = kit.stages.find((s) => s.stage === kit.currentStage)
  const expectedRole = kit.currentStage ? STAGE_ROLE_MAP[kit.currentStage] : null
  const canApprove =
    kit.status === 'in_review' &&
    expectedRole &&
    user.role === expectedRole &&
    currentStageData?.status === 'pending'

  const canEdit = (user.role === 'store' || user.role === 'admin') && kit.status === 'draft'
  const canSubmit = (user.role === 'store' || user.role === 'admin') && kit.status === 'draft'
  const canDelete = user.role === 'admin'

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
    <div className="max-w-4xl space-y-6">
      {/* Kit header */}
      <div className="flex items-start justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 text-sm text-gray-500 dark:text-gray-400 mb-1">
            <Link href="/kits" className="hover:text-gray-700 dark:hover:text-gray-200">Kits</Link>
            <span>/</span>
            <span className="text-gray-900 dark:text-gray-100 font-medium">{kit.styleNo}</span>
          </div>
          <p className="text-xs text-gray-400">{kit.season} · {new Date(kit.date).toLocaleDateString('en-IN', { day: '2-digit', month: 'long', year: 'numeric' })}</p>
          <p className="text-xs text-gray-400">Created by {kit.createdByName}</p>
        </div>
        <div className="flex items-center gap-2 flex-shrink-0 flex-wrap justify-end">
          {canEdit && (
            <Link href={`/kits/${id}/edit`} className="btn-secondary text-xs">Edit</Link>
          )}
          {canSubmit && (
            <button onClick={handleSubmitForReview} disabled={submitting} className="btn-primary text-xs">
              {submitting ? 'Submitting…' : 'Submit for Review'}
            </button>
          )}
          <Link href={`/kits/${id}/print`} target="_blank" className="btn-secondary text-xs">Print</Link>
          {canDelete && (
            <button onClick={handleDelete} disabled={deleting} className="btn-danger text-xs">
              {deleting ? 'Deleting…' : 'Delete'}
            </button>
          )}
        </div>
      </div>

      {error && <p role="alert" className="text-sm text-red-600 dark:text-red-400">{error}</p>}

      {/* Approval stages */}
      {kit.status !== 'draft' && (
        <div className="card p-5 space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-sm font-semibold text-gray-900 dark:text-gray-100">Approval Progress</h2>
            <div className="flex items-center gap-2">
              {kit.status === 'approved' && <span className="badge-approved">Fully Approved</span>}
              {kit.status === 'rejected' && <span className="badge-rejected">Rejected</span>}
              {kit.status === 'in_review' && delay !== null && delay > 0 && (
                <span className="badge-delayed">Delayed {delay}d</span>
              )}
              {kit.status === 'in_review' && (delay === null || delay <= 0) && (
                <span className="badge-pending">In Review</span>
              )}
            </div>
          </div>

          <StageIndicator stages={kit.stages} currentStage={kit.currentStage} />

          {/* Current stage info */}
          {currentStageData && kit.status === 'in_review' && (
            <div className="rounded-lg bg-gray-50 dark:bg-gray-800/50 p-4 space-y-1">
              <p className="text-xs font-semibold text-gray-700 dark:text-gray-300 uppercase tracking-wide">
                {currentStageData.label} — Stage {kit.currentStage}
              </p>
              <p className="text-xs text-gray-500 dark:text-gray-400">
                Check: {STAGE_CHECK_MAP[kit.currentStage]}
              </p>
              {assignedAt && (
                <p className="text-xs text-gray-400">
                  Assigned {daysSinceAssigned} day{daysSinceAssigned !== 1 ? 's' : ''} ago
                  {delay !== null && delay > 0 && (
                    <span className="text-red-500 ml-1">· {delay}d overdue</span>
                  )}
                </p>
              )}
            </div>
          )}

          {/* Approve/Reject panel */}
          {canApprove && (
            <div className="border-t border-gray-100 dark:border-gray-800 pt-4 space-y-3">
              <p className="text-xs font-medium text-gray-700 dark:text-gray-300">Your action</p>
              <textarea
                className="input text-xs resize-none h-16"
                placeholder="Notes (optional)"
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                maxLength={500}
              />
              <div className="flex gap-2">
                <button
                  onClick={() => handleApprove('approved')}
                  disabled={approving}
                  className="btn-primary text-xs"
                >
                  {approving ? 'Processing…' : 'Approve'}
                </button>
                <button
                  onClick={() => handleApprove('rejected')}
                  disabled={approving}
                  className="btn-danger text-xs"
                >
                  Reject
                </button>
              </div>
            </div>
          )}

          {/* Stage history */}
          <div className="border-t border-gray-100 dark:border-gray-800 pt-4">
            <p className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide mb-2">History</p>
            <div className="space-y-2">
              {kit.stages.filter((s) => s.status !== 'pending' || s.stage <= kit.currentStage).map((stage) => (
                <div key={stage.stage} className="flex items-center gap-3 text-xs">
                  <span className={`w-4 h-4 rounded-full flex-shrink-0 flex items-center justify-center text-white text-xs ${
                    stage.status === 'approved' ? 'bg-green-500' :
                    stage.status === 'rejected' ? 'bg-red-500' :
                    stage.stage === kit.currentStage ? 'bg-indigo-600' : 'bg-gray-300 dark:bg-gray-600'
                  }`}>
                    {stage.status === 'approved' ? '✓' : stage.status === 'rejected' ? '✗' : ''}
                  </span>
                  <span className="font-medium text-gray-700 dark:text-gray-300 w-24 flex-shrink-0">{stage.label}</span>
                  <span className={`${
                    stage.status === 'approved' ? 'text-green-600 dark:text-green-400' :
                    stage.status === 'rejected' ? 'text-red-600 dark:text-red-400' :
                    stage.stage === kit.currentStage ? 'text-indigo-600 dark:text-indigo-400' :
                    'text-gray-400'
                  }`}>
                    {stage.status === 'approved'
                      ? `${stage.approverName} · ${new Date(stage.approvedAt!).toLocaleDateString('en-IN')}`
                      : stage.status === 'rejected'
                      ? `Rejected by ${stage.approverName}`
                      : stage.stage === kit.currentStage ? 'Waiting…' : 'Not started'}
                  </span>
                  {stage.notes && (
                    <span className="text-gray-400 italic truncate max-w-48">&ldquo;{stage.notes}&rdquo;</span>
                  )}
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Fabrics table */}
      <div className="card overflow-hidden">
        <div className="px-5 py-4 border-b border-gray-100 dark:border-gray-800">
          <h2 className="text-sm font-semibold text-gray-900 dark:text-gray-100">
            Fabrics ({kit.fabrics.length})
          </h2>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-gray-100 dark:border-gray-800">
                <th className="text-left px-4 py-3 text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wide">#</th>
                <th className="text-left px-4 py-3 text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wide">Fabric Name</th>
                <th className="text-left px-4 py-3 text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wide">Color</th>
                <th className="text-left px-4 py-3 text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wide">Usage</th>
                <th className="text-left px-4 py-3 text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wide">Lot</th>
                <th className="text-left px-4 py-3 text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wide">Qty</th>
                <th className="text-left px-4 py-3 text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wide">CW Width</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100 dark:divide-gray-800">
              {kit.fabrics.map((fabric, i) => (
                <tr key={i} className="hover:bg-gray-50 dark:hover:bg-gray-800/30">
                  <td className="px-4 py-3 text-gray-400">{i + 1}</td>
                  <td className="px-4 py-3 font-medium text-gray-900 dark:text-gray-100">{fabric.fabricName}</td>
                  <td className="px-4 py-3 text-gray-600 dark:text-gray-400">{fabric.color}</td>
                  <td className="px-4 py-3 text-gray-600 dark:text-gray-400">{fabric.usage}</td>
                  <td className="px-4 py-3 text-gray-600 dark:text-gray-400">{fabric.lot}</td>
                  <td className="px-4 py-3 text-gray-600 dark:text-gray-400">{fabric.qty}</td>
                  <td className="px-4 py-3 text-gray-600 dark:text-gray-400">{fabric.cwWidth}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}
