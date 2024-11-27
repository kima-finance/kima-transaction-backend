import { NextFunction, Request, Response } from 'express'

/**
 * Middleware to reject cross-origin requests. Only enabled in production.
 * This code is similar to the CORS config in `cors.ts` but sometimes the origin domain
 * supplied to the CORS config is empty. This will catch more cases.
 *
 * @param {Request} req
 * @param {Response} res
 * @param {NextFunction} next
 */
export const sameOriginOnly = (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  if (
    process.env.NODE_ENV === 'test' ||
    process.env.NODE_ENV === 'development'
  ) {
    return next()
  }
  const xforwardedHost = req.headers['x-forwarded-host']
  const host = req.headers['host']
  const referrer = req.headers['referer']
  let originDomain = (xforwardedHost || referrer || host) as string
  const originHostname = new URL(originDomain).hostname

  const domains = (process.env.DOMAIN as string).split(',')

  for (const domain of domains.filter((domain) => !!domain)) {
    const domainHostname = new URL(domain).hostname
    if (originHostname.endsWith(domainHostname)) {
      return next()
    }
  }

  return res
    .status(401)
    .send({ message: `Not Same Origin for: ${originDomain}` }).send
}
