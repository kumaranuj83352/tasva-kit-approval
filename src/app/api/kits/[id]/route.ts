import { NextResponse } from 'next/server'
import { z } from 'zod'
import connectDB from '@/lib/mongodb'
import { withAuth, apiError, apiSuccess, type AuthedRequest } from '@/lib/api'
import Kit from '@/models/Kit'

const fabricSchema = z.object({
  fabricName: z.string().min(1).max(100),
  color: z.string().min(1).max(100),
  usage: z.string().min(1).max(100),
  lot: z.string().min(1).max(100),
  qty: z.string().min(1).max(50),
  cwWidth: z.string().min(1).max(50),
})

const updateSchema = z.object({
  styleNo: z.string().min(1).max(50).optional(),
  season: z.string().min(1).max(50).optional(),
  date: z.string().optional(),
  fabrics: z.array(fabricSchema).min(1).optional(),
})

type RouteContext = { params: Promise<{ id: string }> }

// GET /api/kits/[id]
export const GET = withAuth(async (req: AuthedRequest, _ctx: unknown) => {
  const { id } = await (_ctx as RouteContext).params
  await connectDB()
  const kit = await Kit.findById(id).lean()
  if (!kit) return apiError('Kit not found', 404)
  return apiSuccess(kit)
})

// PUT /api/kits/[id] — update draft kit
export const PUT = withAuth(async (req: AuthedRequest, _ctx: unknown) => {
  const { id } = await (_ctx as RouteContext).params
  await connectDB()

  const kit = await Kit.findById(id)
  if (!kit) return apiError('Kit not found', 404)
  if (kit.status !== 'draft') return apiError('Only draft kits can be edited', 400)
  if (req.user.role !== 'admin' && kit.createdBy.toString() !== req.user.userId) {
    return apiError('Forbidden', 403)
  }

  let body: unknown
  try {
    body = await req.json()
  } catch {
    return apiError('Invalid JSON', 400)
  }

  const parsed = updateSchema.safeParse(body)
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.issues[0].message }, { status: 400 })
  }

  const updates = parsed.data
  if (updates.styleNo) kit.styleNo = updates.styleNo
  if (updates.season) kit.season = updates.season
  if (updates.date) kit.date = new Date(updates.date)
  if (updates.fabrics) kit.fabrics = updates.fabrics as typeof kit.fabrics
  await kit.save()

  return apiSuccess(kit)
}, ['store', 'admin'])

// DELETE /api/kits/[id] — store owner only, draft kits only
export const DELETE = withAuth(async (req: AuthedRequest, _ctx: unknown) => {
  const { id } = await (_ctx as RouteContext).params
  await connectDB()
  const kit = await Kit.findById(id)
  if (!kit) return apiError('Kit not found', 404)
  if (kit.status !== 'draft') return apiError('Only draft kits can be deleted', 403)
  if (kit.createdBy.toString() !== req.user.userId) return apiError('Forbidden', 403)
  await kit.deleteOne()
  return apiSuccess({ message: 'Kit deleted' })
}, ['store'])
