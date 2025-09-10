import { Request, Response, Router } from 'express'
import { fetchWrapper } from '../fetch-wrapper'
import { param } from 'express-validator'
import { validateRequest } from '../middleware/validation'
import {
  ApiSwapTxStatusResponse,
  GraphqlSwapTxStatusResponse,
} from '../types/swap-status'
import { ENV } from '../env-validate'

const swapTxRouter = Router()

/**
 * @openapi
 * /swap_tx/{txId}/status:
 *   get:
 *     summary: Get swap transaction status
 *     description: Returns the transaction status for the given transaction id
 *     tags:
 *       - Swap Tx
 *     parameters:
 *       - in: path
 *         name: txId
 *         required: true
 *         schema:
 *           type: number
 *           description: Swap transaction id
 *     responses:
 *       200:
 *         description: Successful response
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 data:
 *                   type: object
 *                   properties:
 *                     swap_data:
 *                       type: object
 *                       properties:
 *                         failreason:
 *                           type: string
 *                         pullfailcount:
 *                           type: number
 *                         pullhash:
 *                           type: string
 *                         releasefailcount:
 *                           type: number
 *                         releasehash:
 *                           type: string
 *                         txstatus:
 *                           type: string
 *                         amountIn:
 *                           type: number
 *                         amountOut:
 *                           type: number
 *                         creator:
 *                           type: string
 *                         originaddress:
 *                           type: string
 *                         originchain:
 *                           type: string
 *                         originsymbol:
 *                           type: string
 *                         targetsymbol:
 *                           type: string
 *                         targetaddress:
 *                           type: string
 *                         targetchain:
 *                           type: string
 *                         dex:
 *                           type: string
 *                         slippage:
 *                           type: string
 *                         tx_id:
 *                           type: string
 *                         kimahash:
 *                           type: string
 *       500:
 *         description: Internal server error
 *         content:
 *           text/plain:
 *             schema:
 *               type: string
 */
swapTxRouter.get(
  '/:txId/status',
  [
    param('txId')
      .isInt()
      .withMessage(
        'txId must be a valid tx id (a sequential numeric value different from the hash)'
      ),
    validateRequest
  ],
  async (req: Request, res: Response) => {
    const { txId } = req.params

    try {
      const response = await fetchWrapper.get<ApiSwapTxStatusResponse>(
        `${ENV.KIMA_BACKEND_NODE_PROVIDER_QUERY}/kima-finance/kima-blockchain/swap/swap_data/${txId}`
      )
      if (typeof response === 'string') {
        const message = `failed to get status for swap transaction ${txId}`
        console.error(message, response)
        res.status(500).json({ message })
        return
      }

      // convert to GraphQL response for backwards compatibility
      const data = response.swapData
      const output = {
        data: {
          swap_data: {
            failreason: data.failReason,
            pullfailcount: Number(data.pullFailCount),
            pullhash: data.tssPullHash,
            releasefailcount: Number(data.releaseFailCount),
            releasehash: data.tssReleaseHash,
            refundhash: data.tssRefundHash,
            txstatus: data.status,
            amountIn: Number(data.amountIn),
            amountOut: Number(data.amountOut),
            creator: data.creator,
            originaddress: data.originAddress,
            originchain: data.originChain,
            originsymbol: data.originSymbol,
            targetsymbol: data.targetSymbol,
            targetaddress: data.targetAddress,
            targetchain: data.targetChain,
            dex: data.dex,
            slippage: data.slippage,
            tx_id: data.index,
            kimahash: data.kimaTxHash
          }
        }
      } satisfies GraphqlSwapTxStatusResponse

      res.status(200).json(output)
    } catch (e) {
      console.error(e)
      res.status(500).send(`failed to get status for swap transaction ${txId}`)
    }
  }
)

export default swapTxRouter
