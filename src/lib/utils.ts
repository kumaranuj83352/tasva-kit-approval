import type { IApprovalStage, UserRole } from '@/types'
import { STAGE_ROLE_MAP, STAGE_LABEL_MAP, LEAD_TIME_DAYS, ESCALATION_DELAY_DAYS, ESCALATION_WARNING_DAYS } from '@/types'

export function buildInitialStages(): IApprovalStage[] {
  return [1, 2, 3, 4, 5, 6].map((stage) => ({
    stage,
    role: STAGE_ROLE_MAP[stage] as UserRole,
    label: STAGE_LABEL_MAP[stage],
    status: 'pending' as const,
    assignedAt: undefined,
  }))
}

export function daysSince(date: Date | string): number {
  const d = new Date(date)
  const now = new Date()
  return Math.floor((now.getTime() - d.getTime()) / (1000 * 60 * 60 * 24))
}

export type ReminderType = 'none' | 'pending' | 'delayed' | 'warning' | 'escalate'

export function getReminderType(assignedAt: Date | string): {
  type: ReminderType
  daysSinceAssigned: number
  delayDays: number
  daysRemaining: number
} {
  const days = daysSince(assignedAt)
  const delayDays = days - LEAD_TIME_DAYS

  if (days === 0) return { type: 'none', daysSinceAssigned: days, delayDays: 0, daysRemaining: LEAD_TIME_DAYS }
  if (delayDays < 0) {
    // Within lead time — day 1 to 4
    return { type: 'pending', daysSinceAssigned: days, delayDays: 0, daysRemaining: LEAD_TIME_DAYS - days }
  }
  if (delayDays >= ESCALATION_DELAY_DAYS) {
    return { type: 'escalate', daysSinceAssigned: days, delayDays, daysRemaining: 0 }
  }
  if (delayDays >= ESCALATION_WARNING_DAYS) {
    return { type: 'warning', daysSinceAssigned: days, delayDays, daysRemaining: 0 }
  }
  return { type: 'delayed', daysSinceAssigned: days, delayDays, daysRemaining: 0 }
}

export function kitStageStatus(stages: IApprovalStage[], currentStage: number) {
  if (currentStage === 0) return { label: 'Draft', color: 'gray' }
  const active = stages.find((s) => s.stage === currentStage)
  if (!active) return { label: 'Unknown', color: 'gray' }
  if (active.status === 'approved') return { label: 'Approved', color: 'green' }
  if (active.status === 'rejected') return { label: 'Rejected', color: 'red' }

  if (!active.assignedAt) return { label: 'Pending', color: 'amber' }
  const { type, delayDays } = getReminderType(active.assignedAt)
  if (type === 'escalate' || type === 'warning') return { label: `Delayed ${delayDays}d`, color: 'red' }
  if (type === 'delayed') return { label: `Delayed ${delayDays}d`, color: 'orange' }
  return { label: 'Pending', color: 'amber' }
}
