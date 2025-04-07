import cors from 'cors'
import { ENV } from '../env-validate'
import { isDev, isTest } from '../constants'
import { toUrl } from '../utils'

export const corsConfig = cors({
  origin: (origin, callback) => {
    if (isTest || isDev || !origin) {
      // allow requests from test environments and curl
      // attempting to block non-browser calls with CORS is not effective
      // use IP whitelisting instead
      callback(null, true)
      return
    }

    if (!origin) {
      callback(null, true)
      return
    }

    try {
      const originHostname = new URL(origin as string).hostname
      const domains = ENV.DOMAIN.split(',')

      for (const domain of domains.filter((domain) => !!domain)) {
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
  }
})
