import cors from 'cors'

export const corsConfig = cors({
  origin: (origin, callback) => {
    if (
      process.env.NODE_ENV === 'test' ||
      (process.env.NODE_ENV === 'development' && !origin)
    ) {
      callback(null, true)
      return
    }

    if (!origin) {
      callback(null, true)
      return
    }

    const originHostname = new URL(origin as string).hostname
    const domains = (process.env.DOMAIN as string).split(',')

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
