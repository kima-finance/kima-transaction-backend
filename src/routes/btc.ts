import { Request, Response, Router } from 'express'
import { fetchWrapper } from '../fetch-wrapper'
import { Network, validate as validateBTC } from 'bitcoin-address-validation'
import { query } from 'express-validator'
import { validateRequest } from '../middleware/validation'
import { BtcTransactionDto } from '../types/btc-transaction.dto'

const btcRouter = Router()

/**
 * @openapi
 * /btc/balance:
 *   get:
 *     summary: Get BTC balance
 *     description: Returns the BTC balance for the given address
 *     tags:
 *       - BTC
 *     parameters:
 *       - name: address
 *         in: query
 *         required: true
 *         description: BTC address
 *         schema:
 *           type: string
 *           pattern: ^bc1[a-zA-HJ-NP-Z0-9]{25,39}$
 *     responses:
 *       200:
 *         description: Successful response
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 balance:
 *                   type: number
 *       500:
 *         description: Internal server error
 *         content:
 *           text/plain:
 *             schema:
 *               type: string
 */
btcRouter.get(
  '/balance',
  [
    query('address').custom((address) => validateBTC(address, Network.testnet)),
    validateRequest
  ],
  async (req: Request, res: Response) => {
    const address = req.query.address as string

    try {
      const btcInfo: any = await fetchWrapper.get(
        `https://blockstream.info/testnet/api/address/${address}`
      )

      const balance =
        btcInfo.chain_stats.funded_txo_sum - btcInfo.chain_stats.spent_txo_sum

      res.send({ balance })
    } catch (e) {
      console.error(e)
      res.status(500).send('failed to get bitcoin balance')
    }
  }
)

/**
 * @openapi
 * /btc/transaction:
 *   get:
 *     summary: Get BTC transaction
 *     description: Returns the BTC transaction details for the given hash
 *     tags:
 *       - BTC
 *     parameters:
 *       - name: hash
 *         in: query
 *         required: true
 *         description: BTC transaction hash
 *         schema:
 *           type: string
 *           pattern: ^[a-fA-F0-9]{64}$
 *     responses:
 *       200:
 *         description: Successful response
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 txid:
 *                   type: string
 *                 version:
 *                   type: number
 *                 locktime:
 *                   type: number
 *                 vin:
 *                   type: array
 *                   items:
 *                     type: object
 *                     properties:
 *                       txid:
 *                         type: string
 *                       vout:
 *                         type: number
 *                       prevout:
 *                         type: object
 *                         properties:
 *                           scriptpubkey:
 *                             type: string
 *                           scriptpubkey_asm:
 *                             type: string
 *                           scriptpubkey_type:
 *                             type: string
 *                           scriptpubkey_address:
 *                             type: string
 *                           value:
 *                             type: number
 *                       scriptsig:
 *                         type: string
 *                       scriptsig_asm:
 *                         type: string
 *                       is_coinbase:
 *                         type: boolean
 *                       sequence:
 *                         type: number
 *                 vout:
 *                   type: array
 *                   items:
 *                     type: object
 *                     properties:
 *                       scriptpubkey:
 *                         type: string
 *                       scriptpubkey_asm:
 *                         type: string
 *                       scriptpubkey_type:
 *                         type: string
 *                       scriptpubkey_address:
 *                         type: string
 *                       value:
 *                         type: number
 *
 *                 size:
 *                   type: number
 *                 weight:
 *                   type: number
 *                 fee:
 *                   type: number
 *                 status:
 *                   type: object
 *                   properties:
 *                     confirmed:
 *                       type: boolean
 *       500:
 *         description: Internal server error
 *         content:
 *           text/plain:
 *             schema:
 *               type: string
 */
btcRouter.get(
  '/transaction',
  [query('hash').isHexadecimal(), validateRequest],
  async (req: Request, res: Response) => {
    const hash = req.query.hash as string

    try {
      const btcInfo = await fetchWrapper.get<BtcTransactionDto>(
        `https://blockstream.info/testnet/api/tx/${hash}`
      )

      res.send(btcInfo)
    } catch (e) {
      console.log(e)
      res.status(500).send('failed to get bitcoin tx info')
    }
  }
)

export default btcRouter
