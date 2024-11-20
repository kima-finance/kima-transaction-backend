import { Request, Response, Router } from 'express'
import { authenticateJWT } from '../middleware/auth'
import { submitKimaTransaction } from '@kimafinance/kima-transaction-api'
import { validate } from '../validate'
import { createTransValidation } from '../middleware/trans-validation'
import { validateRequest } from '../middleware/validation'
import { body, query } from 'express-validator'
import { complianceService } from '../check-compliance'
import { hexStringToUint8Array } from '../utils'
import { ChainName } from '../types/chain-name'
import { calcServiceFee } from '../fees'
import { SubmitRequestDto } from '../types/submit-request.dto'
import { checkCompliance } from '../middleware/compliance'

const submitRouter = Router()

/**
 * @openapi
 * /submit:
 *   post:
 *     summary: Submit transaction
 *     description: Submit a transaction to Kima Chain. Requires authentication by calling /auth with the transaction details.
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
 *                 type: number
 *                 description: Amount to send
 *               fee:
 *                 type: number
 *                 description: Fee to pay
 *               originAddress:
 *                 type: string
 *                 description: Origin address
 *               originChain:
 *                 type: string
 *                 description: Origin chain
 *                 enum:
 *                   - ARBITRUM
 *                   - AVALANCHE
 *                   - BSC
 *                   - BTC
 *                   - ETHEREUM
 *                   - FIAT
 *                   - OPTIMISM
 *                   - POLYGON
 *                   - POLYGON_ZKEVM
 *                   - SOLANA
 *                   - TRON
 *               targetAddress:
 *                 type: string
 *                 description: Target address
 *               targetChain:
 *                 type: string
 *                 description: Target chain
 *                 enum:
 *                   - ARBITRUM
 *                   - AVALANCHE
 *                   - BSC
 *                   - BTC
 *                   - ETHEREUM
 *                   - FIAT
 *                   - OPTIMISM
 *                   - POLYGON
 *                   - POLYGON_ZKEVM
 *                   - SOLANA
 *                   - TRON
 *               targetSymbol:
 *                 type: string
 *                 description: Target symbol
 *               htlcCreationHash:
 *                 type: string
 *                 description: HTLC creation hash
 *               htlcCreationVout:
 *                 type: number
 *                 description: HTLC creation vout
 *               htlcExpirationTimestamp:
 *                 type: string
 *                 description: HTLC expiration timestamp
 *               htlcVersion:
 *                 type: string
 *                 description: HTLC version
 *               senderPubKey:
 *                 type: string
 *                 description: Sender public key
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
    ...createTransValidation(),
    body('htlcCreationHash').optional(),
    body('htlcCreationVout').optional().isInt({ gt: 0 }),
    body('htlcExpirationTimestamp').optional().notEmpty(),
    body('htlcVersion').optional().notEmpty(),
    body('senderPubKey').optional().notEmpty(),
    validateRequest,
    authenticateJWT,
    checkCompliance
  ],
  async (req: Request, res: Response) => {
    const {
      originAddress,
      originChain,
      originSymbol,
      targetAddress,
      targetChain,
      targetSymbol,
      amount,
      fee,
      htlcCreationHash = '',
      htlcCreationVout = 0,
      htlcExpirationTimestamp = '',
      htlcVersion = '',
      senderPubKey = ''
    } = req.body satisfies SubmitRequestDto

    console.log(req.body)

    if (!(await validate(req))) {
      return res.status(400).send('validation error')
    }

    try {
      const result = await submitKimaTransaction({
        originAddress,
        originChain,
        targetAddress,
        targetChain,
        originSymbol,
        targetSymbol,
        amount,
        fee,
        htlcCreationHash,
        htlcCreationVout,
        htlcExpirationTimestamp,
        htlcVersion,
        senderPubKey: hexStringToUint8Array(senderPubKey)
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
 * /submit/fees:
 *   get:
 *     summary: Get fees
 *     description: Get the fees for a given amount and chains
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
 *             - ARBITRUM
 *             - AVALANCHE
 *             - BSC
 *             - BTC
 *             - ETHEREUM
 *             - FIAT
 *             - OPTIMISM
 *             - POLYGON
 *             - POLYGON_ZKEVM
 *             - SOLANA
 *             - TRON
 *       - in: query
 *         name: targetChain
 *         required: true
 *         schema:
 *           type: string
 *           description: Target chain
 *           enum:
 *             - ARBITRUM
 *             - AVALANCHE
 *             - BSC
 *             - BTC
 *             - ETHEREUM
 *             - FIAT
 *             - OPTIMISM
 *             - POLYGON
 *             - POLYGON_ZKEVM
 *             - SOLANA
 *             - TRON
 *     responses:
 *       200:
 *         description: Successful response
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 totalFeeUsd:
 *                   type: number
 *                   description: Total fee in USD
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
    query('targetChain')
      .isIn(Object.values(ChainName))
      .withMessage('targetChain must be a valid chain name'),
    validateRequest
  ],
  async (req: Request, res: Response) => {
    const { amount, originChain, targetChain } = req.query
    try {
      const totalFeeUsd = await calcServiceFee({
        amount: +amount!,
        originChain: originChain as ChainName,
        targetChain: targetChain as ChainName
      })
      res.send({ totalFeeUsd })
    } catch (e) {
      console.log(e)
      res.status(500).send('failed to get fee')
    }
  }
)

export default submitRouter
