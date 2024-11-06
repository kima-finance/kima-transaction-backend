import { NextFunction, Request, Response } from 'express'
import jwt from 'jsonwebtoken'

/**
 * Transaction details in the body must match the JWT
 *
 * @param {Request} req
 * @param {Response} res
 * @param {NextFunction} next
 */
export const authenticateJWT = (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  const token = req.cookies.authToken
  const {
    originAddress,
    originChain,
    originSymbol,
    targetAddress,
    targetChain,
    targetSymbol,
    amount,
    fee
  } = req.body

  if (token) {
    jwt.verify(
      token,
      process.env.KIMA_BACKEND_SECRET as string,
      (err: any, params: any) => {
        // compare transaction details in the body to the JWT
        if (
          err ||
          params.originAddress !== originAddress ||
          params.originChain !== originChain ||
          params.targetAddress !== targetAddress ||
          params.targetChain !== targetChain ||
          params.originSymbol !== originSymbol ||
          params.targetSymbol !== targetSymbol ||
          params.amount !== amount ||
          params.fee !== fee
        ) {
          return res.sendStatus(401)
        }

        // body matches JWT
        next()
      }
    )
  } else {
    res.sendStatus(401)
  }
}
