import { Request, Response, Router } from 'express'
import { fetchWrapper } from '../fetch-wrapper'
import { Network, validate as validateBTC } from 'bitcoin-address-validation'
import { param, query } from 'express-validator'
import { validateRequest } from '../middleware/validation'
import { BtcTransactionDto } from '../types/btc-transaction.dto'
import { isTestnet } from '../constants'
import { BtcUtxoResponseDto } from '../types/btc-utxo-response.dto'

const btcRouter = Router()

const BLOCKSTREAM_BASE = isTestnet
  ? 'https://blockstream.info/testnet'
  : 'https://blockstream.info'

const MEMPOOL_BASE = isTestnet
  ? 'https://mempool.space/testnet'
  : 'https://mempool.space'

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
 *     responses:
 *       200:
 *         description: Successful response
 *       500:
 *         description: Internal server error
 */
btcRouter.get(
  '/balance',
  [
    query('address').custom((address) =>
      validateBTC(address, isTestnet ? Network.testnet : Network.mainnet)
    ),
    validateRequest
  ],
  async (req: Request, res: Response) => {
    const address = req.query.address as string

    try {
      const btcInfo: any = await fetchWrapper.get(
        `${BLOCKSTREAM_BASE}/api/address/${address}`
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
 *     responses:
 *       200:
 *         description: Successful response
 *       500:
 *         description: Internal server error
 */
btcRouter.get(
  '/transaction',
  [query('hash').isHexadecimal(), validateRequest],
  async (req: Request, res: Response) => {
    const hash = req.query.hash as string

    try {
      const btcInfo = await fetchWrapper.get<BtcTransactionDto>(
        `${BLOCKSTREAM_BASE}/api/tx/${hash}`
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
 *     description: Returns the BTC UTXOs for the given address
 *     tags:
 *       - BTC
 *     parameters:
 *       - in: path
 *         name: address
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Successful response
 *       500:
 *         description: Internal server error
 */
btcRouter.get(
  '/utxo/:address',
  [
    param('address')
      .custom((address) =>
        validateBTC(address, isTestnet ? Network.testnet : Network.mainnet)
      )
      .withMessage('address path parameter must be a valid BTC address'),
    validateRequest
  ],
  async (req: Request, res: Response) => {
    const { address } = req.params

    try {
      const url = `${MEMPOOL_BASE}/api/address/${address}/utxo`
      const response = await fetchWrapper.get<BtcUtxoResponseDto[]>(url)
      res.send(response)
    } catch (e) {
      console.error(e)
      res.status(500).send(`failed to get bitcoin utxo for address ${address}`)
    }
  }
)

export default btcRouter
