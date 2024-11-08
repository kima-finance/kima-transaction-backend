import { Request, Response, Router } from 'express'
import { authenticateJWT } from '../middleware/auth'
import { submitKimaTransaction } from '@kimafinance/kima-transaction-api'
import { validate } from '../validate'
import { createTransValidation } from '../middleware/trans-validation'
import { validateRequest } from '../middleware/validation'
import { body } from 'express-validator'
import { complianceService } from '../check-compliance'

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

export default submitRouter
