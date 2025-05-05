import { Request, Response, Router } from 'express'
import { submitKimaTransaction } from '@kimafinance/kima-transaction-api'
import { validateRequest } from '../middleware/validation'
import { body, query } from 'express-validator'
import { bigintToFixedNumber, hexStringToUint8Array } from '../utils'
import { ChainName } from '../types/chain-name'
import { calcServiceFee } from '../fees'
import {
  SubmitRequestDto,
  SubmitRequestSchema
} from '../types/submit-request.dto'
import { checkCompliance } from '../middleware/compliance'
import { transValidation } from '../middleware/trans-validation'
import { txMessage, TxMessageInputs } from '../message'
import { formatUnits } from 'viem'
import { generateCreditCardOptions } from '../creditcard'
import defaultResponse from '../data/defaultResponse.json'

const submitRouter = Router()

/**
 * @openapi
 * /submit:
 *   post:
 *     summary: Submit transaction
 *     description: Submit a transaction to the Kima Chain
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
 *                 enum:
 *                   - ARB
 *                   - AVX
 *                   - BASE
 *                   - BSC
 *                   - ETH
 *                   - OPT
 *                   - POL
 *                   - SOL
 *                   - TRX
 *               targetAddress:
 *                 type: string
 *                 description: receiver address
 *               targetChain:
 *                 type: string
 *                 description: receiving chain
 *                 enum:
 *                   - ARB
 *                   - AVX
 *                   - BASE
 *                   - BSC
 *                   - ETH
 *                   - OPT
 *                   - POL
 *                   - SOL
 *                   - TRX
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
submitRouter.post('/', async (req: Request, res: Response) => {
  const result = SubmitRequestSchema.safeParse(req.body)

  console.log('req.body: ', req.body)

  console.log('result: ', result)

  if (!result.success) {
    console.error('❌ Validation Error:', result.error.format())

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
    amount,
    fee,
    decimals,
    htlcCreationHash = '',
    htlcCreationVout = 0,
    htlcExpirationTimestamp = '',
    htlcVersion = '',
    senderPubKey = '',
    options = ''
  } = req.body satisfies SubmitRequestDto

  let ccTransactionId
  const fixedAmount = bigintToFixedNumber(amount, decimals)
  const fixedFee = bigintToFixedNumber(fee, decimals)

  console.log(req.body, { fixedAmount, fixedFee })
    const amountStr = formatUnits(amount, decimals)
    const feeStr = formatUnits(fee, decimals)
    console.log(req.body, { amountStr, feeStr })


  // generate transaction id and signature for CC
  if (originChain === 'CC') {
    const { options: creditCardOptions, transactionId: ccTxId } =
      await generateCreditCardOptions()

    options = JSON.stringify({ ...JSON.parse(options), ...creditCardOptions })
    ccTransactionId = ccTxId
  }

  console.log({
    originAddress,
    originChain,
    targetAddress,
    targetChain,
    originSymbol,
    targetSymbol,
    amount: fixedAmount,
    fee: fixedFee,
    htlcCreationHash,
    htlcCreationVout,
    htlcExpirationTimestamp,
    htlcVersion,
    senderPubKey: hexStringToUint8Array(senderPubKey),
    options,
    ccTransactionId
  })

  try {
    const result = await submitKimaTransaction({
      originAddress,
      originChain: originChain === 'CC' ? 'FIAT' : originChain,
      targetAddress,
      targetChain,
      originSymbol,
      targetSymbol,
      amount: fixedAmount,
      fee: fixedFee,
      htlcCreationHash,
      htlcCreationVout,
      htlcExpirationTimestamp,
      htlcVersion,
      senderPubKey: hexStringToUint8Array(senderPubKey),
      options
    })

    console.log('kima submit result', result)
    if (originChain === 'CC') return res.send({ result, ccTransactionId })

    res.send(result)
  } catch (e) {
    console.error('error submitting transaction')
    console.error(e)
    res.status(500).send('failed to submit transaction')
  }
})

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
 *           enum:
 *             - ARB
 *             - AVX
 *             - BASE
 *             - BSC
 *             - ETH
 *             - OPT
 *             - POL
 *             - SOL
 *             - TRX
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
 *           enum:
 *             - ARB
 *             - AVX
 *             - BASE
 *             - BSC
 *             - ETH
 *             - OPT
 *             - POL
 *             - SOL
 *             - TRX
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
 *                   description: id returned from the fee service
 *                 sourceFee:
 *                   type: string
 *                   description: fee for the source chain
 *                 targetFee:
 *                   type: string
 *                   description: fee for the target chain
 *                 kimaFee:
 *                   type: string
 *                   description: fee for the kima chain
 *                 message:
 *                   type: string
 *                   description: transaction data messge to be signed by the user
 *       500:
 *         description: Internal server error
 *         content:
 *           text/plain:
 *             schema:
 *               type: string
 */
submitRouter.get(
  '/fees',
  [
    query('amount')
      .isFloat({ gt: 0 })
      .withMessage('amount must be greater than 0'),
    // query('deductFee').optional().isBoolean().default(false),
    query('originAddress').notEmpty(),
    query('originChain')
      .isIn(Object.values(ChainName))
      .withMessage('sourceChain must be a valid chain name'),
    query('originSymbol').notEmpty(),
    query('targetAddress').notEmpty(),
    query('targetChain')
      .isIn(Object.values(ChainName))
      .withMessage('targetChain must be a valid chain name'),
    query('targetSymbol').notEmpty(),
    validateRequest
  ],
  async (req: Request, res: Response) => {
    const {
      amount,
      // deductFee,
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
        // deductFee: deductFee === 'true',
        originChain: originChain as ChainName,
        originAddress: originChain === 'FIAT' ? '' : (originAddress as string),
        originSymbol: originSymbol as string,
        targetChain: targetChain as ChainName,
        targetAddress: targetAddress as string,
        targetSymbol: targetSymbol as string
      })
      res.status(200).json(result)
      // const message = txMessage({
      //   allowanceAmount: result.allowanceAmount,
      //   decimals: result.decimals.toString(),
      //   originChain: originChain as string,
      //   originSymbol: originSymbol as string,
      //   targetAddress: targetAddress as string,
      //   targetChain: targetChain as ChainName
      // })
      // res.status(200).json({
      //   ...result,
      //   message
      // })
    } catch (e) {
      console.log(e)
      res.status(500).send('failed to get fee')
    }
  }
)

// test only TODO: remove
submitRouter.get<never, { messsage: string }, never, TxMessageInputs>(
  '/message',
  [
    query('allowanceAmount')
      .isInt({ gt: 0 })
      .withMessage('allowanceAmount must be an integer greater than 0'),
    query('originChain')
      .isString()
      .isIn(Object.values(ChainName))
      .withMessage('targetChain must be a valid chain name'),
    query('originSymbol').isString().notEmpty(),
    query('targetAddress').isString().notEmpty(),
    query('targetChain')
      .isString()
      .isIn(Object.values(ChainName))
      .withMessage('targetChain must be a valid chain name'),
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
    const message = txMessage({
      allowanceAmount: allowanceAmount as string,
      originChain: originChain as string,
      originSymbol: originSymbol as string,
      targetAddress: targetAddress as string,
      targetChain: targetChain as string
    })
    res.status(200).json({ message })
  }
)

export default submitRouter
