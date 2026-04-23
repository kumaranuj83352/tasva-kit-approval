import { NextResponse } from 'next/server'
import { z } from 'zod'
import connectDB from '@/lib/mongodb'
import { withAuth, apiError, apiSuccess, type AuthedRequest } from '@/lib/api'
import AllowedEmail from '@/models/AllowedEmail'

const addSchema = z.object({
  email: z.string().email(),
  role: z.enum(['store', 'qc', 'cad', 'design', 'bnm', 'fgsourcing']),
})

// GET /api/admin/allowed-emails
export const GET = withAuth(async () => {
  await connectDB()
  const list = await AllowedEmail.find({}).sort({ createdAt: -1 }).lean()
  return apiSuccess(list)
}, ['admin'])

// POST /api/admin/allowed-emails — add email to allowed list
export const POST = withAuth(async (req: AuthedRequest) => {
  let body: unknown
  try {
    body = await req.json()
  } catch {
    return apiError('Invalid JSON', 400)
  }

  const parsed = addSchema.safeParse(body)
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.issues[0].message }, { status: 400 })
  }

  const { email, role } = parsed.data
  const normalised = email.toLowerCase().trim()

  await connectDB()

  const existing = await AllowedEmail.findOne({ email: normalised })
  if (existing) return apiError('Email already in allowed list', 409)

  const doc = await AllowedEmail.create({ email: normalised, role, addedBy: req.user.email })
  return apiSuccess(doc, 201)
}, ['admin'])

// DELETE /api/admin/allowed-emails?id=xxx
export const DELETE = withAuth(async (req: AuthedRequest) => {
  const url = new URL(req.url)
  const id = url.searchParams.get('id')
  if (!id) return apiError('ID required', 400)

  await connectDB()
  const doc = await AllowedEmail.findByIdAndDelete(id)
  if (!doc) return apiError('Not found', 404)
  return apiSuccess({ message: 'Removed from allowed list' })
}, ['admin'])
