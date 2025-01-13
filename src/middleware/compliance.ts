import { NextFunction, Request, Response } from 'express'
import { TransactionDetails } from '../types/transaction-details'
import { complianceService } from '../check-compliance'
import { ChainName } from '../types/chain-name'

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

  const { originAddress, targetAddress, targetChain } =
    req.body as TransactionDetails
  if (targetChain === ChainName.MASTERCARD) {
    // the compliance is handled by the Mastercard API
    return next()
  }

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
