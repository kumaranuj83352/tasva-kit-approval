import connectDB from '@/lib/mongodb'
import { withAuth, apiError, apiSuccess, type AuthedRequest } from '@/lib/api'
import User from '@/models/User'

// GET /api/admin/users
export const GET = withAuth(async () => {
  await connectDB()
  const users = await User.find({}).select('-passwordHash -refreshTokens').sort({ createdAt: -1 }).lean()
  return apiSuccess(users)
}, ['admin'])

// DELETE /api/admin/users?id=xxx
export const DELETE = withAuth(async (req: AuthedRequest) => {
  const url = new URL(req.url)
  const id = url.searchParams.get('id')
  if (!id) return apiError('User ID required', 400)
  if (id === req.user.userId) return apiError('Cannot delete your own account', 400)

  await connectDB()
  const user = await User.findByIdAndDelete(id)
  if (!user) return apiError('User not found', 404)
  return apiSuccess({ message: 'User deleted' })
}, ['admin'])
