export type UserRole = 'admin' | 'store' | 'qc' | 'cad' | 'design' | 'bnm' | 'fgsourcing'

export const STAGE_ROLE_MAP: Record<number, UserRole> = {
  1: 'qc',
  2: 'cad',
  3: 'design',
  4: 'bnm',
  5: 'fgsourcing',
  6: 'admin',
}

export const STAGE_LABEL_MAP: Record<number, string> = {
  1: 'QC Team',
  2: 'CAD Team',
  3: 'Design Team',
  4: 'BNM Team',
  5: 'FG Sourcing',
  6: 'Final Sign',
}

export const STAGE_CHECK_MAP: Record<number, string> = {
  1: 'Lot matches approved inspection',
  2: 'Cuttable width and consumption based on order ratio',
  3: 'Shade, texture, fall',
  4: 'Usage & costing impact',
  5: 'Vendor suitability',
  6: 'All teams sign on card',
}

export const ROLE_LABEL_MAP: Record<UserRole, string> = {
  admin: 'Admin',
  store: 'Store Executive',
  qc: 'QC Team',
  cad: 'CAD Team',
  design: 'Design Team',
  bnm: 'BNM Team',
  fgsourcing: 'FG Sourcing',
}

export const LEAD_TIME_DAYS = 4
export const ESCALATION_DELAY_DAYS = 7
export const ESCALATION_WARNING_DAYS = 5 // days of delay = 2 days before escalation

export interface IFabric {
  fabricName: string
  color: string
  usage: string
  lot: string
  qty: string
  cwWidth: string
}

export type ApprovalStatus = 'pending' | 'approved' | 'rejected'
export type KitStatus = 'draft' | 'in_review' | 'approved' | 'rejected'

export interface IApprovalStage {
  stage: number
  role: UserRole
  label: string
  status: ApprovalStatus
  approvedBy?: string
  approverName?: string
  approvedAt?: string
  notes?: string
  assignedAt?: string
}

export interface IKit {
  _id: string
  styleNo: string
  season: string
  date: string
  fabrics: IFabric[]
  stages: IApprovalStage[]
  currentStage: number
  status: KitStatus
  createdBy: string
  createdByName: string
  createdAt: string
  updatedAt: string
  submittedAt?: string
}

export interface IUser {
  _id: string
  email: string
  name: string
  role: UserRole
  createdAt: string
}

export interface IAllowedEmail {
  _id: string
  email: string
  department: string
  role: UserRole
  addedBy: string
  createdAt: string
}

export interface AuthTokenPayload {
  userId: string
  email: string
  role: UserRole
  name: string
}
