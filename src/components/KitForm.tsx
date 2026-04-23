'use client'
import { useState, FormEvent } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/lib/AuthContext'
import { apiPost, apiPut } from '@/lib/fetchClient'
import type { IFabric, IKit } from '@/types'

interface KitFormProps {
  initial?: IKit
  kitId?: string
}

const EMPTY_FABRIC: IFabric = {
  fabricName: '', color: '', usage: '', lot: '', qty: '', cwWidth: '',
}

const USAGE_OPTIONS = ['Main', 'Collar', 'Lining', 'Facing', 'Interlining', 'Contrast', 'Pocket', 'Placket']

export default function KitForm({ initial, kitId }: KitFormProps) {
  const { user } = useAuth()
  const router = useRouter()
  const [styleNo, setStyleNo] = useState(initial?.styleNo ?? '')
  const [season, setSeason] = useState(initial?.season ?? '')
  const [date, setDate] = useState(
    initial?.date
      ? new Date(initial.date).toISOString().split('T')[0]
      : new Date().toISOString().split('T')[0]
  )
  const [fabrics, setFabrics] = useState<IFabric[]>(initial?.fabrics ?? [{ ...EMPTY_FABRIC }])
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  if (!user || (user.role !== 'store' && user.role !== 'admin')) return null

  function updateFabric(index: number, field: keyof IFabric, value: string) {
    setFabrics((prev) => prev.map((f, i) => (i === index ? { ...f, [field]: value } : f)))
  }

  function addFabric() {
    setFabrics((prev) => [...prev, { ...EMPTY_FABRIC }])
  }

  function removeFabric(index: number) {
    if (fabrics.length === 1) return
    setFabrics((prev) => prev.filter((_, i) => i !== index))
  }

  async function handleSubmit(e: FormEvent) {
    e.preventDefault()
    setError('')

    const hasEmpty = fabrics.some((f) =>
      !f.fabricName || !f.color || !f.usage || !f.lot || !f.qty || !f.cwWidth
    )
    if (hasEmpty) {
      setError('Please fill all fields in each fabric row.')
      return
    }

    setLoading(true)
    try {
      const payload = { styleNo, season, date, fabrics }
      const kit = kitId
        ? await apiPut<IKit>(`/api/kits/${kitId}`, payload)
        : await apiPost<IKit>('/api/kits', payload)
      router.push(`/kits/${kit._id}`)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to save kit')
    } finally {
      setLoading(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6 max-w-4xl">
      {/* Header fields */}
      <div className="card p-6 space-y-4">
        <h2 className="text-xs font-bold uppercase tracking-widest text-slate-500 dark:text-slate-400">Kit Details</h2>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div>
            <label className="label">Style No</label>
            <input
              type="text"
              required
              className="input"
              value={styleNo}
              onChange={(e) => setStyleNo(e.target.value.toUpperCase())}
              placeholder="e.g. TMS40308LRL"
            />
          </div>
          <div>
            <label className="label">Season</label>
            <input
              type="text"
              required
              className="input"
              value={season}
              onChange={(e) => setSeason(e.target.value)}
              placeholder="e.g. SS26"
            />
          </div>
          <div>
            <label className="label">Date</label>
            <input
              type="date"
              required
              className="input"
              value={date}
              onChange={(e) => setDate(e.target.value)}
            />
          </div>
        </div>
      </div>

      {/* Fabric rows */}
      <div className="card p-6 space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-xs font-bold uppercase tracking-widest text-slate-500 dark:text-slate-400">
            Fabrics ({fabrics.length})
          </h2>
          <button type="button" onClick={addFabric} className="btn-secondary text-xs px-3 py-1.5">
            + Add Fabric
          </button>
        </div>

        <div className="space-y-4">
          {fabrics.map((fabric, i) => (
            <div key={i} className="relative rounded-xl border border-slate-200 dark:border-slate-700/60 bg-slate-50/50 dark:bg-slate-800/30 p-4">
              <div className="flex items-center justify-between mb-3">
                <span className="text-[11px] font-bold uppercase tracking-widest text-slate-400 dark:text-slate-500">
                  Fabric {i + 1}
                </span>
                {fabrics.length > 1 && (
                  <button
                    type="button"
                    onClick={() => removeFabric(i)}
                    className="text-xs font-medium text-red-500 hover:text-red-700 dark:hover:text-red-400 transition-colors"
                    aria-label={`Remove fabric ${i + 1}`}
                  >
                    Remove
                  </button>
                )}
              </div>
              <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
                <div className="lg:col-span-1">
                  <label className="label text-xs">Fabric Name</label>
                  <input
                    type="text"
                    className="input text-xs"
                    value={fabric.fabricName}
                    onChange={(e) => updateFabric(i, 'fabricName', e.target.value)}
                    placeholder="e.g. Nike Corr"
                  />
                </div>
                <div>
                  <label className="label text-xs">Color</label>
                  <input
                    type="text"
                    className="input text-xs"
                    value={fabric.color}
                    onChange={(e) => updateFabric(i, 'color', e.target.value)}
                    placeholder="Shade"
                  />
                </div>
                <div>
                  <label className="label text-xs">Usage</label>
                  <select
                    className="input text-xs"
                    value={fabric.usage}
                    onChange={(e) => updateFabric(i, 'usage', e.target.value)}
                  >
                    <option value="">Select…</option>
                    {USAGE_OPTIONS.map((u) => (
                      <option key={u} value={u}>{u}</option>
                    ))}
                    <option value="custom">Custom…</option>
                  </select>
                  {fabric.usage === 'custom' && (
                    <input
                      type="text"
                      className="input text-xs mt-1"
                      placeholder="Specify usage"
                      onChange={(e) => updateFabric(i, 'usage', e.target.value)}
                    />
                  )}
                </div>
                <div>
                  <label className="label text-xs">Lot No</label>
                  <input
                    type="text"
                    className="input text-xs"
                    value={fabric.lot}
                    onChange={(e) => updateFabric(i, 'lot', e.target.value)}
                    placeholder="Lot #"
                  />
                </div>
                <div>
                  <label className="label text-xs">Qty</label>
                  <input
                    type="text"
                    className="input text-xs"
                    value={fabric.qty}
                    onChange={(e) => updateFabric(i, 'qty', e.target.value)}
                    placeholder="e.g. 200m"
                  />
                </div>
                <div>
                  <label className="label text-xs">CW Width</label>
                  <input
                    type="text"
                    className="input text-xs"
                    value={fabric.cwWidth}
                    onChange={(e) => updateFabric(i, 'cwWidth', e.target.value)}
                    placeholder="e.g. 46&quot;"
                  />
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {error && (
        <div className="flex items-center gap-2 rounded-lg bg-red-50 dark:bg-red-500/10 px-3 py-2.5 text-sm text-red-700 dark:text-red-400 ring-1 ring-red-200 dark:ring-red-500/30">
          <svg className="w-4 h-4 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126zM12 15.75h.007v.008H12v-.008z" /></svg>
          {error}
        </div>
      )}

      <div className="flex items-center gap-3">
        <button type="submit" disabled={loading} className="btn-primary min-w-[110px]">
          {loading ? <><span className="spinner" /> Saving…</> : kitId ? 'Update Kit' : 'Create Kit'}
        </button>
        <button type="button" onClick={() => router.back()} className="btn-secondary">
          Cancel
        </button>
      </div>
    </form>
  )
}
