import { NextRequest, NextResponse } from 'next/server'
import connectDB from '@/lib/mongodb'
import Kit from '@/models/Kit'
import User from '@/models/User'
import {
  sendPendingReminderEmail,
  sendDelayedReminderEmail,
  sendEscalationWarningEmail,
  sendEscalationEmail,
} from '@/lib/email'
import { getReminderType } from '@/lib/utils'
import { STAGE_LABEL_MAP, STAGE_ROLE_MAP } from '@/types'

export async function GET(req: NextRequest): Promise<NextResponse> {
  // Secure the cron endpoint
  const cronSecret = req.headers.get('authorization')
  if (cronSecret !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  await connectDB()

  const kitsInReview = await Kit.find({ status: 'in_review' }).lean()

  const adminEmail = process.env.ADMIN_EMAIL!
  let totalProcessed = 0

  for (const kit of kitsInReview) {
    const currentStage = kit.stages.find((s) => s.stage === kit.currentStage)
    if (!currentStage || currentStage.status !== 'pending' || !currentStage.assignedAt) continue

    const { type, daysSinceAssigned, delayDays, daysRemaining } = getReminderType(currentStage.assignedAt)
    if (type === 'none') continue

    const role = STAGE_ROLE_MAP[kit.currentStage]
    const stageName = STAGE_LABEL_MAP[kit.currentStage]
    const kitId = (kit._id as { toString(): string }).toString()

    // Get department email addresses
    const deptUsers = await User.find({ role }).select('email').lean()
    const emails = deptUsers.map((u) => u.email)
    if (emails.length === 0) continue

    // Count total delayed kits for warning email
    const totalDelayedForDept = kitsInReview.filter((k) => {
      const s = k.stages.find((st) => st.stage === k.currentStage)
      if (!s || !s.assignedAt) return false
      const { type: t } = getReminderType(s.assignedAt)
      return (t === 'warning' || t === 'escalate') && STAGE_ROLE_MAP[k.currentStage] === role
    }).length

    try {
      if (type === 'escalate') {
        await sendEscalationEmail({
          managerEmail: adminEmail,
          kitStyleNo: kit.styleNo,
          stageName,
          departmentEmail: emails,
          delayDays,
          kitId,
        })
      } else if (type === 'warning') {
        await sendEscalationWarningEmail({
          to: emails,
          kitStyleNo: kit.styleNo,
          stageName,
          delayDays,
          pendingCount: totalDelayedForDept,
          kitId,
        })
      } else if (type === 'delayed') {
        await sendDelayedReminderEmail({
          to: emails,
          kitStyleNo: kit.styleNo,
          stageName,
          delayDays,
          kitId,
        })
      } else if (type === 'pending') {
        await sendPendingReminderEmail({
          to: emails,
          kitStyleNo: kit.styleNo,
          stageName,
          daysSinceAssigned,
          daysRemaining,
          kitId,
        })
      }
      totalProcessed++
    } catch {
      // Continue processing other kits even if one email fails
    }
  }

  return NextResponse.json({ message: `Reminders sent for ${totalProcessed} kits` })
}
