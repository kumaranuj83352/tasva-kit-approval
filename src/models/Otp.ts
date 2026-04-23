import mongoose, { Schema, Document, Model } from 'mongoose'

export type OtpPurpose = 'signup' | 'reset'

export interface IOtpDoc extends Document {
  email: string
  otp: string
  purpose: OtpPurpose
  expiresAt: Date
  used: boolean
  createdAt: Date
}

const OtpSchema = new Schema<IOtpDoc>(
  {
    email: { type: String, required: true, lowercase: true, trim: true },
    otp: { type: String, required: true },
    purpose: { type: String, enum: ['signup', 'reset'], required: true },
    expiresAt: { type: Date, required: true },
    used: { type: Boolean, default: false },
  },
  { timestamps: true }
)

OtpSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 })

const Otp: Model<IOtpDoc> =
  mongoose.models.Otp || mongoose.model<IOtpDoc>('Otp', OtpSchema)

export default Otp
