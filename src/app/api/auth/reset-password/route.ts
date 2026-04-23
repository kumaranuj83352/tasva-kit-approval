import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import connectDB from '@/lib/mongodb'
import { generateOtp, otpExpiresAt } from '@/lib/auth'
import { sendOtpEmail } from '@/lib/email'
import User from '@/models/User'
import Otp from '@/models/Otp'

const requestSchema = z.object({
  email: z.string().email(),
})

export async function POST(req: NextRequest): Promise<NextResponse> {
  let body: unknown
  try {
    body = await req.json()
  } catch {
    return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 })
  }

  const parsed = requestSchema.safeParse(body)
  if (!parsed.success) {
    return NextResponse.json({ error: 'Invalid email' }, { status: 400 })
  }

  const normalised = parsed.data.email.toLowerCase().trim()
  await connectDB()

  const user = await User.findOne({ email: normalised })
  // Always return success to avoid user enumeration
  if (!user) {
    return NextResponse.json({ message: 'If this email is registered, an OTP has been sent.' })
  }

  await Otp.updateMany({ email: normalised, purpose: 'reset', used: false }, { used: true })

  const otp = generateOtp()
  await Otp.create({ email: normalised, otp, purpose: 'reset', expiresAt: otpExpiresAt() })

  try {
    await sendOtpEmail(normalised, otp, 'reset')
  } catch {
    return NextResponse.json({ error: 'Failed to send OTP.' }, { status: 500 })
  }

  return NextResponse.json({ message: 'If this email is registered, an OTP has been sent.' })
}
