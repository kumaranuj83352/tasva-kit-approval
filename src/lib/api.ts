import { NextRequest, NextResponse } from 'next/server'
import { verifyAccessToken } from '@/lib/auth'
import type { AuthTokenPayload, UserRole } from '@/types'

export type AuthedRequest = NextRequest & { user: AuthTokenPayload }

export function withAuth(
  handler: (req: AuthedRequest, ctx: unknown) => Promise<NextResponse>,
  allowedRoles?: UserRole[]
) {
  return async (req: NextRequest, ctx: unknown): Promise<NextResponse> => {
    const authHeader = req.headers.get('authorization')
    if (!authHeader?.startsWith('Bearer ')) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const token = authHeader.slice(7)
    let payload: AuthTokenPayload

    try {
      payload = verifyAccessToken(token)
    } catch {
      return NextResponse.json({ error: 'Invalid or expired token' }, { status: 401 })
    }

    if (allowedRoles && !allowedRoles.includes(payload.role)) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    const authedReq = req as AuthedRequest
    authedReq.user = payload
    return handler(authedReq, ctx)
  }
}

export function apiError(message: string, status: number): NextResponse {
  return NextResponse.json({ error: message }, { status })
}

export function apiSuccess<T>(data: T, status = 200): NextResponse {
  return NextResponse.json(data, { status })
}
