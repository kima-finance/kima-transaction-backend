import { validateRequest } from '@shared/middleware/validation'
import { Router, type Request, type Response } from 'express'
import { param } from 'express-validator'
import {
  ApiLiquidityTxStatusResponse,
  ApiTxStatusResponse,
  GraphqlLiquidityTxStatusResponse,
  GraphqlTxStatusResponse
} from '../types/transaction-status'
import ENV from 'core/env'
import fetchWrapper from '@shared/http/fetch'

const router = Router()

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
 *       500:
 *         description: Internal server error
 */
router.get(
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
        `${ENV.KIMA_BACKEND_NODE_PROVIDER_QUERY}/kima-finance/kima-blockchain/transaction/liquidity_transaction_data/${txId}`
      )
      if (typeof response === 'string') {
        const message = `failed to get status for transaction ${txId}`
        console.error(message, response)
        res.status(500).json({ message })
        return
      }

      const data = response.LiquidityTransactionData
      const output = {
        data: {
          liquidity_transaction_data: {
            failreason: data.failReason,
            pullfailcount: Number(data.pullFailCount),
            pullhash: data.tssPullHash,
            releasefailcount: Number(data.releaseFailCount),
            releasehash: data.tssReleaseHash,
            refundhash: data.tssRefundHash,
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
 *       500:
 *         description: Internal server error
 */
router.get('/:txId/status', async (req: Request, res: Response) => {
  const { txId } = req.params

  try {
    const response = await fetchWrapper.get<ApiTxStatusResponse>(
      `${ENV.KIMA_BACKEND_NODE_PROVIDER_QUERY}/kima-finance/kima-blockchain/transaction/transaction_data/${txId}`
    )

    if (typeof response === 'string') {
      const message = `failed to get status for transaction ${txId}`
      console.error(message, response)
      res.status(500).json({ message })
      return
    }

    // Support both real API and simulator format
    const data =
      (response as any).transactionData ??
      (response as any).data?.transaction_data?.[0]

    if (!data) {
      const message = `No transaction data found for ${txId}`
      console.error(message)
      res.status(404).json({ message })
      return
    }

    const output = {
      data: {
        transaction_data: {
          failreason: data.failReason ?? data.failreason ?? '',
          pullfailcount: Number(data.pullFailCount ?? data.pullfailcount ?? 0),
          pullhash: data.tssPullHash ?? data.pullhash ?? '',
          releasefailcount: Number(
            data.releaseFailCount ?? data.releasefailcount ?? 0
          ),
          releasehash: data.tssReleaseHash ?? data.releasehash ?? '',
          refundhash: data.tssRefundHash ?? data.refundhash ?? '',
          txstatus: data.status ?? data.txstatus ?? 'pending',
          amount: Number(data.amount ?? 0),
          creator: data.creator ?? '',
          originaddress: data.originAddress ?? data.originaddress ?? '',
          originchain: data.originChain ?? data.originchain ?? '',
          originsymbol: data.originSymbol ?? data.originsymbol ?? '',
          targetsymbol: data.targetSymbol ?? data.targetsymbol ?? '',
          targetaddress: data.targetAddress ?? data.targetaddress ?? '',
          targetchain: data.targetChain ?? data.targetchain ?? '',
          tx_id: data.index ?? data.tx_id ?? txId,
          kimahash: data.kimaTxHash ?? data.kimahash ?? ''
        }
      }
    } satisfies GraphqlTxStatusResponse

    res.status(200).json(output)
  } catch (e) {
    console.error(`Error in /tx/${req.params.txId}/status`, e)
    res
      .status(500)
      .send(`failed to get status for transaction ${req.params.txId}`)
  }
})

export default router
