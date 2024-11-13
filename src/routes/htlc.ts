import { Request, Response, Router } from 'express'
import { authenticateJWT } from '../middleware/auth'
import { submitHtlcLock } from '@kimafinance/kima-transaction-api'
import { complianceService } from '../check-compliance'
import { createTransValidation } from '../middleware/trans-validation'
import { body } from 'express-validator'
import { fetchWrapper } from '../fetch-wrapper'
import { validateRequest } from '../middleware/validation'

const htlcRouter = Router()

/**
 * @openapi
 * /htlc:
 *   post:
 *     summary: Submit Bitcoin HTLC lock transaction
 *     description: Submit Bitcoin HTLC lock transaction
 *     tags:
 *       - HTLC
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               amount:
 *                 type: number
 *                 description: Amount to send
 *               fee:
 *                 type: number
 *                 description: Fee to pay
 *               originAddress:
 *                 type: string
 *                 description: Origin address
 *               originChain:
 *                 type: string
 *                 description: Origin chain
 *                 enum:
 *                   - ARBITRUM
 *                   - AVALANCHE
 *                   - BSC
 *                   - BTC
 *                   - ETHEREUM
 *                   - FIAT
 *                   - OPTIMISM
 *                   - POLYGON
 *                   - POLYGON_ZKEVM
 *                   - SOLANA
 *                   - TRON
 *               targetAddress:
 *                 type: string
 *                 description: Target address
 *               targetChain:
 *                 type: string
 *                 description: Target chain
 *                 enum:
 *                   - ARBITRUM
 *                   - AVALANCHE
 *                   - BSC
 *                   - BTC
 *                   - ETHEREUM
 *                   - FIAT
 *                   - OPTIMISM
 *                   - POLYGON
 *                   - POLYGON_ZKEVM
 *                   - SOLANA
 *                   - TRON
 *               targetSymbol:
 *                 type: string
 *                 description: Target symbol
 *               fromAddress:
 *                 type: string
 *                 description: Sender address
 *               senderPubkey:
 *                 type: string
 *                 description: Sender public key
 *               htlcTimeout:
 *                 type: number
 *                 description: HTLC timeout
 *               htlcAddress:
 *                 type: string
 *                 description: HTLC address
 *               txHash:
 *                 type: string
 *                 description: HTLC transaction hash
 *     responses:
 *       200:
 *         description: Successful response
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 code:
 *                   type: number
 *                 data:
 *                   type: object
 *                   properties:
 *                     msgType:
 *                       type: string
 *                     data:
 *                       type: array
 *                       items:
 *                 events:
 *                   type: array
 *                   items:
 *                     type: object
 *                     properties:
 *                       type:
 *                         type: string
 *                       attributes:
 *                         type: string
 *                         format: byte
 *                 msgResponses:
 *                   type: array
 *                   items:
 *                     type: object
 *                     properties:
 *                       typeUrl:
 *                         type: string
 *                       value:
 *                         type: string
 *                         format: byte
 *                 gasUsed:
 *                   type: number
 *                 gasWanted:
 *                   type: number
 *                 height:
 *                   type: number
 *                 rawLog:
 *                   type: string
 *                 transactionHash:
 *                   type: string
 *                 txIndex:
 *                   type: string
 *       403:
 *         description: Address is not compliant. Applies if compliance is enabled.
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 isCompliant:
 *                   type: boolean
 *                 isError:
 *                   type: boolean
 *                 results:
 *                   type: object
 *                   properties:
 *                     address:
 *                       type: string
 *                     error:
 *                       type: string
 *       500:
 *         description: Internal server error
 *         content:
 *           text/plain:
 *             schema:
 *               type: string
 *
 */
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
