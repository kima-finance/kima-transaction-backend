import { Router, type Request, type Response } from 'express'
import { param } from 'express-validator'
import { validateRequest } from '@shared/middleware/validation'
import fetchWrapper from '@shared/http/fetch'
import {
  ApiSwapTxStatusResponse,
  GraphqlSwapTxStatusResponse,
  HtlcLockRequestStatus
} from '../types/swap-status'
import ENV from 'core/env'
import { HtlcTransactionResponseDto } from '@features/htlc/types/htlc-transaction.dto'

const router = Router()

const toFiniteNumber = (value: unknown, fallback = 0): number => {
  const parsed = Number(value)
  return Number.isFinite(parsed) ? parsed : fallback
}

const normalizeHtlcLockRequest = (
  raw: Partial<HtlcLockRequestStatus> | undefined
): HtlcLockRequestStatus | null => {
  if (!raw) return null
  return {
    id: String(raw.id ?? ''),
    senderAddress: String(raw.senderAddress ?? ''),
    senderPubkey: String(raw.senderPubkey ?? ''),
    htlcTimestamp: String(raw.htlcTimestamp ?? ''),
    amount: String(raw.amount ?? ''),
    txHash: String(raw.txHash ?? ''),
    status: String(raw.status ?? ''),
    errReason: String(raw.errReason ?? ''),
    creator: String(raw.creator ?? ''),
    htlcAddress: String(raw.htlcAddress ?? ''),
    pull_status: String(raw.pull_status ?? '')
  }
}

const normalizeHash = (value: unknown): string =>
  String(value ?? '')
    .trim()
    .toLowerCase()

const parseOptions = (raw: unknown): Record<string, unknown> => {
  if (!raw || typeof raw !== 'string') return {}
  try {
    const parsed = JSON.parse(raw)
    return parsed && typeof parsed === 'object'
      ? (parsed as Record<string, unknown>)
      : {}
  } catch {
    return {}
  }
}

const getHtlcCreationHashFromSwapData = (data: any): string => {
  const options = parseOptions(data?.options)
  return (
    String(
      data?.htlcCreationHash ??
        data?.htlc_creation_hash ??
        options?.htlcCreationHash ??
        options?.htlc_creation_hash ??
        ''
    ).trim() || ''
  )
}

const getSenderHtlcLockRequest = async (args: {
  senderAddress: string
  txHash: string
  txId: string
}): Promise<HtlcLockRequestStatus | null> => {
  if (!args.senderAddress || !args.txHash) return null

  try {
    const response = await fetchWrapper.get<HtlcTransactionResponseDto>(
      `${ENV.KIMA_BACKEND_NODE_PROVIDER_QUERY}/kima-finance/kima-blockchain/transaction/get_htlc_transaction/${encodeURIComponent(args.senderAddress)}`
    )

    if (typeof response === 'string') {
      console.warn(
        `[swap_tx/${args.txId}/status] failed to fetch htlc lock request`,
        response
      )
      return null
    }

    const senderAddressLower = args.senderAddress.toLowerCase()
    const txHash = normalizeHash(args.txHash)
    const record =
      (response.htlcLockingTransaction ?? [])
      .map((item) => normalizeHtlcLockRequest(item))
      .find(
        (item): item is HtlcLockRequestStatus =>
          item !== null &&
          item.senderAddress.toLowerCase() === senderAddressLower &&
          normalizeHash(item.txHash) === txHash
      )
    return record ?? null
  } catch (error) {
    console.warn(
      `[swap_tx/${args.txId}/status] failed to fetch htlc lock request`,
      error
    )
    return null
  }
}

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
 *       500:
 *         description: Internal server error
 */
router.get(
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

      const data =
        (response as any).swapData ??
        (response as any).swap_data ??
        (response as any).data?.swap_data?.[0] ??
        (response as any).data?.swap_data

      if (!data) {
        const message = `No swap data found for ${txId}`
        console.error(message, response)
        res.status(404).json({ message })
        return
      }

      const amountInRaw =
        data.amountIn ?? data.amount_in ?? data.amount ?? data.amountOut
      const amountOutRaw =
        data.amountOut ?? data.amount_out ?? data.amount ?? amountInRaw
      const originAddress = data.originAddress ?? data.originaddress ?? ''
      const originChain = data.originChain ?? data.originchain ?? ''
      const htlcCreationHash = getHtlcCreationHashFromSwapData(data)

      const htlcLockRequest =
        originChain.toUpperCase() === 'BTC'
          ? await getSenderHtlcLockRequest({
              senderAddress: originAddress,
              txHash: htlcCreationHash,
              txId
            })
          : null

      const output = {
        data: {
          swap_data: {
            failreason: data.failReason ?? data.failreason ?? '',
            pullfailcount: toFiniteNumber(
              data.pullFailCount ?? data.pullfailcount
            ),
            pullhash: data.tssPullHash ?? data.pullhash ?? '',
            releasefailcount: toFiniteNumber(
              data.releaseFailCount ?? data.releasefailcount
            ),
            releasehash: data.tssReleaseHash ?? data.releasehash ?? '',
            refundhash: data.tssRefundHash ?? data.refundhash ?? '',
            txstatus: data.status ?? data.txstatus ?? 'pending',
            amountIn: toFiniteNumber(amountInRaw),
            amountOut: toFiniteNumber(amountOutRaw),
            creator: data.creator ?? '',
            originaddress: originAddress,
            originchain: originChain,
            originsymbol: data.originSymbol ?? data.originsymbol ?? '',
            targetsymbol: data.targetSymbol ?? data.targetsymbol ?? '',
            targetaddress: data.targetAddress ?? data.targetaddress ?? '',
            targetchain: data.targetChain ?? data.targetchain ?? '',
            dex: data.dex ?? '',
            slippage: data.slippage ?? '',
            tx_id: data.index ?? data.tx_id ?? txId,
            kimahash: data.kimaTxHash ?? data.kimahash ?? ''
          },
          htlc_lock_request: htlcLockRequest
        }
      } satisfies GraphqlSwapTxStatusResponse

      res.status(200).json(output)
    } catch (e) {
      console.error(e)
      res.status(500).send(`failed to get status for swap transaction ${txId}`)
    }
  }
)

export default router
