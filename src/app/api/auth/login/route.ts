import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import connectDB from '@/lib/mongodb'
import { verifyPassword, signAccessToken, signRefreshToken } from '@/lib/auth'
import User from '@/models/User'

const schema = z.object({
  email: z.string().email(),
  password: z.string().min(1),
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
    return NextResponse.json({ error: 'Invalid request' }, { status: 400 })
  }

  const { email, password } = parsed.data
  const normalised = email.toLowerCase().trim()

  await connectDB()

  const user = await User.findOne({ email: normalised })
  if (!user) {
    // Constant-time response to avoid user enumeration
    return NextResponse.json({ error: 'Invalid email or password.' }, { status: 401 })
  }

  const valid = await verifyPassword(password, user.passwordHash)
  if (!valid) {
    return NextResponse.json({ error: 'Invalid email or password.' }, { status: 401 })
  }

  const payload = {
    userId: user._id.toString(),
    email: normalised,
    role: user.role,
    name: user.name,
  }
  const accessToken = signAccessToken(payload)
  const refreshToken = signRefreshToken(payload)

  // Keep last 5 refresh tokens (device sessions)
  user.refreshTokens = [...(user.refreshTokens ?? []).slice(-4), refreshToken]
  await user.save()

  const res = NextResponse.json({
    accessToken,
    user: { id: user._id, email: normalised, name: user.name, role: user.role },
  })
  res.cookies.set('refresh_token', refreshToken, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    maxAge: 60 * 60 * 24,
    path: '/',
  })
  return res
}
