import complianceService from '@features/compliance/services/compliance.service'
import { TransactionDetails } from '@features/submit/types/transaction-details'
import { NextFunction, Request, Response } from 'express'
import { z } from 'zod'

type TransactionDetailsType = z.infer<typeof TransactionDetails>

/**
 * Check if the address is compliant. Only enabled if COMPLIANCE_URL is set.
 * If the address is not compliant, the response will be 403 with the error message.
 *
 * @async
 * @param {Request} req
 * @param {Response} res
 * @param {NextFunction} next
 */
export const checkCompliance = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  if (!complianceService.enabled) {
    return next()
  }

  const { originAddress, targetAddress } = req.body as TransactionDetailsType

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
