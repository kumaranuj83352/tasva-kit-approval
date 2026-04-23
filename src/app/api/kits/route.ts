import { NextResponse } from 'next/server'
import { z } from 'zod'
import connectDB from '@/lib/mongodb'
import { withAuth, apiError, apiSuccess, type AuthedRequest } from '@/lib/api'
import Kit from '@/models/Kit'
import { buildInitialStages } from '@/lib/utils'

const fabricSchema = z.object({
  fabricName: z.string().min(1).max(100),
  color: z.string().min(1).max(100),
  usage: z.string().min(1).max(100),
  lot: z.string().min(1).max(100),
  qty: z.string().min(1).max(50),
  cwWidth: z.string().min(1).max(50),
})

const kitSchema = z.object({
  styleNo: z.string().min(1).max(50),
  season: z.string().min(1).max(50),
  date: z.string(),
  fabrics: z.array(fabricSchema).min(1),
})

// GET /api/kits — list kits based on role
export const GET = withAuth(async (req: AuthedRequest) => {
  await connectDB()
  const { role, userId } = req.user

  let query: Record<string, unknown> = {}

  if (role === 'store') {
    query = { createdBy: userId }
  } else if (role !== 'admin') {
    // Department roles: show kits at their stage or already past
    const stageRoleMap: Record<string, number> = {
      qc: 1, cad: 2, design: 3, bnm: 4, fgsourcing: 5,
    }
    const myStage = stageRoleMap[role]
    if (myStage) {
      query = { currentStage: { $gte: myStage }, status: { $in: ['in_review', 'approved'] } }
    }
  }

  const kits = await Kit.find(query).sort({ createdAt: -1 }).lean()
  return apiSuccess(kits)
})

// POST /api/kits — create new kit
export const POST = withAuth(async (req: AuthedRequest) => {
  if (req.user.role !== 'store') {
    return apiError('Only Store Executive can create kits', 403)
  }

  let body: unknown
  try {
    body = await req.json()
  } catch {
    return apiError('Invalid JSON', 400)
  }

  const parsed = kitSchema.safeParse(body)
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.issues[0].message }, { status: 400 })
  }

  await connectDB()

  const kit = await Kit.create({
    ...parsed.data,
    date: new Date(parsed.data.date),
    stages: buildInitialStages(),
    currentStage: 0,
    status: 'draft',
    createdBy: req.user.userId,
    createdByName: req.user.name,
  })

  return apiSuccess(kit, 201)
}, ['store'])
