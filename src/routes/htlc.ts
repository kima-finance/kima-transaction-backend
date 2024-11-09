import { Request, Response, Router } from 'express'
import { authenticateJWT } from '../middleware/auth'
import { submitHtlcLock } from '@kimafinance/kima-transaction-api'
import { complianceService } from '../check-compliance'
import { createTransValidation } from '../middleware/trans-validation'
import { body } from 'express-validator'

const htlcRouter = Router()

htlcRouter.post(
  '/',
  [
    ...createTransValidation(),
    body('fromAddress').notEmpty(),
    body('senderPubkey').notEmpty(),
    body('htlcTimeout').notEmpty(),
    body('htlcAddress').notEmpty(),
    body('txHash').isHexadecimal(),
    authenticateJWT
  ],
  async (req: Request, res: Response) => {
    const {
      fromAddress,
      senderPubkey,
      amount,
      htlcTimeout,
      htlcAddress,
      txHash
    } = req.body

    console.log(req.body)

    const denied = await complianceService.check([fromAddress])
    if (denied) {
      return res.status(403).send(denied)
    }

    try {
      const result = await submitHtlcLock({
        fromAddress,
        amount,
        htlcTimeout,
        htlcAddress,
        txHash,
        senderPubkey
      })
      console.log(result)
      res.send(result)
    } catch (e) {
      console.log(e)
      res.status(500).send('failed to submit transaction')
    }
  }
)

export default htlcRouter
