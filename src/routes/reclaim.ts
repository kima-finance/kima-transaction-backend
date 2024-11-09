import { Request, Response, Router } from 'express'
import { authenticateJWT } from '../middleware/auth'
import { HtlcReclaim } from '@kimafinance/kima-transaction-api'
import { createTransValidation } from '../middleware/trans-validation'
import { body } from 'express-validator'

const reclaimRouter = Router()

reclaimRouter.post(
  '/',
  [
    ...createTransValidation(),
    body('senderAddress').notEmpty(),
    body('txHash').isHexadecimal(),
    authenticateJWT
  ],
  async (req: Request, res: Response) => {
    const { senderAddress, txHash } = req.body

    console.log(req.body)

    try {
      const result = await HtlcReclaim({
        senderAddress,
        txHash
      })
      console.log(result)
      res.send(result)
    } catch (e) {
      console.log(e)
      res.status(500).send('failed to submit transaction')
    }
  }
)

export default reclaimRouter
