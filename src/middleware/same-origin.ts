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
  const originDomain = (req.headers['x-forwarded-host'] ||
    req.headers['host']) as string

  const domains = (process.env.DOMAIN as string).split(',')

  for (let i = 0; i < domains.length; i++) {
    if (domains[i].length && originDomain.endsWith(domains[i])) {
      return next()
    }
  }

  return res
    .status(401)
    .send({ message: `Not Same Origin for: ${originDomain}` }).send
}
