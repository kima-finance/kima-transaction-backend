import { NextFunction, Request, Response } from 'express'
import * as Sentry from '@sentry/node'

export interface SentryResponse extends Response {
  sentry?: unknown
}

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
  res: SentryResponse,
  next: NextFunction
) => {
  console.error('Unhandled Error:', err)

  if (res.headersSent) {
    console.debug('Unhanlded Error handler: headers already sent')
    return next(err)
  }

  if (!res.sentry) {
    console.debug('Unhandled Error handler: manually capturing sentry error')
    Sentry.captureException(err)
  } else {
    console.debug(
      'Unhandled Error handler: sentry already captured',
      res.sentry
    )
  }

  res.status(500).send('internal server error')
}
