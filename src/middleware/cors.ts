import cors from 'cors'
import { toUrl } from '../utils'

export const corsConfig = cors({
  origin: (origin, callback) => {
    if (
      process.env.NODE_ENV === 'test' ||
      process.env.NODE_ENV === 'development' ||
      !origin
    ) {
      // allow requests from localhost and test environments
      // attempting to block localhost with CORS is not effective
      // use IP whitelisting instead
      callback(null, true)
      return
    }

    try {
      const originHostname = toUrl(origin).hostname
      const domains = (process.env.DOMAIN as string).split(',')

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
  },
  credentials: true
})
