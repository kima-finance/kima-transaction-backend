import { Router, type Request, type Response } from 'express'
import {
  submitKimaTransferTransaction,
  submitKimaSwapTransaction
} from '@kimafinance/kima-transaction-api'
import { query } from 'express-validator'
import { validateRequest } from '@shared/middleware/validation'
import { checkCompliance } from '@shared/middleware/compliance'
import { transValidation } from '@shared/middleware/trans-validation'
import { formatUnits } from 'viem'
import {
  SubmitRequestDto,
  SubmitRequestSchema,
  SubmitSwapRequestDto,
  SubmitSwapRequestSchema
} from '../types/submit-request.dto'
import { bigintToFixedNumber } from '@shared/utils/numbers'
import { generateFiatOptions } from '@shared/crypto/fiatSign'
import {
  signApprovalMessage,
  signApprovalSwapMessage
} from '@shared/crypto/sign'
import { ChainName } from '@features/chains/types/chain-name'
import { calcServiceFee } from '../services/submit.service'
import {
  TxMessageInputs,
  txSwapMessage,
  txTransferMessage
} from '../services/message.service'
import hexStringToUint8Array from '@shared/utils/bytes'

const router = Router()
const isSimulator = process.env.SIMULATOR

/**
 * @openapi
 * /submit/transfer:
 *   post:
 *     summary: Submit transfer transaction
 *     description: Submit a transfer transaction to the Kima Chain
 *     tags:
 *       - Submit
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               amount:
 *                 type: string
 *                 description: (bigint string) Amount target address will receive
 *               fee:
 *                 type: string
 *                 description: (bigint string) Total service fees.
 *               decimals:
 *                 type: number
 *                 description: Number of decimals for the amount and fee
 *               originAddress:
 *                 type: string
 *                 description: sender address
 *               originChain:
 *                 type: string
 *                 description: starting chain
 *                 enum: [ARB, AVX, BASE, BSC, ETH, OPT, POL, SOL, TRX]
 *               targetAddress:
 *                 type: string
 *                 description: receiver address
 *               targetChain:
 *                 type: string
 *                 description: receiving chain
 *                 enum: [ARB, AVX, BASE, BSC, ETH, OPT, POL, SOL, TRX]
 *               targetSymbol:
 *                 type: string
 *                 description: receiving token symbol
 *               htlcCreationHash:
 *                 type: string
 *                 description: (Bitcoin only) HTLC creation hash
 *               htlcCreationVout:
 *                 type: number
 *                 description: (Bitcoin only) HTLC creation vout
 *               htlcExpirationTimestamp:
 *                 type: string
 *                 description: (Bitcoin only) HTLC expiration timestamp
 *               htlcVersion:
 *                 type: string
 *                 description: (Bitcoin only) HTLC version
 *               senderPubKey:
 *                 type: string
 *                 description: (Bitcoin only) Sender public key
 *     responses:
 *       200:
 *         description: Successful response
 *         content:
 *           text/plain:
 *             schema:
 *               type: string
 *       400:
 *         description: Validation error
 *         content:
 *           text/plain:
 *             schema:
 *               type: string
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
 *                     isCompliant:
 *                       type: boolean
 *                     results:
 *                       type: object
 *                       properties:
 *                         address:
 *                           type: string
 *                         error:
 *                           type: string
 *       500:
 *         description: Internal server error
 *         content:
 *           text/plain:
 *             schema:
 *               type: string
 */
router.post(
  '/transfer',
  [transValidation, checkCompliance],
  async (req: Request, res: Response) => {
    const validationResult = isSimulator
      ? { success: true, error: { format: () => {}, flatten: () => {} } }
      : SubmitRequestSchema.safeParse(req.body)

    if (!validationResult.success) {
      console.error('Validation Error:', validationResult.error.format())
      return res.status(400).json({
        error: 'Validation failed',
        details: validationResult.error.flatten()
      })
    }

    let {
      originAddress,
      originChain,
      originSymbol,
      targetAddress,
      targetChain,
      targetSymbol,
      amount,
      fee,
      decimals,
      htlcCreationHash = '',
      htlcCreationVout = 0,
      htlcExpirationTimestamp = '',
      htlcVersion = '',
      senderPubKey = '',
      options = '',
      fiatTransactionIdSeed = '',
      mode,
      feeDeduct
    } = req.body satisfies SubmitRequestDto

    const fixedAmount = bigintToFixedNumber(amount, decimals)
    const fixedFee = bigintToFixedNumber(fee, decimals)

    const allowanceAmount = feeDeduct ? fixedAmount : fixedAmount + fixedFee

    const amountStr = formatUnits(amount, decimals)
    const feeStr = formatUnits(fee, decimals)
    console.log(req.body, { amountStr, feeStr })

    if (['CC', 'BANK'].includes(originChain as string)) {
      const { options: fiatOptions } = await generateFiatOptions(
        fiatTransactionIdSeed
      )

      options = JSON.stringify({
        ...JSON.parse(options || '{}'),
        ...fiatOptions
      })
    }

    if (mode === 'light') {
      const opts = JSON.parse(options || '{}')
      opts.signature = await signApprovalMessage({
        originSymbol,
        originChain,
        targetAddress,
        targetChain,
        allowanceAmount
      })
      options = JSON.stringify(opts)
    }

    try {
      const basePayload = {
        originAddress: ['CC', 'BANK'].includes(originChain)
          ? ''
          : originAddress,
        originChain: ['CC', 'BANK'].includes(originChain)
          ? 'FIAT'
          : originChain,
        targetAddress,
        targetChain,
        originSymbol,
        targetSymbol,
        amount: amountStr,
        fee: feeStr,
        options
      } as const

      const htlcPayload =
        htlcCreationHash && htlcVersion
          ? {
              htlcCreationHash,
              htlcCreationVout,
              htlcExpirationTimestamp,
              htlcVersion
            }
          : {}

      const pubKeyPayload =
        senderPubKey && senderPubKey.trim() !== ''
          ? { senderPubKey: hexStringToUint8Array(senderPubKey) }
          : {}

      const payload = {
        ...basePayload,
        ...htlcPayload,
        ...pubKeyPayload
      }

      const result = await submitKimaTransferTransaction(payload as any)

      console.log('kima submit result', result)
      res.send(result)
    } catch (e) {
      console.error('error submitting transaction')
      console.error(e)
      res.status(500).send('failed to submit transaction')
    }
  }
)

/**
 * @openapi
 * /submit/swap:
 *   post:
 *     summary: Submit swap transaction
 *     description: Submit a swap transaction to the Kima Chain
 *     tags:
 *       - Submit
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               amountIn:
 *                 type: string
 *                 description: (bigint string) Amount in of token to swap
 *               amountOut:
 *                 type: string
 *                 description: (bigint string) Amount out of token to receive
 *               fee:
 *                 type: string
 *                 description: (bigint string) Total service fees.
 *               decimals:
 *                 type: number
 *                 description: Number of decimals for the amount and fee
 *               originAddress:
 *                 type: string
 *                 description: sender address
 *               originChain:
 *                 type: string
 *                 description: starting chain
 *                 enum: [ARB, AVX, BASE, BSC, ETH, OPT, POL, SOL, TRX]
 *               targetAddress:
 *                 type: string
 *                 description: receiver address
 *               targetChain:
 *                 type: string
 *                 description: receiving chain
 *                 enum: [ARB, AVX, BASE, BSC, ETH, OPT, POL, SOL, TRX]
 *               targetSymbol:
 *                 type: string
 *                 description: receiving token symbol
 *               dex:
 *                 type: string
 *                 description: the name of the DEX that user wants to interact with
 *               slippage:
 *                 type: string
 *                 description: the maximum acceptable price slippage
 *     responses:
 *       200:
 *         description: Successful response
 *         content:
 *           text/plain:
 *             schema:
 *               type: string
 *       400:
 *         description: Validation error
 *         content:
 *           text/plain:
 *             schema:
 *               type: string
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
 *                     isCompliant:
 *                       type: boolean
 *                     results:
 *                       type: object
 *                       properties:
 *                         address:
 *                           type: string
 *                         error:
 *                           type: string
 *       500:
 *         description: Internal server error
 *         content:
 *           text/plain:
 *             schema:
 *               type: string
 */
router.post(
  '/swap',
  [transValidation, checkCompliance],
  async (req: Request, res: Response) => {
    const result = SubmitSwapRequestSchema.safeParse(req.body)

    if (!result.success) {
      console.error('Validation Error:', result.error.format())
      return res.status(400).json({
        error: 'Validation failed',
        details: result.error.flatten()
      })
    }

    let {
      originAddress,
      originChain,
      originSymbol,
      targetAddress,
      targetChain,
      targetSymbol,
      amountIn,
      amountOut,
      fee,
      decimals,
      dex,
      slippage,
      options = '',
      fiatTransactionIdSeed = '',
      mode
    } = req.body satisfies SubmitSwapRequestDto

    const amountInStr = formatUnits(amountIn, decimals)
    const amountOutStr = formatUnits(amountOut, decimals)
    const feeStr = formatUnits(fee, decimals)
    console.log(req.body, { amountInStr, amountOutStr, feeStr })

    if (['CC', 'BANK'].includes(originChain as string)) {
      const { options: fiatOptions } = await generateFiatOptions(
        fiatTransactionIdSeed
      )

      options = JSON.stringify({
        ...JSON.parse(options || '{}'),
        ...fiatOptions
      })
    }

    if (mode === 'light') {
      const fixedAmountIn = bigintToFixedNumber(amountIn, decimals)
      const opts = JSON.parse(options || '{}')
      opts.signature = await signApprovalSwapMessage({
        originSymbol,
        originChain,
        targetAddress,
        targetChain,
        allowanceAmount: fixedAmountIn
      })
      options = JSON.stringify(opts)
    }

    try {
      const submitResult = await submitKimaSwapTransaction({
        originAddress: ['CC', 'BANK'].includes(originChain as string)
          ? ''
          : originAddress,
        originChain: ['CC', 'BANK'].includes(originChain as string)
          ? 'FIAT'
          : originChain,
        targetAddress,
        targetChain,
        originSymbol,
        targetSymbol,
        amountIn: amountInStr,
        amountOut: amountOutStr,
        fee: feeStr,
        dex,
        slippage,
        options
      })

      console.log('kima submit swap result', submitResult)
      res.send(submitResult)
    } catch (e) {
      console.error('error submitting swap transaction')
      console.error(e)
      res.status(500).send('failed to submit transaction')
    }
  }
)

/**
 * @openapi
 * /submit/fees:
 *   get:
 *     summary: Get fees
 *     description: Get the fees and allowance for a given amount and chains
 *     tags:
 *       - Submit
 *     parameters:
 *       - in: query
 *         name: amount
 *         required: true
 *         schema:
 *           type: number
 *           description: Amount to send
 *       - in: query
 *         name: originAddress
 *         required: true
 *         schema:
 *           type: string
 *           description: sender address
 *       - in: query
 *         name: originChain
 *         required: true
 *         schema:
 *           type: string
 *           description: Origin chain
 *           enum: [ARB, AVX, BASE, BSC, ETH, OPT, POL, SOL, TRX]
 *       - in: query
 *         name: originSymbol
 *         required: true
 *         schema:
 *           type: string
 *           description: Origin token symbol
 *       - in: query
 *         name: targetAddress
 *         required: true
 *         schema:
 *           type: string
 *           description: receiver address
 *       - in: query
 *         name: targetChain
 *         required: true
 *         schema:
 *           type: string
 *           description: Target chain
 *           enum: [ARB, AVX, BASE, BSC, ETH, OPT, POL, SOL, TRX]
 *       - in: query
 *         name: targetSymbol
 *         required: true
 *         schema:
 *           type: string
 *           description: Receiving token symbol
 *       - in: query
 *         name: deductFee
 *         required: false
 *         schema:
 *           type: boolean
 *           default: false
 *           description: whether to deduct the fee from the amount
 *     responses:
 *       200:
 *         description: Successful response
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 allowanceAmount:
 *                   type: string
 *                   description: bigint string of amount to approve
 *                 totalFee:
 *                   type: string
 *                   description: total fee in USD for display
 *                 decimals:
 *                   type: number
 *                   description: number for decimals for the bigint strings
 *                 submitAmount:
 *                   type: string
 *                   description: bigint string of amount to submit in the Kima transaction
 *                 feeId:
 *                   type: string
 *                 sourceFee:
 *                   type: string
 *                 targetFee:
 *                   type: string
 *                 kimaFee:
 *                   type: string
 *                 message:
 *                   type: string
 */
router.get(
  '/fees',
  [
    query('amount')
      .isFloat({ gt: 0 })
      .withMessage('amount must be greater than 0'),
    query('originAddress').notEmpty(),
    query('originChain').isIn(Object.values(ChainName)),
    query('originSymbol').notEmpty(),
    query('targetAddress').notEmpty(),
    query('targetChain').isIn(Object.values(ChainName)),
    query('targetSymbol').notEmpty(),
    validateRequest
  ],
  async (req: Request, res: Response) => {
    const {
      amount,
      originChain,
      originAddress,
      originSymbol,
      targetChain,
      targetAddress,
      targetSymbol
    } = req.query

    try {
      const result = await calcServiceFee({
        amount: amount as string,
        originChain: originChain as ChainName,
        originAddress: ['CC', 'BANK'].includes(originChain as string)
          ? ''
          : (originAddress as string),
        originSymbol: originSymbol as string,
        targetChain: targetChain as ChainName,
        targetAddress: targetAddress as string,
        targetSymbol: targetSymbol as string
      })

      console.log('result: ', result)
      res.status(200).json(result)
    } catch (e) {
      console.log(e)
      res.status(500).json({ ok: false, errors: ['failed to get fee', e] })
    }
  }
)

/**
 * @openapi
 * /submit/transactionId:
 *   get:
 *     summary: Get CC transactionId
 *     description: Get the transactionId for a credit card transaction
 *     tags:
 *       - Submit
 *     parameters:
 *       - in: query
 *         name: transactionIdSeed
 *         required: true
 *         schema:
 *           type: string
 *           description: uuid seed for the encoded transationId
 *     responses:
 *       200:
 *         description: Successful response
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 transactionId:
 *                   type: string
 *                   description: encoded transaction id generated from seed
 *       500:
 *         description: Internal server error
 *         content:
 *           text/plain:
 *             schema:
 *               type: string
 */
router.get(
  '/transactionId',
  [query('transactionIdSeed').notEmpty(), validateRequest],
  async (req: Request, res: Response) => {
    const { transactionIdSeed } = req.query
    try {
      const { transactionId } = await generateFiatOptions(
        transactionIdSeed as string
      )
      res.status(200).json({ transactionId })
    } catch (e) {
      console.log(e)
      res.status(500).send('failed to generate transactionId')
    }
  }
)

// ===== test-only helpers (consider removing in production) =====

router.get<never, { messsage: string }, never, TxMessageInputs>(
  '/transfer-message',
  [
    query('allowanceAmount').isInt({ gt: 0 }),
    query('originChain').isString().isIn(Object.values(ChainName)),
    query('originSymbol').isString().notEmpty(),
    query('targetAddress').isString().notEmpty(),
    query('targetChain').isString().isIn(Object.values(ChainName)),
    validateRequest
  ],
  async (req: Request, res: Response) => {
    const {
      allowanceAmount,
      originChain,
      originSymbol,
      targetAddress,
      targetChain
    } = req.query
    const message = txTransferMessage({
      allowanceAmount: allowanceAmount as string,
      originChain: originChain as string,
      originSymbol: originSymbol as string,
      targetAddress: targetAddress as string,
      targetChain: targetChain as string
    })
    res.status(200).json({ message })
  }
)

router.get<never, { messsage: string }, never, TxMessageInputs>(
  '/swap-message',
  [
    query('allowanceAmount').isInt({ gt: 0 }),
    query('originChain').isString().isIn(Object.values(ChainName)),
    query('originSymbol').isString().notEmpty(),
    query('targetAddress').isString().notEmpty(),
    query('targetChain').isString().isIn(Object.values(ChainName)),
    validateRequest
  ],
  async (req: Request, res: Response) => {
    const {
      allowanceAmount,
      originChain,
      originSymbol,
      targetAddress,
      targetChain
    } = req.query
    const message = txSwapMessage({
      allowanceAmount: allowanceAmount as string,
      originChain: originChain as string,
      originSymbol: originSymbol as string,
      targetAddress: targetAddress as string,
      targetChain: targetChain as string
    })
    res.status(200).json({ message })
  }
)

export default router
