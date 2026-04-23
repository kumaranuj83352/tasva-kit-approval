import mongoose, { Schema, Document, Model } from 'mongoose'
import type { UserRole } from '@/types'

export interface IUserDoc extends Document {
  email: string
  name: string
  passwordHash: string
  role: UserRole
  refreshTokens: string[]
  createdAt: Date
  updatedAt: Date
}

const UserSchema = new Schema<IUserDoc>(
  {
    email: { type: String, required: true, unique: true, lowercase: true, trim: true },
    name: { type: String, required: true, trim: true },
    passwordHash: { type: String, required: true },
    role: {
      type: String,
      enum: ['admin', 'store', 'qc', 'cad', 'design', 'bnm', 'fgsourcing'],
      required: true,
    },
    refreshTokens: [{ type: String }],
  },
  { timestamps: true }
)

const User: Model<IUserDoc> =
  mongoose.models.User || mongoose.model<IUserDoc>('User', UserSchema)

export default User
