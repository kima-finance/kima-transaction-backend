import { NextFunction, Request, Response } from 'express'

export const rejectSameOrigin = (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  if (process.env.NODE_ENV === 'test') {
    // will allways be same origin in test
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
    .send({ message: `Same Origin Issue for: ${originDomain}` })
}
