import { Router, type Request, type Response } from 'express'
import { param, query } from 'express-validator'
import { validateRequest } from '@shared/middleware/validation'
import { Network, validate as validateBTC } from 'bitcoin-address-validation'
import fetchWrapper from '@shared/http/fetch'
import { BtcTransactionDto } from '../types/btc-transaction.dto'
import { isTestnet } from 'core/constants'
import { BtcUtxoResponseDto } from '../types/btc-utxo-response.dto'

const router = Router()

/**
 * @openapi
 * tags:
 *   - name: BTC
 *     description: Bitcoin-related endpoints
 */

/**
 * @openapi
 * /btc/balance:
 *   get:
 *     summary: Get BTC balance
 *     description: Returns the BTC balance (in sats) for the given address.
 *     tags: [BTC]
 *     parameters:
 *       - name: address
 *         in: query
 *         required: true
 *         description: A Bech32 Bitcoin address. Testnet and mainnet formats accepted.
 *         schema:
 *           type: string
 *           pattern: "^(bc1|tb1)[a-zA-HJ-NP-Z0-9]{25,90}$"
 *     responses:
 *       200:
 *         description: Balance fetched successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 balance:
 *                   type: number
 *                   description: Balance in satoshis
 *       400:
 *         description: Validation error
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 errors:
 *                   type: array
 *                   items:
 *                     type: object
 *       500:
 *         description: Internal server error
 *         content:
 *           text/plain:
 *             schema:
 *               type: string
 */
router.get(
  '/balance',
  [
    // validate testnet/mainnet pattern via lib (runtime); pattern in docs is informative
    query('address').custom(
      (address) =>
        validateBTC(address, Network.testnet) ||
        validateBTC(address, Network.mainnet)
    ),
    validateRequest
  ],
  async (req: Request, res: Response) => {
    const address = req.query.address as string

    try {
      // NOTE: this endpoint currently points to Blockstream testnet; adjust when mainnet support is enabled
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
 *     description: Returns the BTC transaction details for the given hash.
 *     tags: [BTC]
 *     parameters:
 *       - name: hash
 *         in: query
 *         required: true
 *         description: Transaction hash (txid)
 *         schema:
 *           type: string
 *           pattern: "^[a-fA-F0-9]{64}$"
 *     responses:
 *       200:
 *         description: Transaction fetched successfully
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
 *       400:
 *         description: Validation error
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 errors:
 *                   type: array
 *                   items:
 *                     type: object
 *       500:
 *         description: Internal server error
 *         content:
 *           text/plain:
 *             schema:
 *               type: string
 */
router.get(
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

/**
 * @openapi
 * /btc/utxo/{address}:
 *   get:
 *     summary: Get BTC UTXOs
 *     description: Returns the BTC UTXOs for the given address.
 *     tags: [BTC]
 *     parameters:
 *       - in: path
 *         name: address
 *         required: true
 *         description: A Bech32 Bitcoin address. Testnet and mainnet formats accepted.
 *         schema:
 *           type: string
 *           pattern: "^(bc1|tb1)[a-zA-HJ-NP-Z0-9]{25,90}$"
 *     responses:
 *       200:
 *         description: UTXOs fetched successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 type: object
 *                 properties:
 *                   txid:
 *                     type: string
 *                   vout:
 *                     type: number
 *                   value:
 *                     type: number
 *                   status:
 *                     type: object
 *                     properties:
 *                       confirmed:
 *                         type: boolean
 *       400:
 *         description: Validation error
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 errors:
 *                   type: array
 *                   items:
 *                     type: object
 *       500:
 *         description: Internal server error
 *         content:
 *           text/plain:
 *             schema:
 *               type: string
 */
router.get(
  '/utxo/:address',
  [
    param('address')
      .notEmpty()
      .withMessage('address path parameter must be provided'),
    validateRequest
  ],
  async (req: Request, res: Response) => {
    const { address } = req.params

    try {
      const networkSubpath = isTestnet ? '/testnet' : ''
      const url = `https://mempool.space${networkSubpath}/api/address/${address}/utxo`

      const response = await fetchWrapper.get<BtcUtxoResponseDto[]>(url)
      res.send(response)
    } catch (e) {
      console.error(e)
      res.status(500).send(`failed to get bitcoin utxo for address ${address}`)
    }
  }
)

export default router
