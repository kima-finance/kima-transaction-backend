import { Request, Response, Router } from 'express'
import { fetchWrapper } from '../fetch-wrapper'
import { param } from 'express-validator'
import { validateRequest } from '../middleware/validation'
import { TransactionStatus } from '../types/transaction-status'
import { ENV } from '../env-validate'

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
      const result = await fetchWrapper.post(
        ENV.KIMA_BACKEND_NODE_PROVIDER_GRAPHQL as string,
        {
          query: `
            query TransactionDetailsKima($txId: bigint) {
              liquidity_transaction_data(where: { tx_id: { _eq: $txId } }, limit: 1) {
                failreason
                pullfailcount
                pullhash
                releasefailcount
                releasehash
                txstatus
                amount
                creator
                chain
                providerchainaddress
                symbol
                tx_id
                kimahash
              }
            }`,
          variables: {
            txId: BigInt(txId)
          }
        }
      )
      res.status(200).send(result as TransactionStatus)
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
      const result = await fetchWrapper.post(
        ENV.KIMA_BACKEND_NODE_PROVIDER_GRAPHQL as string,
        {
          query: `
            query TransactionDetailsKima($txId: bigint) {
              transaction_data(where: { tx_id: { _eq: $txId } }, limit: 1) {
                failreason
                pullfailcount
                pullhash
                releasefailcount
                releasehash
                txstatus
                amount
                creator
                originaddress
                originchain
                originsymbol
                targetsymbol
                targetaddress
                targetchain
                tx_id
                kimahash
              }
            }`,
          variables: {
            txId: BigInt(txId)
          }
        }
      )
      res.status(200).send(result)
    } catch (e) {
      console.error(e)
      res.status(500).send(`failed to get status for transaction ${txId}`)
    }
  }
)

export default txRouter
