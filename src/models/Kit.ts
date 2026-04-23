import mongoose, { Schema, Document, Model } from 'mongoose'
import type { UserRole, KitStatus, ApprovalStatus } from '@/types'

interface FabricSubDoc {
  fabricName: string
  color: string
  usage: string
  lot: string
  qty: string
  cwWidth: string
}

interface StageSubDoc {
  stage: number
  role: UserRole
  label: string
  status: ApprovalStatus
  approvedBy?: mongoose.Types.ObjectId
  approverName?: string
  approvedAt?: Date
  notes?: string
  assignedAt?: Date
}

export interface IKitDoc extends Document {
  styleNo: string
  season: string
  date: Date
  fabrics: FabricSubDoc[]
  stages: StageSubDoc[]
  currentStage: number
  status: KitStatus
  createdBy: mongoose.Types.ObjectId
  createdByName: string
  submittedAt?: Date
  createdAt: Date
  updatedAt: Date
}

const FabricSchema = new Schema<FabricSubDoc>(
  {
    fabricName: { type: String, required: true, trim: true },
    color: { type: String, required: true, trim: true },
    usage: { type: String, required: true, trim: true },
    lot: { type: String, required: true, trim: true },
    qty: { type: String, required: true, trim: true },
    cwWidth: { type: String, required: true, trim: true },
  },
  { _id: false }
)

const StageSchema = new Schema<StageSubDoc>(
  {
    stage: { type: Number, required: true },
    role: { type: String, required: true },
    label: { type: String, required: true },
    status: { type: String, enum: ['pending', 'approved', 'rejected'], default: 'pending' },
    approvedBy: { type: Schema.Types.ObjectId, ref: 'User' },
    approverName: { type: String },
    approvedAt: { type: Date },
    notes: { type: String },
    assignedAt: { type: Date },
  },
  { _id: false }
)

const KitSchema = new Schema<IKitDoc>(
  {
    styleNo: { type: String, required: true, trim: true },
    season: { type: String, required: true, trim: true },
    date: { type: Date, required: true },
    fabrics: [FabricSchema],
    stages: [StageSchema],
    currentStage: { type: Number, default: 0 },
    status: {
      type: String,
      enum: ['draft', 'in_review', 'approved', 'rejected'],
      default: 'draft',
    },
    createdBy: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    createdByName: { type: String, required: true },
    submittedAt: { type: Date },
  },
  { timestamps: true }
)

KitSchema.index({ status: 1 })
KitSchema.index({ 'stages.role': 1, 'stages.status': 1 })

const Kit: Model<IKitDoc> =
  mongoose.models.Kit || mongoose.model<IKitDoc>('Kit', KitSchema)

export default Kit
