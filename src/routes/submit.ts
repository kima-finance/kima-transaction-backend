import { Request, Response, Router } from 'express'
import { submitKimaTransaction } from '@kimafinance/kima-transaction-api'
import { validateRequest } from '../middleware/validation'
import { body, query } from 'express-validator'
import { bigintToFixedNumber, hexStringToUint8Array } from '../utils'
import { ChainName } from '../types/chain-name'
import { calcServiceFee } from '../fees'
import { SubmitRequestDto } from '../types/submit-request.dto'
import { checkCompliance } from '../middleware/compliance'
import { transValidation } from '../middleware/trans-validation'
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
submitRouter.post(
  '/',
  [
    body('amount')
      .isInt({ gt: 0 })
      .withMessage('amount must be greater than 0'),
    body('fee').isInt({ min: 0 }).withMessage('fee must be positive'),
    body('decimals')
      .isInt({ gt: 0 })
      .withMessage('decimals must be greater than 0'),
    body('originAddress').notEmpty(),
    body('originChain')
      .isIn(Object.values(ChainName))
      .withMessage('originChain must be a valid chain name'),
    body('originSymbol').notEmpty(),
    body('targetAddress').notEmpty(),
    body('targetChain')
      .isIn(Object.values(ChainName))
      .withMessage('targetChain must be a valid chain name'),
    body('targetSymbol').notEmpty(),
    body('htlcCreationHash').optional().isString(),
    body('htlcCreationVout').optional().isInt(),
    body('htlcExpirationTimestamp').optional().isString(),
    body('htlcVersion').optional().isString(),
    body('senderPubKey').optional().isString(),
    validateRequest,
    transValidation,
    checkCompliance
  ],
  async (req: Request, res: Response) => {
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

    if (originChain === 'CC')
      return res.send({ result: defaultResponse, ccTransactionId })

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
      // console.log('kima submit result', result)
      // if (originChain === 'CC') return res.send({ result, ccTransactionId })

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
 *                   description: bigint string of total fees
 *                 totalFeeUsd:
 *                   type: number
 *                   description: total fee in USD for display
 *                 decimals:
 *                   type: number
 *                   description: number for decimals for the bigint strings
 *                 deductFee:
 *                   type: boolean
 *                   description: whether the allowance and submit amounts reflect fee decduction
 *                 submitAmount:
 *                   type: string
 *                   description: bigint string of amount to submit in the Kima transaction
 *                 breakdown:
 *                   type: array
 *                   description: breakdown of fees by chain
 *                   items:
 *                     type: object
 *                     properties:
 *                       amount:
 *                         type: number
 *                       feeType:
 *                         type: string
 *                         enum:
 *                           - gas
 *                           - service
 *                       chain:
 *                         type: string
 *                         enum:
 *                           - ARB
 *                           - AVX
 *                           - BASE
 *                           - BSC
 *                           - ETH
 *                           - OPT
 *                           - POL
 *                           - SOL
 *                           - TRX
 *                           - KIMA
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
    query('originChain')
      .isIn(Object.values(ChainName))
      .withMessage('sourceChain must be a valid chain name'),
    query('originSymbol').notEmpty(),
    query('targetChain')
      .isIn(Object.values(ChainName))
      .withMessage('targetChain must be a valid chain name'),
    query('deductFee').optional().isBoolean().default(false),
    validateRequest
  ],
  async (req: Request, res: Response) => {
    const { amount, deductFee, originChain, originSymbol, targetChain } =
      req.query
    try {
      const result = await calcServiceFee({
        amount: amount as string,
        deductFee: deductFee === 'true',
        originChain: originChain as ChainName,
        originSymbol: originSymbol as string,
        targetChain: targetChain as ChainName
      })
      res.status(200).send(result)
    } catch (e) {
      console.log(e)
      res.status(500).send('failed to get fee')
    }
  }
)

export default submitRouter
