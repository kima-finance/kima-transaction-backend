import { Request, Response, Router } from 'express'
import { submitHtlcLock } from '@kimafinance/kima-transaction-api'
import { body } from 'express-validator'
import { fetchWrapper } from '../fetch-wrapper'
import { validateRequest } from '../middleware/validation'
import { checkCompliance } from '../middleware/compliance'
import { HtlcTransactionResponseDto } from '../types/htlc-transaction.dto'

const htlcRouter = Router()

/**
 * @openapi
 * /htlc:
 *   post:
 *     summary: (DISABLED) Submit Bitcoin HTLC lock transaction
 *     description: (DISABLED untiled BTC supported added to mainnet) Submit Bitcoin HTLC lock transaction
 *     tags:
 *       - HTLC (DISABLED)
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
    body('amount')
      .isFloat({ gt: 0 })
      .withMessage('amount must be greater than 0'),
    body('fromAddress').notEmpty(),
    body('senderPubkey').notEmpty(),
    body('htlcTimeout').notEmpty(),
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

    console.log(req.body)

    try {
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

/**
 * @openapi
 * /htlc/{senderAddress}:
 *   get:
 *     summary: (DISABLED) Get HTLC transaction
 *     description: (DISABLED untiled BTC supported added to mainnet) Returns the HTLC transaction details for the given sender address
 *     tags:
 *       - HTLC (DISABLED)
 *     parameters:
 *       - in: path
 *         name: senderAddress
 *         required: true
 *         schema:
 *           type: string
 *           description: Sender address
 *     responses:
 *       200:
 *         description: Successful response
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 htlcLockingTransaction:
 *                   type: array
 *                   items:
 *                     type: object
 *                     properties:
 *                       id:
 *                         type: string
 *                       senderAddress:
 *                         type: string
 *                       senderPubkey:
 *                         type: string
 *                       htlcTimestamp:
 *                         type: string
 *                       amount:
 *                         type: string
 *                       txHash:
 *                         type: string
 *                       status:
 *                         type: string
 *                       errReason:
 *                         type: string
 *                       creator:
 *                         type: string
 *                       htlcAddress:
 *                         type: string
 *                       pull_status:
 *                         type: string
 *       500:
 *         description: Internal server error
 *         content:
 *           text/plain:
 *             schema:
 *               type: string
 */
htlcRouter.get('/:senderAddress', async (req: Request, res: Response) => {
  const { senderAddress } = req.params
  try {
    const result = await fetchWrapper.get<HtlcTransactionResponseDto>(
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
