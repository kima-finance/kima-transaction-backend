import customTransValidation from '@features/submit/services/custom-trans-validation.service'
import validate from '@features/submit/services/validation.service'
import { NextFunction, Request, Response } from 'express'

export const transValidation = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  let error = await validate(req)
  if (error) {
    return res.status(400).send(error)
  }

  error = await customTransValidation(req)
  if (error) {
    return res.status(400).send(error)
  }

  next()
}
