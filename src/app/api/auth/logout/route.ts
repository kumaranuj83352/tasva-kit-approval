import { NextRequest, NextResponse } from 'next/server'
import connectDB from '@/lib/mongodb'
import { verifyRefreshToken } from '@/lib/auth'
import User from '@/models/User'

export async function POST(req: NextRequest): Promise<NextResponse> {
  const refreshToken = req.cookies.get('refresh_token')?.value

  if (refreshToken) {
    try {
      const payload = verifyRefreshToken(refreshToken)
      await connectDB()
      const user = await User.findById(payload.userId)
      if (user) {
        user.refreshTokens = user.refreshTokens.filter((t: string) => t !== refreshToken)
        await user.save()
      }
    } catch {
      // Token invalid — still clear the cookie
    }
  }

  const res = NextResponse.json({ message: 'Logged out' })
  res.cookies.set('refresh_token', '', { maxAge: 0, path: '/' })
  return res
}
