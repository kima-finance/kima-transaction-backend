import { Request, Response, Router } from 'express'
import { authenticateJWT } from '../middleware/auth'
import { submitHtlcLock } from '@kimafinance/kima-transaction-api'
import { complianceService } from '../check-compliance'
import { createTransValidation } from '../middleware/trans-validation'
import { body } from 'express-validator'
import { fetchWrapper } from '../fetch-wrapper'
import { validateRequest } from '../middleware/validation'

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
    validateRequest,
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

    try {
      const denied = await complianceService.check([fromAddress])
      if (denied) {
        return res.status(403).send(denied)
      }

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
      console.error(e)
      res.status(500).send('failed to submit transaction')
    }
  }
)

htlcRouter.get('/:senderAddress', async (req: Request, res: Response) => {
  const { senderAddress } = req.params
  try {
    const result = await fetchWrapper.get(
      `${process.env.KIMA_BACKEND_NODE_PROVIDER_QUERY}/kima-finance/kima-blockchain/transaction/get_htlc_transaction/${senderAddress}`
    )
    res.json(result)
  } catch (e) {
    console.error(e)
    res
      .status(500)
      .send(`failed to get htlc transaction for address ${senderAddress}`)
  }
})

export default htlcRouter
