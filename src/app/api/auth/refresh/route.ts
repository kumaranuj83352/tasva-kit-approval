import { NextRequest, NextResponse } from 'next/server'
import connectDB from '@/lib/mongodb'
import { verifyRefreshToken, signAccessToken, signRefreshToken } from '@/lib/auth'
import User from '@/models/User'

export async function POST(req: NextRequest): Promise<NextResponse> {
  const refreshToken = req.cookies.get('refresh_token')?.value
  if (!refreshToken) {
    return NextResponse.json({ error: 'No refresh token' }, { status: 401 })
  }

  let payload
  try {
    payload = verifyRefreshToken(refreshToken)
  } catch {
    return NextResponse.json({ error: 'Invalid refresh token' }, { status: 401 })
  }

  await connectDB()

  // Atomically swap the old refresh token for a new one to avoid version conflicts
  // on concurrent requests. If the token is not in the array, findOneAndUpdate returns null.
  const user = await User.findOneAndUpdate(
    { _id: payload.userId, refreshTokens: refreshToken },
    { $pull: { refreshTokens: refreshToken } },
    { new: false }
  )
  if (!user) {
    return NextResponse.json({ error: 'Refresh token revoked' }, { status: 401 })
  }

  const newPayload = { userId: user._id.toString(), email: user.email, role: user.role, name: user.name }
  const newAccessToken = signAccessToken(newPayload)
  const newRefreshToken = signRefreshToken(newPayload)

  // Push new token (keep max 5 sessions)
  await User.findByIdAndUpdate(user._id, {
    $push: { refreshTokens: { $each: [newRefreshToken], $slice: -5 } },
  })

  const res = NextResponse.json({ accessToken: newAccessToken })
  res.cookies.set('refresh_token', newRefreshToken, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    maxAge: 60 * 60 * 24,
    path: '/',
  })
  return res
}
