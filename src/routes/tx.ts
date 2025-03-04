import { Request, Response, Router } from 'express'
import { fetchWrapper } from '../fetch-wrapper'
import { param } from 'express-validator'
import { validateRequest } from '../middleware/validation'
import {
  ApiLiquidityTxStatusResponse,
  ApiTxStatusResponse,
  GraphqlLiquidityTxStatusResponse,
  GraphqlTxStatusResponse
} from '../types/transaction-status'

const txRouter = Router()

/**
 * @openapi
 * /tx/lp/{txId}/status:
 *   get:
 *     summary: Get LP transaction status
 *     description: Returns the LP transaction status for the given transaction id
 *     tags:
 *       - Tx
 *     parameters:
 *       - in: path
 *         name: txId
 *         required: true
 *         schema:
 *           type: number
 *           description: Transaction id
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
 *                     transaction_status:
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
 *                         amount:
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
txRouter.get(
  '/lp/:txId/status',
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
      const response = await fetchWrapper.get<ApiLiquidityTxStatusResponse>(
        `${process.env.KIMA_BACKEND_NODE_PROVIDER_QUERY}/kima-finance/kima-blockchain/transaction/liquidity_transaction_data/${txId}`
      )
      if (typeof response === 'string') {
        const message = `failed to get status for transaction ${txId}`
        console.error(message, response)
        res.status(500).json({ message })
        return
      }

      // convert to GraphQL response for backwards compatibility
      const data = response.LiquidityTransactionData
      const output = {
        data: {
          liquidity_transaction_data: {
            failreason: data.failReason,
            pullfailcount: Number(data.pullFailCount),
            pullhash: data.tssPullHash,
            releasefailcount: Number(data.releaseFailCount),
            releasehash: data.tssReleaseHash,
            txstatus: data.status,
            amount: Number(data.amount),
            creator: data.creator,
            originaddress: data.providerChainAddress,
            originchain: data.chain,
            originsymbol: data.symbol,
            targetsymbol: data.symbol,
            targetaddress: data.providerKimaAddress,
            targetchain: data.chain,
            tx_id: data.index,
            kimahash: data.kimaTxHash
          }
        }
      } satisfies GraphqlLiquidityTxStatusResponse

      res.status(200).json(output)
    } catch (e) {
      console.error(e)
      res.status(500).send(`failed to get status for transaction ${txId}`)
    }
  }
)

/**
 * @openapi
 * /tx/{txId}/status:
 *   get:
 *     summary: Get transaction status
 *     description: Returns the transaction status for the given transaction id
 *     tags:
 *       - Tx
 *     parameters:
 *       - in: path
 *         name: txId
 *         required: true
 *         schema:
 *           type: number
 *           description: Transaction id
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
 *                     transaction_status:
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
 *                         amount:
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
txRouter.get(
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
      const response = await fetchWrapper.get<ApiTxStatusResponse>(
        `${process.env.KIMA_BACKEND_NODE_PROVIDER_QUERY}/kima-finance/kima-blockchain/transaction/transaction_data/${txId}`
      )
      if (typeof response === 'string') {
        const message = `failed to get status for transaction ${txId}`
        console.error(message, response)
        res.status(500).json({ message })
        return
      }

      // convert to GraphQL response for backwards compatibility
      const data = response.transactionData
      const output = {
        data: {
          transaction_data: {
            failreason: data.failReason,
            pullfailcount: Number(data.pullFailCount),
            pullhash: data.tssPullHash,
            releasefailcount: Number(data.releaseFailCount),
            releasehash: data.tssReleaseHash,
            txstatus: data.status,
            amount: Number(data.amount),
            creator: data.creator,
            originaddress: data.originAddress,
            originchain: data.originChain,
            originsymbol: data.originSymbol,
            targetsymbol: data.targetSymbol,
            targetaddress: data.targetAddress,
            targetchain: data.targetChain,
            tx_id: data.index,
            kimahash: data.kimaTxHash
          }
        }
      } satisfies GraphqlTxStatusResponse

      res.status(200).json(output)
    } catch (e) {
      console.error(e)
      res.status(500).send(`failed to get status for transaction ${txId}`)
    }
  }
)

export default txRouter
