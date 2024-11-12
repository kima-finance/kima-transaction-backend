import { Request, Response, Router } from 'express'
import { authenticateJWT } from '../middleware/auth'
import { HtlcReclaim } from '@kimafinance/kima-transaction-api'
import { createTransValidation } from '../middleware/trans-validation'
import { body } from 'express-validator'
import { validateRequest } from '../middleware/validation'

const reclaimRouter = Router()

reclaimRouter.post(
  '/',
  [
    ...createTransValidation(),
    body('senderAddress').notEmpty(),
    body('txHash').isHexadecimal(),
    validateRequest,
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
      console.error(e)
      res.status(500).send('failed to submit transaction')
    }
  }
)

export default reclaimRouter
