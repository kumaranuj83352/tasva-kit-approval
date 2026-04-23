'use client'
import { useEffect, useState } from 'react'
import { useParams } from 'next/navigation'
import { apiGet } from '@/lib/fetchClient'
import type { IKit } from '@/types'

export default function PrintKitPage() {
  const { id } = useParams<{ id: string }>()
  const [kit, setKit] = useState<IKit | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    apiGet<IKit>(`/api/kits/${id}`)
      .then((data) => {
        setKit(data)
        setLoading(false)
        setTimeout(() => window.print(), 500)
      })
      .catch(() => setLoading(false))
  }, [id])

  if (loading) return <div style={{ padding: 32, fontFamily: 'Arial, sans-serif', fontSize: 12 }}>Loading…</div>
  if (!kit) return <div style={{ padding: 32 }}>Kit not found</div>

  const dateStr = new Date(kit.date).toLocaleDateString('en-IN', { day: '2-digit', month: '2-digit', year: '2-digit' })

  return (
    <>
      <style>{`
        @media print {
          .no-print { display: none !important; }
          body { margin: 0; }
          @page { size: A4; margin: 12mm; }
        }
        body { font-family: Arial, sans-serif; }
      `}</style>

      {/* Print / Close buttons */}
      <div className="no-print" style={{ padding: '12px 16px', display: 'flex', gap: 8 }}>
        <button
          onClick={() => window.print()}
          style={{ padding: '6px 18px', background: '#1d4ed8', color: '#fff', border: 'none', borderRadius: 4, cursor: 'pointer', fontSize: 13 }}
        >
          Print
        </button>
        <button
          onClick={() => window.close()}
          style={{ padding: '6px 18px', background: '#f3f4f6', border: '1px solid #d1d5db', borderRadius: 4, cursor: 'pointer', fontSize: 13 }}
        >
          Close
        </button>
      </div>

      {/* Kit Card */}
      <div style={{ maxWidth: 720, margin: '0 auto', padding: '0 16px 32px', fontSize: 12, color: '#000' }}>
        {/* Company name */}
        <div style={{ textAlign: 'center', fontWeight: 700, fontSize: 15, textTransform: 'uppercase', letterSpacing: 1, borderBottom: '2px solid #000', paddingBottom: 6, marginBottom: 8 }}>
          Indivinity Clothing Retail Pvt. Ltd.
        </div>

        {/* Style / KIT CARD / Season + Date row */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 12 }}>
          <div style={{ fontSize: 13 }}>
            <span style={{ fontWeight: 400 }}>Style :- </span>
            <span style={{ fontWeight: 700 }}>{kit.styleNo}</span>
          </div>
          <div style={{ textAlign: 'center', fontWeight: 700, fontSize: 14, textDecoration: 'underline' }}>
            KIT CARD
          </div>
          <div style={{ textAlign: 'right', fontSize: 12 }}>
            <div><span>Season :- </span><strong>{kit.season}</strong></div>
            <div><span>Date: </span>{dateStr}</div>
          </div>
        </div>

        {/* Fabric rows — one row per fabric, swatch box left + fields right */}
        {kit.fabrics.map((fabric, i) => (
          <div
            key={i}
            style={{
              display: 'flex',
              gap: 16,
              marginBottom: 18,
              paddingBottom: 18,
              borderBottom: i < kit.fabrics.length - 1 ? '1px dashed #bbb' : 'none',
            }}
          >
            {/* Swatch placeholder */}
            <div style={{
              width: 110,
              minHeight: 80,
              border: '1px solid #555',
              flexShrink: 0,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: 10,
              color: '#999',
            }}>
              Swatch {i + 1}
            </div>

            {/* Fields */}
            <div style={{ flex: 1, display: 'grid', gridTemplateColumns: '1fr 1fr', rowGap: 4, columnGap: 24, alignContent: 'start' }}>
              <Field label="Fabric" value={fabric.fabricName} />
              <Field label="Colour" value={fabric.color} />
              <Field label="Usage" value={fabric.usage} />
              <Field label="Lot" value={fabric.lot} />
              <Field label="Qty" value={fabric.qty} />
              <Field label="CW Width" value={fabric.cwWidth} />
            </div>
          </div>
        ))}
      </div>
    </>
  )
}

function Field({ label, value }: { label: string; value: string }) {
  return (
    <div style={{ display: 'flex', gap: 4, alignItems: 'baseline', borderBottom: '1px solid #ccc', paddingBottom: 2 }}>
      <span style={{ fontWeight: 400, whiteSpace: 'nowrap', minWidth: 70 }}>{label} -</span>
      <span style={{ fontWeight: 600 }}>{value}</span>
    </div>
  )
}
