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
export const POST = withAuth(async (authedReq: AuthedRequest, _ctx: unknown): Promise<NextResponse> => {
    const { id } = await (_ctx as RouteContext).params

    if (authedReq.user.role !== 'store') {
      return apiError('Only Store Executive can submit kits', 403)
    }

    await connectDB()

    const kit = await Kit.findById(id)
    if (!kit) return apiError('Kit not found', 404)
    if (kit.status !== 'draft') return apiError('Kit is already submitted', 400)
    if (kit.createdBy.toString() !== authedReq.user.userId) {
      return apiError('Forbidden', 403)
    }

    if (kit.fabrics.length === 0) {
      return apiError('Kit must have at least one fabric entry', 400)
    }

    // Find the first pending/rejected stage to restart from
    // Preserve previously approved stages; only reset from the rejection point onwards
    const existingStages: typeof kit.stages = kit.stages ?? []
    const firstPendingOrRejectedIdx = existingStages.findIndex(
      (s) => s.status === 'pending' || s.status === 'rejected'
    )

    if (firstPendingOrRejectedIdx === -1 || existingStages.length === 0) {
      // Fresh submission — build all stages
      kit.stages = buildInitialStages() as typeof kit.stages
      kit.currentStage = 1
      kit.stages[0].assignedAt = new Date()
    } else {
      // Re-submission after rejection — reset only from the rejected stage onwards
      const restartStage = existingStages[firstPendingOrRejectedIdx].stage
      for (let i = firstPendingOrRejectedIdx; i < kit.stages.length; i++) {
        kit.stages[i].status = 'pending'
        kit.stages[i].approvedBy = undefined as never
        kit.stages[i].approverName = undefined
        kit.stages[i].approvedAt = undefined
        kit.stages[i].notes = undefined
        kit.stages[i].assignedAt = undefined
      }
      kit.currentStage = restartStage
      kit.stages[firstPendingOrRejectedIdx].assignedAt = new Date()
    }

    kit.status = 'in_review'
    kit.submittedAt = new Date()
    kit.markModified('stages')
    await kit.save()

    // Send email to the current stage's department
    const stageRole = STAGE_ROLE_MAP[kit.currentStage]
    const stageUsers = await User.find({ role: stageRole }).select('email').lean()
    const emails = stageUsers.map((u: { email: string }) => u.email)
    if (emails.length > 0) {
      sendStageAssignedEmail({
        to: emails,
        kitStyleNo: kit.styleNo,
        stageName: STAGE_LABEL_MAP[kit.currentStage],
        stageCheck: STAGE_CHECK_MAP[kit.currentStage],
        kitId: kit._id.toString(),
      }).catch(() => {})
    }

    return apiSuccess(kit)
})
