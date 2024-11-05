import { NextFunction, Request, Response } from 'express'
import jwt from 'jsonwebtoken'

export const authenticateJWT = (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  if (process.env.NODE_ENV === 'test') {
    next()
    return
  }

  const token = req.cookies.authToken
  const {
    originAddress,
    originChain,
    targetAddress,
    targetChain,
    symbol,
    amount,
    fee
  } = req.body

  if (token) {
    jwt.verify(
      token,
      process.env.KIMA_BACKEND_SECRET as string,
      (err: any, params: any) => {
        if (
          err ||
          params.originAddress !== originAddress ||
          params.originChain !== originChain ||
          params.targetAddress !== targetAddress ||
          params.targetChain !== targetChain ||
          params.symbol !== symbol ||
          params.amount !== amount ||
          params.fee !== fee
        )
          return res.sendStatus(401)

        next()
      }
    )
  } else {
    res.sendStatus(401)
  }
}
