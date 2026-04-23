import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import connectDB from '@/lib/mongodb'
import { hashPassword, signAccessToken, signRefreshToken } from '@/lib/auth'
import AllowedEmail from '@/models/AllowedEmail'
import Otp from '@/models/Otp'
import User from '@/models/User'
import type { UserRole } from '@/types'

const schema = z.object({
  email: z.string().email(),
  name: z.string().min(2).max(80),
  otp: z.string().length(6),
  password: z.string().min(8).max(128),
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

  const { email, name, otp, password } = parsed.data
  const normalised = email.toLowerCase().trim()

  await connectDB()

  const otpDoc = await Otp.findOne({
    email: normalised,
    purpose: 'signup',
    used: false,
    expiresAt: { $gt: new Date() },
  })

  if (!otpDoc || otpDoc.otp !== otp) {
    return NextResponse.json({ error: 'Invalid or expired OTP.' }, { status: 400 })
  }

  // Mark OTP used
  otpDoc.used = true
  await otpDoc.save()

  // Determine role
  const adminEmail = process.env.ADMIN_EMAIL!.toLowerCase()
  let role: UserRole = 'store'
  if (normalised === adminEmail) {
    role = 'admin'
  } else {
    const allowedDoc = await AllowedEmail.findOne({ email: normalised })
    if (allowedDoc) role = allowedDoc.role as UserRole
  }

  const passwordHash = await hashPassword(password)
  const user = await User.create({ email: normalised, name: name.trim(), passwordHash, role })

  const payload = { userId: user._id.toString(), email: normalised, role, name: name.trim() }
  const accessToken = signAccessToken(payload)
  const refreshToken = signRefreshToken(payload)

  user.refreshTokens = [refreshToken]
  await user.save()

  const res = NextResponse.json({ accessToken, user: { id: user._id, email: normalised, name: name.trim(), role } }, { status: 201 })
  res.cookies.set('refresh_token', refreshToken, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    maxAge: 60 * 60 * 24, // 24h
    path: '/',
  })
  return res
}
