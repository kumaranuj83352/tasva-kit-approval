import { NextResponse } from 'next/server'
import connectDB from '@/lib/mongodb'
import { withAuth, apiError, apiSuccess, type AuthedRequest } from '@/lib/api'
import Kit from '@/models/Kit'
import User from '@/models/User'
import { sendStageAssignedEmail } from '@/lib/email'
import { STAGE_ROLE_MAP, STAGE_LABEL_MAP, STAGE_CHECK_MAP } from '@/types'
import { buildInitialStages } from '@/lib/utils'

type RouteContext = { params: Promise<{ id: string }> }

// POST /api/kits/[id]/submit — submit draft for review
export async function POST(req: AuthedRequest, ctx: RouteContext): Promise<NextResponse> {
  return withAuth(async (authedReq: AuthedRequest) => {
    const { id } = await ctx.params

    if (authedReq.user.role !== 'store' && authedReq.user.role !== 'admin') {
      return apiError('Only Store Executive can submit kits', 403)
    }

    await connectDB()

    const kit = await Kit.findById(id)
    if (!kit) return apiError('Kit not found', 404)
    if (kit.status !== 'draft') return apiError('Kit is already submitted', 400)
    if (authedReq.user.role !== 'admin' && kit.createdBy.toString() !== authedReq.user.userId) {
      return apiError('Forbidden', 403)
    }

    if (kit.fabrics.length === 0) {
      return apiError('Kit must have at least one fabric entry', 400)
    }

    kit.stages = buildInitialStages() as typeof kit.stages
    kit.stages[0].assignedAt = new Date()
    kit.currentStage = 1
    kit.status = 'in_review'
    kit.submittedAt = new Date()
    await kit.save()

    // Send email to stage 1 department (QC)
    const qcUsers = await User.find({ role: STAGE_ROLE_MAP[1] }).select('email').lean()
    const emails = qcUsers.map((u) => u.email)
    if (emails.length > 0) {
      sendStageAssignedEmail({
        to: emails,
        kitStyleNo: kit.styleNo,
        stageName: STAGE_LABEL_MAP[1],
        stageCheck: STAGE_CHECK_MAP[1],
        kitId: kit._id.toString(),
      }).catch(() => {})
    }

    return apiSuccess(kit)
  })(req)
}
