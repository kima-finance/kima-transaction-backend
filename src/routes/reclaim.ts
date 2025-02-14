import { Request, Response, Router } from 'express'
import { HtlcReclaim } from '@kimafinance/kima-transaction-api'
import { body } from 'express-validator'
import { validateRequest } from '../middleware/validation'

const reclaimRouter = Router()

/**
 * @openapi
 * /reclaim:
 *   post:
 *     summary: (DISABLED) Submit Bitcoin HTLC reclaim transaction
 *     description: (DISABLED untiled BTC supported added to mainnet) Submit Bitcoin HTLC reclaim transaction
 *     tags:
 *       - Reclaim (DISABLED)
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
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
