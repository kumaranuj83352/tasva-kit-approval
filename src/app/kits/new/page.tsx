'use client'
import { useAuth } from '@/lib/AuthContext'
import KitForm from '@/components/KitForm'

export default function NewKitPage() {
  const { user } = useAuth()
  if (!user) return null

  if (user.role !== 'store') {
    return (
      <div className="card p-10 text-center">
        <p className="text-sm text-gray-500 dark:text-gray-400">You do not have permission to create kits.</p>
      </div>
    )
  }

  return (
    <div className="space-y-5">
      <div className="page-header">
        <div>
          <h1 className="page-title">New Kit Card</h1>
          <p className="page-sub">Fill in the style details and fabric entries below.</p>
        </div>
      </div>
      <KitForm />
    </div>
  )
}
