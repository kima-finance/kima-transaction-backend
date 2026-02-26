import { Router, type Request, type Response } from 'express'
import { body, param, query } from 'express-validator'
import { validateRequest } from '@shared/middleware/validation'
import { Network, validate as validateBTC } from 'bitcoin-address-validation'
import fetchWrapper from '@shared/http/fetch'
import { BtcTransactionDto } from '../types/btc-transaction.dto'
import { BtcUtxoResponseDto } from '../types/btc-utxo-response.dto'
import * as bitcoin from 'bitcoinjs-lib'
import crypto from 'crypto'
import {
  createHtlcLock,
  getHtlcLock,
  updateHtlcLock
} from '../htlc-store'
import {
  getBitcoinJsNetwork,
  getBtcMempoolBase,
  getBtcValidationNetwork
} from '@shared/crypto/btc'
import { isTestnet } from 'core/constants'
import { encodeHexString } from '@shared/utils/hex'

const router = Router()

const getMempoolBase = () => getBtcMempoolBase()
const getMempoolBases = () => {
  const primary = getBtcMempoolBase()
  if (!isTestnet) return [primary]
  return [primary]
}

const getChainHeight = async () => {
  const base = getMempoolBase()
  return fetchWrapper.get<number>(`${base}/blocks/tip/height`)
}

const getChainTip = async () => {
  const base = getMempoolBase()
  const height = await getChainHeight()
  const hash = await fetchWrapper.get<string>(`${base}/blocks/tip/hash`)
  const block = await fetchWrapper.get<{ timestamp?: number }>(
    `${base}/block/${hash}`
  )
  return { height, timestamp: block?.timestamp ?? null }
}

const getPubkeyHashFromAddress = (address: string): Buffer => {
  const lower = address.toLowerCase()
  if (lower.startsWith('bc1') || lower.startsWith('tb1') || lower.startsWith('bcrt1')) {
    const decoded = bitcoin.address.fromBech32(address)
    return decoded.data
  }
  const decoded = bitcoin.address.fromBase58Check(address)
  return decoded.hash
}

const buildHtlcScript = ({
  recipientAddress,
  senderPubkey,
  timeoutHeight,
  network
}: {
  recipientAddress: string
  senderPubkey: string
  timeoutHeight: number
  network: bitcoin.Network
}) => {
  const recipientPKH = getPubkeyHashFromAddress(recipientAddress)
  const normalized = senderPubkey.startsWith('0x')
    ? senderPubkey.slice(2)
    : senderPubkey
  const senderPubkeyBuf = Buffer.from(normalized, 'hex')
  const senderPubkeyHash = bitcoin.crypto.hash160(senderPubkeyBuf)
  const timeoutBytes = Buffer.alloc(4)
  timeoutBytes.writeUInt32LE(timeoutHeight)

  return bitcoin.script.compile([
    bitcoin.opcodes.OP_DUP,
    bitcoin.opcodes.OP_HASH160,
    recipientPKH,
    bitcoin.opcodes.OP_EQUAL,
    bitcoin.opcodes.OP_IF,
    bitcoin.opcodes.OP_DUP,
    bitcoin.opcodes.OP_HASH160,
    recipientPKH,
    bitcoin.opcodes.OP_EQUALVERIFY,
    bitcoin.opcodes.OP_CHECKSIG,
    bitcoin.opcodes.OP_ELSE,
    timeoutBytes,
    bitcoin.opcodes.OP_CHECKLOCKTIMEVERIFY,
    bitcoin.opcodes.OP_DROP,
    bitcoin.opcodes.OP_DUP,
    bitcoin.opcodes.OP_HASH160,
    senderPubkeyHash,
    bitcoin.opcodes.OP_EQUALVERIFY,
    bitcoin.opcodes.OP_CHECKSIG,
    bitcoin.opcodes.OP_ENDIF,
    senderPubkeyBuf,
    bitcoin.opcodes.OP_DROP
  ])
}

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
 *         description: A Bitcoin address for the current environment network.
 *         schema:
 *           type: string
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
    query('address')
      .custom((address) => validateBTC(address, getBtcValidationNetwork()))
      .withMessage(
        `Address must be ${
          getBtcValidationNetwork() === Network.testnet ? 'testnet' : 'mainnet'
        } for this environment`
      ),
    validateRequest
  ],
  async (req: Request, res: Response) => {
    const address = req.query.address as string

    try {
      const base = getMempoolBase()
      const btcInfo: any = await fetchWrapper.get(
        `${base}/address/${address}`
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
 * /btc/htlc/lock-intent:
 *   post:
 *     summary: Create a BTC HTLC lock intent (returns address + hash)
 *     tags: [BTC]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [senderAddress, senderPubkey, recipientAddress, amountSats]
 *             properties:
 *               senderAddress: { type: string }
 *               senderPubkey: { type: string }
 *               recipientAddress: { type: string }
 *               amountSats: { type: string }
 *               lockBlocks: { type: number }
 *               timeout: { type: number, description: "Unix seconds for CLTV (>= 500000000)" }
 *     responses:
 *       200:
 *         description: HTLC intent created
 */
router.post(
  '/htlc/lock-intent',
  [
    body('senderAddress').notEmpty(),
    body('senderPubkey').notEmpty(),
    body('recipientAddress').notEmpty(),
    body('poolAddress').optional(),
    body('amountSats').notEmpty(),
    body('lockBlocks').optional().isInt({ gt: 0 }),
    body('timeout').optional().isInt({ gt: 0 }),
    validateRequest
  ],
  async (req: Request, res: Response) => {
    const { senderAddress, senderPubkey, recipientAddress, amountSats } =
      req.body
    const poolAddress = req.body.poolAddress as string | undefined
    const lockBlocks = Number(req.body.lockBlocks ?? 0)
    const timeoutParam = Number(req.body.timeout ?? 0)

    try {
      let encodedSenderPubkey: string
      try {
        encodedSenderPubkey = encodeHexString(
          String(senderPubkey),
          'senderPubkey'
        )
      } catch (error) {
        return res.status(400).json({
          error:
            error instanceof Error ? error.message : 'senderPubkey is invalid'
        })
      }
      const networkType = getBtcValidationNetwork()
      if (!validateBTC(senderAddress, networkType)) {
        return res
          .status(400)
          .json({ error: 'Sender address is not valid for this network' })
      }

      let htlcRecipient: string
      if (poolAddress && validateBTC(poolAddress, networkType)) {
        htlcRecipient = poolAddress
      } else {
        const recipientIsBtc = validateBTC(recipientAddress, networkType)
        htlcRecipient = recipientIsBtc ? recipientAddress : senderAddress
        if (!recipientIsBtc) {
          console.warn(
            '[btc.htlc.lock-intent] non-BTC recipient provided; using sender address for HTLC',
            { recipientAddress, poolAddress }
          )
        }
      }

      let timeoutHeight: number
      if (timeoutParam > 0) {
        timeoutHeight = timeoutParam
      } else if (lockBlocks > 0) {
        const height = await getChainHeight()
        timeoutHeight = height + lockBlocks
      } else {
        // Default timeout: 1 hour from now (unix seconds)
        timeoutHeight = Math.floor(Date.now() / 1000) + 3600
      }

      const preimage = crypto.randomBytes(32)
      const hashHex = crypto.createHash('sha256').update(preimage).digest('hex')

      const network = getBitcoinJsNetwork()
      const script = buildHtlcScript({
        recipientAddress: htlcRecipient,
        senderPubkey: encodedSenderPubkey,
        timeoutHeight,
        network
      })

      const p2wsh = bitcoin.payments.p2wsh({
        redeem: { output: script, network },
        network
      })

      if (!p2wsh.address) {
        return res.status(500).send('failed to derive HTLC address')
      }

      const record = createHtlcLock({
        preimageHex: preimage.toString('hex'),
        hashHex,
        htlcAddress: p2wsh.address,
        senderAddress,
        senderPubkey: encodedSenderPubkey,
        recipientAddress: htlcRecipient,
        amountSats: String(amountSats),
        timeoutHeight
      })

      console.log(
        '[btc.htlc.lock-intent] created',
        JSON.stringify(
          {
            senderAddress,
            senderPubkey: encodedSenderPubkey,
            recipientAddress,
            poolAddress: poolAddress ?? null,
            resolvedRecipient: htlcRecipient,
            amountSats: String(amountSats),
            timeoutHeight,
            htlcAddress: p2wsh.address
          },
          null,
          2
        )
      )

      res.status(200).json({
        lockId: record.id,
        htlcAddress: record.htlcAddress,
        hash: record.hashHex,
        timeoutHeight: record.timeoutHeight,
        timeout: record.timeoutHeight,
        amountSats: record.amountSats,
        recipientAddress: record.recipientAddress,
        senderAddress: record.senderAddress,
        senderPubkey: encodedSenderPubkey
      })
    } catch (e) {
      console.error(e)
      res.status(500).send('failed to create HTLC lock intent')
    }
  }
)

/**
 * @openapi
 * /btc/htlc/record:
 *   post:
 *     summary: Record BTC HTLC lock tx (broadcasted)
 *     tags: [BTC]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [lockId, txid]
 *             properties:
 *               lockId: { type: string }
 *               txid: { type: string }
 *     responses:
 *       200:
 *         description: HTLC lock recorded
 */
router.post(
  '/htlc/record',
  [body('lockId').notEmpty(), body('txid').notEmpty(), validateRequest],
  async (req: Request, res: Response) => {
    const { lockId, txid } = req.body
    const record = getHtlcLock(lockId)
    if (!record) {
      return res.status(404).send('htlc lock not found')
    }

    try {
      const bases = getMempoolBases()
      let tx: any
      let usedBase = bases[0]
      let lastError: any
      for (const base of bases) {
        try {
          tx = await fetchWrapper.get(`${base}/tx/${txid}`)
          usedBase = base
          break
        } catch (err: any) {
          lastError = err
          if (err?.status === 404) continue
          throw err
        }
      }
      if (!tx) {
        const message = `HTLC tx not found on mempool (${bases.join(', ')}). txid=${txid}`
        console.error('[btc.htlc.record]', message, lastError?.error ?? lastError)
        return res.status(404).send(message)
      }
      const voutIndex = Array.isArray(tx?.vout)
        ? tx.vout.findIndex(
            (out: any) => out?.scriptpubkey_address === record.htlcAddress
          )
        : -1

      if (voutIndex < 0) {
        return res.status(400).send('htlc output not found in tx')
      }

      const output = tx.vout?.[voutIndex]
      console.log(
        '[btc.htlc.record] matched-output',
        JSON.stringify(
          {
            txid,
            mempoolBase: usedBase,
            htlcAddress: record.htlcAddress,
            amountSats: record.amountSats,
            vout: voutIndex,
            outputValue: output?.value,
            timeoutHeight: record.timeoutHeight
          },
          null,
          2
        )
      )

      const updated = updateHtlcLock(record.id, {
        lockTxId: txid,
        lockVout: voutIndex
      })

      res.status(200).json({
        lockId: record.id,
        htlcCreationHash: txid,
        htlcCreationVout: voutIndex,
        htlcExpirationTimestamp: String(record.timeoutHeight),
        htlcVersion: 'p2wsh-sha256-cltv-v1',
        senderPubKey: record.senderPubkey
      })
    } catch (e) {
      const bases = getMempoolBases()
      const status = (e as any)?.status
      const error = (e as any)?.error
      if (status === 404) {
        const message = `HTLC tx not found on mempool (${bases.join(', ')}). txid=${txid}`
        console.error('[btc.htlc.record]', message, error)
        return res.status(404).send(message)
      }
      console.error('[btc.htlc.record] failed', {
        txid,
        base: bases.join(', '),
        error: error ?? e
      })
      res.status(500).send('failed to record HTLC lock tx')
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
  '/height',
  async (_req: Request, res: Response) => {
    try {
      const height = await getChainHeight()
      res.status(200).json({ height })
    } catch (e) {
      console.error('[btc.height] failed', e)
      res.status(500).send('failed to get chain height')
    }
  }
)

router.get('/tip', async (_req: Request, res: Response) => {
  try {
    const tip = await getChainTip()
    res.status(200).json(tip)
  } catch (e) {
    console.error('[btc.tip] failed', e)
    res.status(500).send('failed to get chain tip')
  }
})

router.get(
  '/outspend',
  [
    query('txid').isHexadecimal(),
    query('vout').isInt({ min: 0 }),
    validateRequest
  ],
  async (req: Request, res: Response) => {
    const txid = req.query.txid as string
    const vout = Number(req.query.vout)
    try {
      const base = getMempoolBase()
      const outspend = await fetchWrapper.get<{
        spent?: boolean
        txid?: string
        status?: { confirmed?: boolean; block_height?: number }
      }>(`${base}/tx/${txid}/outspend/${vout}`)
      res.send(outspend)
    } catch (e) {
      console.error('[btc.outspend] failed', e)
      res.status(500).send('failed to get outspend status')
    }
  }
)

router.get(
  '/transaction',
  [query('hash').isHexadecimal(), validateRequest],
  async (req: Request, res: Response) => {
    const hash = req.query.hash as string

    try {
      const base = getMempoolBase()
      const btcInfo = await fetchWrapper.get<BtcTransactionDto>(
        `${base}/tx/${hash}`
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
      const base = getMempoolBase()
      const url = `${base}/address/${address}/utxo`

      const response = await fetchWrapper.get<BtcUtxoResponseDto[]>(url)
      res.send(response)
    } catch (e) {
      console.error(e)
      res.status(500).send(`failed to get bitcoin utxo for address ${address}`)
    }
  }
)

export default router
