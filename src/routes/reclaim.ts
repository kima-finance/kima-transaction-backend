import { Request, Response, Router } from 'express'
import { HtlcReclaim } from '@kimafinance/kima-transaction-api'
import { createTransValidation } from '../middleware/trans-validation'
import { body } from 'express-validator'
import { validateRequest } from '../middleware/validation'

const reclaimRouter = Router()

/**
 * @openapi
 * /reclaim:
 *   post:
 *     summary: Submit Bitcoin HTLC reclaim transaction
 *     description: Submit Bitcoin HTLC reclaim transaction
 *     tags:
 *       - Reclaim
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
 *               senderAddress:
 *                 type: string
 *                 description: Sender address
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
 *       500:
 *         description: Internal server error
 *         content:
 *           text/plain:
 *             schema:
 *               type: string
 */
reclaimRouter.post(
  '/',
  [
    ...createTransValidation(),
    body('senderAddress').notEmpty(),
    body('txHash').isHexadecimal(),
    validateRequest
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
