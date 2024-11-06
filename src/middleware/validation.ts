import { NextFunction, Request, Response } from 'express'
import { validationResult } from 'express-validator'

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
