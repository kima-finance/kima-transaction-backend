import { NextFunction, Request, Response } from 'express'

export const unhandledError = (
  err: any,
  req: Request,
  res: Response,
  next: NextFunction
) => {
  console.error('Unhandled Error:', err)

  if (res.headersSent) {
    return next(err)
  }

  res.status(500).send('internal server error')
}
