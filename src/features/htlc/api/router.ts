import { Router, type Request, type Response } from 'express'
import { body, param } from 'express-validator'
import { validateRequest } from '@shared/middleware/validation'
import { checkCompliance } from '@shared/middleware/compliance'
import { submitHtlcLock } from '@kimafinance/kima-transaction-api'
import fetchWrapper from '@shared/http/fetch'
import { HtlcTransactionResponseDto } from '../types/htlc-transaction.dto'
import ENV from 'core/env'

const router = Router()

/**
 * @openapi
 * tags:
 *   - name: HTLC (DISABLED)
 *     description: >
 *       Bitcoin HTLC endpoints (kept for compatibility; **disabled** until BTC is supported on mainnet).
 *       These proxy/write into Kima Chain when enabled.
 */

/**
 * @openapi
 * components:
 *   schemas:
 *     HtlcLockRequest:
 *       type: object
 *       required: [amount, fromAddress, senderPubkey, htlcTimeout, htlcAddress, txHash]
 *       properties:
 *         amount:
 *           type: number
 *           description: Amount to lock (BTC units; implementation-defined)
 *         fromAddress:
 *           type: string
 *           description: Sender wallet address
 *         senderPubkey:
 *           type: string
 *           description: Sender public key (hex)
 *         htlcTimeout:
 *           type: number
 *           description: Timeout/CLTV
 *         htlcAddress:
 *           type: string
 *           description: HTLC script address
 *         txHash:
 *           type: string
 *           description: Funding transaction hash (hex)
 *
 *     HtlcSubmitResult:
 *       type: object
 *       properties:
 *         code: { type: number }
 *         events:
 *           type: array
 *           items:
 *             type: object
 *             properties:
 *               type: { type: string }
 *               attributes:
 *                 type: array
 *                 items:
 *                   type: object
 *                   properties:
 *                     key: { type: string }
 *                     value: { type: string }
 *         msgResponses:
 *           type: array
 *           items:
 *             type: object
 *             properties:
 *               typeUrl: { type: string }
 *               value:
 *                 description: Protobuf-encoded bytes (transported as base64 or number array)
 *                 oneOf:
 *                   - type: string
 *                   - type: array
 *                     items: { type: integer }
 *         gasUsed: { type: number }
 *         gasWanted: { type: number }
 *         height: { type: number }
 *         rawLog: { type: string }
 *         transactionHash: { type: string }
 *         txIndex: { type: integer }
 *
 *     HtlcTransaction:
 *       type: object
 *       properties:
 *         id: { type: string }
 *         senderAddress: { type: string }
 *         senderPubkey: { type: string }
 *         htlcTimestamp: { type: string }
 *         amount: { type: string }
 *         txHash: { type: string }
 *         status: { type: string }
 *         errReason: { type: string }
 *         creator: { type: string }
 *         htlcAddress: { type: string }
 *         pull_status: { type: string }
 *
 *     HtlcTransactionResponse:
 *       type: object
 *       properties:
 *         htlcLockingTransaction:
 *           type: array
 *           items:
 *             $ref: '#/components/schemas/HtlcTransaction'
 */

/**
 * @openapi
 * /htlc:
 *   post:
 *     summary: (DISABLED) Submit Bitcoin HTLC lock transaction
 *     description: >
 *       **Disabled** until BTC support is available on mainnet. When enabled, forwards an HTLC lock request to Kima.
 *     tags: [HTLC (DISABLED)]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema: { $ref: '#/components/schemas/HtlcLockRequest' }
 *     responses:
 *       200:
 *         description: Kima execution result
 *         content:
 *           application/json:
 *             schema: { $ref: '#/components/schemas/HtlcSubmitResult' }
 *       400:
 *         description: Validation error
 *       403:
 *         description: Address not compliant (if compliance enabled)
 *       500:
 *         description: Internal error
 */
router.post(
  '/',
  [
    body('amount')
      .isFloat({ gt: 0 })
      .withMessage('amount must be greater than 0'),
    body('fromAddress').notEmpty(),
    body('senderPubkey').notEmpty(),
    body('htlcTimeout').isInt().withMessage('htlcTimeout must be an integer'),
    body('htlcAddress').notEmpty(),
    body('txHash').isHexadecimal(),
    validateRequest,
    checkCompliance
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

    try {
      const result = await submitHtlcLock({
        fromAddress,
        amount,
        htlcTimeout,
        htlcAddress,
        txHash,
        senderPubkey
      })
      res.status(200).json(result)
    } catch (e) {
      console.error(e)
      res.status(500).send('failed to submit HTLC lock transaction')
    }
  }
)

/**
 * @openapi
 * /htlc/{senderAddress}:
 *   get:
 *     summary: (DISABLED) Get HTLC transaction(s) by sender address
 *     description: >
 *       **Disabled** until BTC support is available on mainnet. Returns HTLC transactions recorded for a sender.
 *     tags: [HTLC (DISABLED)]
 *     parameters:
 *       - in: path
 *         name: senderAddress
 *         required: true
 *         schema:
 *           type: string
 *         description: Sender wallet address
 *     responses:
 *       200:
 *         description: HTLC transactions
 *         content:
 *           application/json:
 *             schema: { $ref: '#/components/schemas/HtlcTransactionResponse' }
 *       500:
 *         description: Internal error
 */
router.get(
  '/:senderAddress',
  [param('senderAddress').notEmpty(), validateRequest],
  async (req: Request, res: Response) => {
    const { senderAddress } = req.params
    try {
      const result = await fetchWrapper.get<HtlcTransactionResponseDto>(
        `${ENV.KIMA_BACKEND_NODE_PROVIDER_QUERY}/kima-finance/kima-blockchain/transaction/get_htlc_transaction/${senderAddress}`
      )
      res.status(200).json(result)
    } catch (e) {
      console.error(e)
      res
        .status(500)
        .send(`failed to get HTLC transaction for ${senderAddress}`)
    }
  }
)

export default router
