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

    const hostname = new URL(origin as string).hostname
    const domains = (process.env.DOMAIN as string).split(',')

    for (let i = 0; i < domains.length; i++) {
      if (domains[i].length && hostname.endsWith(domains[i])) {
        callback(null, true)
        return
      }
    }

    callback(new Error())
  },
  credentials: true
})
