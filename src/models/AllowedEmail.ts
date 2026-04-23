import mongoose, { Schema, Document, Model } from 'mongoose'
import type { UserRole } from '@/types'

export interface IAllowedEmailDoc extends Document {
  email: string
  role: UserRole
  addedBy: string
  createdAt: Date
}

const AllowedEmailSchema = new Schema<IAllowedEmailDoc>(
  {
    email: { type: String, required: true, unique: true, lowercase: true, trim: true },
    role: {
      type: String,
      enum: ['admin', 'store', 'qc', 'cad', 'design', 'bnm', 'fgsourcing'],
      required: true,
    },
    addedBy: { type: String, required: true },
  },
  { timestamps: true }
)

const AllowedEmail: Model<IAllowedEmailDoc> =
  mongoose.models.AllowedEmail ||
  mongoose.model<IAllowedEmailDoc>('AllowedEmail', AllowedEmailSchema)

export default AllowedEmail
