import mongoose from 'mongoose'

const MONGODB_URI = process.env.MONGODB_URI!

if (!MONGODB_URI) {
  throw new Error('MONGODB_URI is not defined in environment variables')
}

declare global {
  // eslint-disable-next-line no-var
  var _mongooseConn: typeof mongoose | undefined
  // eslint-disable-next-line no-var
  var _mongoosePromise: Promise<typeof mongoose> | undefined
}

let cached = global._mongooseConn
let cachedPromise = global._mongoosePromise

async function connectDB(): Promise<typeof mongoose> {
  if (cached) return cached

  if (!cachedPromise) {
    cachedPromise = mongoose.connect(MONGODB_URI, { bufferCommands: false })
  }

  cached = await cachedPromise
  global._mongooseConn = cached
  global._mongoosePromise = cachedPromise
  return cached
}

export default connectDB
