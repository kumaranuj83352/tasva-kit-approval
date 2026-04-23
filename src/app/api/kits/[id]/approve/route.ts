import { NextResponse } from 'next/server'
import { z } from 'zod'
import connectDB from '@/lib/mongodb'
import { withAuth, apiError, apiSuccess, type AuthedRequest } from '@/lib/api'
import Kit from '@/models/Kit'
import User from '@/models/User'
import { sendStageAssignedEmail } from '@/lib/email'
import { STAGE_ROLE_MAP, STAGE_LABEL_MAP, STAGE_CHECK_MAP } from '@/types'

const schema = z.object({
  action: z.enum(['approved', 'rejected']),
  notes: z.string().max(500).optional(),
})

type RouteContext = { params: Promise<{ id: string }> }

export async function POST(req: AuthedRequest, ctx: RouteContext): Promise<NextResponse> {
  return withAuth(async (authedReq: AuthedRequest) => {
    const { id } = await ctx.params

    let body: unknown
    try {
      body = await authedReq.json()
    } catch {
      return apiError('Invalid JSON', 400)
    }

    const parsed = schema.safeParse(body)
    if (!parsed.success) {
      return NextResponse.json({ error: parsed.error.issues[0].message }, { status: 400 })
    }

    const { action, notes } = parsed.data

    await connectDB()

    const kit = await Kit.findById(id)
    if (!kit) return apiError('Kit not found', 404)
    if (kit.status !== 'in_review') return apiError('Kit is not in review', 400)

    const currentStageIdx = kit.stages.findIndex((s) => s.stage === kit.currentStage)
    if (currentStageIdx === -1) return apiError('Stage not found', 400)

    const currentStage = kit.stages[currentStageIdx]
    const expectedRole = STAGE_ROLE_MAP[kit.currentStage]

    if (authedReq.user.role !== expectedRole) {
      return apiError(`Only ${STAGE_LABEL_MAP[kit.currentStage]} can approve this stage`, 403)
    }

    currentStage.status = action
    currentStage.approvedBy = authedReq.user.userId as unknown as typeof currentStage.approvedBy
    currentStage.approverName = authedReq.user.name
    currentStage.approvedAt = new Date()
    if (notes) currentStage.notes = notes

    if (action === 'rejected') {
      kit.status = 'rejected'
    } else {
      const nextStage = kit.currentStage + 1
      if (nextStage > 6) {
        kit.status = 'approved'
      } else {
        kit.currentStage = nextStage
        const nextStageIdx = kit.stages.findIndex((s) => s.stage === nextStage)
        if (nextStageIdx !== -1) {
          kit.stages[nextStageIdx].assignedAt = new Date()
        }

        // Send email to next department
        const nextRole = STAGE_ROLE_MAP[nextStage]
        const nextUsers = await User.find({ role: nextRole }).select('email').lean()
        const emails = nextUsers.map((u) => u.email)
        if (emails.length > 0) {
          sendStageAssignedEmail({
            to: emails,
            kitStyleNo: kit.styleNo,
            stageName: STAGE_LABEL_MAP[nextStage],
            stageCheck: STAGE_CHECK_MAP[nextStage],
            kitId: kit._id.toString(),
          }).catch(() => {})
        }
      }
    }

    kit.markModified('stages')
    await kit.save()

    return apiSuccess(kit)
  })(req)
}
