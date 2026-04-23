import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import connectDB from '@/lib/mongodb'
import { generateOtp, otpExpiresAt } from '@/lib/auth'
import { sendOtpEmail } from '@/lib/email'
import AllowedEmail from '@/models/AllowedEmail'
import Otp from '@/models/Otp'
import User from '@/models/User'

const schema = z.object({
  email: z.string().email(),
  name: z.string().min(2).max(80),
})

export async function POST(req: NextRequest): Promise<NextResponse> {
  let body: unknown
  try {
    body = await req.json()
  } catch {
    return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 })
  }

  const parsed = schema.safeParse(body)
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.issues[0].message }, { status: 400 })
  }

  const { email, name } = parsed.data
  const normalised = email.toLowerCase().trim()

  await connectDB()

  // Only admin email or approved emails can sign up
  const adminEmail = process.env.ADMIN_EMAIL!.toLowerCase()
  const isAdmin = normalised === adminEmail

  if (!isAdmin) {
    const allowed = await AllowedEmail.findOne({ email: normalised })
    if (!allowed) {
      return NextResponse.json(
        { error: 'This email is not authorised to register. Contact your administrator.' },
        { status: 403 }
      )
    }
  }

  // Check if already registered
  const existing = await User.findOne({ email: normalised })
  if (existing) {
    return NextResponse.json({ error: 'This email is already registered.' }, { status: 409 })
  }

  // Invalidate any existing OTPs for this email/purpose
  await Otp.updateMany({ email: normalised, purpose: 'signup', used: false }, { used: true })

  const otp = generateOtp()
  await Otp.create({ email: normalised, otp, purpose: 'signup', expiresAt: otpExpiresAt() })

  try {
    await sendOtpEmail(normalised, otp, 'signup')
  } catch {
    return NextResponse.json({ error: 'Failed to send OTP. Please try again.' }, { status: 500 })
  }

  return NextResponse.json({ message: 'OTP sent to your email.' }, { status: 200 })
}
