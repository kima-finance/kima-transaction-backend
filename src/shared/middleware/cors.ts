import cors, { type CorsOptions } from 'cors'
import ENV from 'core/env'

const normalizeOrigin = (raw: string) => {
  const trimmed = raw.trim()
  if (!trimmed) return null
  if (trimmed === '*') return '*'
  return trimmed.startsWith('http://') || trimmed.startsWith('https://')
    ? trimmed
    : `https://${trimmed}`
}

const ALLOWED_ORIGINS = (ENV.DOMAIN ?? '')
  .split(',')
  .map(normalizeOrigin)
  .filter((v): v is string => Boolean(v))

const isAllowed = (origin?: string) => {
  if (!origin) return true // same-origin / curl
  if (ALLOWED_ORIGINS.includes('*')) return true
  try {
    const o = new URL(origin)
    return ALLOWED_ORIGINS.some((allowed) => {
      try {
        const a = new URL(allowed)
        // match protocol + hostname; if allowed specifies a port, require exact port match
        const hostMatch =
          a.hostname === o.hostname &&
          a.protocol === o.protocol &&
          (a.port ? a.port === o.port : true)
        return hostMatch
      } catch {
        return allowed === origin
      }
    })
  } catch {
    return false
  }
}

const options: CorsOptions = {
  origin: (origin, cb) =>
    isAllowed(origin)
      ? cb(null, true)
      : cb(new Error(`CORS blocked: ${origin ?? '<no-origin>'}`)),
  credentials: true,
  methods: ['GET', 'HEAD', 'PUT', 'PATCH', 'POST', 'DELETE', 'OPTIONS'],
  allowedHeaders: [
    'Origin',
    'X-Requested-With',
    'Content-Type',
    'Accept',
    'Authorization',
    'x-request-id'
  ],
  exposedHeaders: ['x-request-id'],
  maxAge: 86400,
  preflightContinue: false,
  optionsSuccessStatus: 204
}

const corsMiddleware = cors(options)
export default corsMiddleware
