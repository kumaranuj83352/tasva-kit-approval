import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import connectDB from '@/lib/mongodb'
import { hashPassword } from '@/lib/auth'
import User from '@/models/User'
import Otp from '@/models/Otp'

const schema = z.object({
  email: z.string().email(),
  otp: z.string().length(6),
  newPassword: z.string().min(8).max(128),
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

  const { email, otp, newPassword } = parsed.data
  const normalised = email.toLowerCase().trim()

  await connectDB()

  const otpDoc = await Otp.findOne({
    email: normalised,
    purpose: 'reset',
    used: false,
    expiresAt: { $gt: new Date() },
  })

  if (!otpDoc || otpDoc.otp !== otp) {
    return NextResponse.json({ error: 'Invalid or expired OTP.' }, { status: 400 })
  }

  otpDoc.used = true
  await otpDoc.save()

  const passwordHash = await hashPassword(newPassword)
  await User.updateOne({ email: normalised }, { passwordHash, refreshTokens: [] })

  const res = NextResponse.json({ message: 'Password reset successfully.' })
  res.cookies.set('refresh_token', '', { maxAge: 0, path: '/' })
  return res
}
