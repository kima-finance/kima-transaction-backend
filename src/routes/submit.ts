import { Request, Response, Router } from 'express'
import { authenticateJWT } from '../middleware/auth'
import { submitKimaTransaction } from '@kimafinance/kima-transaction-api'
import { validate } from '../validate'
import { createTransValidation } from '../middleware/trans-validation'
import { validateRequest } from '../middleware/validation'
import { body, query } from 'express-validator'
import { complianceService } from '../check-compliance'
import { hexStringToUint8Array } from '../utils'
import { ChainName } from '../types/chain-name'
import { calcServiceFee } from '../fees'

const submitRouter = Router()

/**
 * Submit a transaction to Kima Chain
 * @requires cookie from /auth. The transaction details in the body must match
 * what was passed to /auth.
 */
submitRouter.post(
  '/',
  [
    ...createTransValidation(),
    body('htlcCreationHash').optional(),
    body('htlcCreationVout').optional().isInt({ gt: 0 }),
    body('htlcExpirationTimestamp').optional().notEmpty(),
    body('htlcVersion').optional().notEmpty(),
    body('senderPubKey').optional().notEmpty(),
    validateRequest,
    authenticateJWT
  ],
  async (req: Request, res: Response) => {
    const {
      originAddress,
      originChain,
      originSymbol,
      targetAddress,
      targetChain,
      targetSymbol,
      amount,
      fee,
      htlcCreationHash,
      htlcCreationVout,
      htlcExpirationTimestamp,
      htlcVersion,
      senderPubKey
    } = req.body

    console.log(req.body)

    if (!(await validate(req))) {
      return res.status(400).send('validation error')
    }

    const denied = await complianceService.check([originAddress, targetAddress])
    if (denied) {
      return res.status(403).send(denied)
    }

    try {
      const result = await submitKimaTransaction({
        originAddress,
        originChain,
        targetAddress,
        targetChain,
        originSymbol,
        targetSymbol,
        amount,
        fee,
        htlcCreationHash,
        htlcCreationVout,
        htlcExpirationTimestamp,
        htlcVersion,
        senderPubKey: hexStringToUint8Array(senderPubKey)
      })
      console.log(result)
      res.send(result)
    } catch (e) {
      console.log(e)
      res.status(500).send('failed to submit transaction')
    }
  }
)

submitRouter.get(
  '/fees',
  [
    query('amount')
      .isFloat({ gt: 0 })
      .withMessage('amount must be greater than 0'),
    query('originChain')
      .isIn(Object.values(ChainName))
      .withMessage('sourceChain must be a valid chain name'),
    query('targetChain')
      .isIn(Object.values(ChainName))
      .withMessage('targetChain must be a valid chain name'),
    validateRequest
  ],
  async (req: Request, res: Response) => {
    const { amount, originChain, targetChain } = req.query
    try {
      const totalFeeUsd = await calcServiceFee({
        amount: +amount!,
        originChain: originChain as ChainName,
        targetChain: targetChain as ChainName
      })
      res.send({ totalFeeUsd })
    } catch (e) {
      console.log(e)
      res.status(500).send('failed to get fee')
    }
  }
)

export default submitRouter
