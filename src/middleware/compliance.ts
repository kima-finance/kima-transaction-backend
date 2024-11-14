import { NextFunction, Request, Response } from 'express'
import { TransactionDetails } from '../types/transaction-details'
import { complianceService } from '../check-compliance'

export const checkCompliance = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  if (!complianceService.enabled) {
    return next()
  }

  const { originAddress, targetAddress } = req.body as TransactionDetails

  const {
    isCompliant,
    isError,
    results: checkResult
  } = await complianceService.check([originAddress, targetAddress])

  if (isError) {
    return res.status(500).json(checkResult)
  }

  if (!isCompliant) {
    return res.status(403).send(checkResult)
  }

  next()
}
