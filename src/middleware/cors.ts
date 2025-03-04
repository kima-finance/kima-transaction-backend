import cors from 'cors'
import { ENV } from '../env-validate'
import { isDev, isTest } from '../constants'

export const corsConfig = cors({
  origin: (origin, callback) => {
    if (isTest || isDev || !origin) {
      callback(null, true)
      return
    }

    const originHostname = new URL(origin as string).hostname
    const domains = (ENV.DOMAIN as string).split(',')

    for (const domain of domains.filter((domain) => !!domain)) {
      const domainHostname = new URL(domain).hostname
      if (originHostname.endsWith(domainHostname)) {
        callback(null, true)
        return
      }
    }

    callback(new Error('Not allowed by CORS'))
  },
  credentials: true
})
