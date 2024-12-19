import { NextFunction, Request, Response } from 'express'
import { validationResult } from 'express-validator'

/**
 * Handles express-validator validation errors. Returns 400 with the errors.
 * Add this after express-validator middleware in a route.
 * i.e `router.post('/submit', [body('amount')..., validateRequest], ...)`
 *
 * @param {Request} req
 * @param {Response} res
 * @param {NextFunction} next
 */
export const validateRequest = (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  const result = validationResult(req)

  if (!result.isEmpty()) {
    return res.status(400).json({ errors: result.array() })
  }

  next()
}
