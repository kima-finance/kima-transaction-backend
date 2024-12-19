import { NextFunction, Request, Response } from 'express'

/**
 * Catch all error handler. Logs the error and returns 500 with the error message.
 *
 * @param {*} err
 * @param {Request} req
 * @param {Response} res
 * @param {NextFunction} next
 */
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
