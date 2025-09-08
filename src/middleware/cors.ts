import cors from 'cors'
import { ENV } from '../env-validate'
import { isDev, isTest } from '../constants'
import { toUrl } from '../utils'

export const corsConfig = cors({
  origin: (origin, callback) => {
    // Allow tests, local dev, and non-browser (no origin)
    if (isTest || isDev || !origin) {
      callback(null, true)
      return
    }

    try {
      const originHostname = new URL(origin).hostname
      const domains = ENV.DOMAIN.split(',')
        .map((d) => d.trim())
        .filter(Boolean)

      for (const domain of domains) {
        const domainHostname = toUrl(domain).hostname
        if (originHostname.endsWith(domainHostname)) {
          callback(null, true)
          return
        }
      }
    } catch (e) {
      console.error('corsConfig: error', e)
    }

    callback(new Error('Not allowed by CORS'))
  },
  credentials: true
})
