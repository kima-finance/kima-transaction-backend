import { NextFunction, Request, Response } from 'express'
import { validate } from '../validate'
import { customTransValidation } from '../custom-trans-validation'

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
