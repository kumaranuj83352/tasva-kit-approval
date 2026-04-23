'use client'
import { useEffect, useState } from 'react'
import { useParams } from 'next/navigation'
import { useAuth } from '@/lib/AuthContext'
import { apiGet, apiPut } from '@/lib/fetchClient'
import KitForm from '@/components/KitForm'
import type { IKit } from '@/types'

export default function EditKitPage() {
  const { id } = useParams<{ id: string }>()
  const { user } = useAuth()
  const [kit, setKit] = useState<IKit | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    apiGet<IKit>(`/api/kits/${id}`)
      .then(setKit)
      .catch(() => setError('Kit not found'))
      .finally(() => setLoading(false))
  }, [id])

  if (!user || (user.role !== 'store' && user.role !== 'admin')) {
    return <div className="card p-8 text-center text-sm text-gray-500 dark:text-gray-400">Access denied.</div>
  }
  if (loading) return <div className="card p-8 text-center text-sm text-gray-500 dark:text-gray-400">Loading…</div>
  if (error || !kit) return <div className="card p-8 text-center text-sm text-red-500">{error || 'Not found'}</div>
  if (kit.status !== 'draft') {
    return <div className="card p-8 text-center text-sm text-gray-500 dark:text-gray-400">Only draft kits can be edited.</div>
  }

  return (
    <div className="max-w-4xl space-y-4">
      <h1 className="text-lg font-semibold text-gray-900 dark:text-gray-100">Edit Kit — {kit.styleNo}</h1>
      <KitForm initial={kit} kitId={id} />
    </div>
  )
}
