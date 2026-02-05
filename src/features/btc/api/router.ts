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
  getHtlcLockingTransactions,
  submitHtlcLock
} from '@kimafinance/kima-transaction-api'
import ENV from 'core/env'
import {
  createHtlcLock,
  getHtlcLock,
  listHtlcLocks,
  updateHtlcLock
} from '../htlc-store'
import {
  getBitcoinJsNetwork,
  getBtcMempoolBase,
  getBtcValidationNetwork
} from '@shared/crypto/btc'
import { isTestnet } from 'core/constants'
import type { HtlcTransactionResponseDto } from '@features/htlc/types/htlc-transaction.dto'

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

const satsToBtcString = (sats: string): string => {
  const value = BigInt(sats)
  const whole = value / 100000000n
  const fraction = value % 100000000n
  if (fraction === 0n) return whole.toString()
  const fractionStr = fraction
    .toString()
    .padStart(8, '0')
    .replace(/0+$/, '')
  return `${whole.toString()}.${fractionStr}`
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
        senderPubkey: senderPubkey as string,
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
        senderPubkey,
        recipientAddress: htlcRecipient,
        amountSats: String(amountSats),
        timeoutHeight
      })

      console.log(
        '[btc.htlc.lock-intent] created',
        JSON.stringify(
          {
            senderAddress,
            senderPubkey,
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
        senderPubkey: record.senderPubkey
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
 * /btc/htlc/request-lock:
 *   post:
 *     summary: Request HTLC lock on Kima Chain
 *     tags: [BTC]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               lockId: { type: string, description: "HTLC lock id from /btc/htlc/lock-intent" }
 *               senderAddress: { type: string }
 *               senderPubkey: { type: string }
 *               amountSats: { type: string }
 *               timeout: { type: number }
 *               htlcAddress: { type: string }
 *               txHash: { type: string, description: "BTC lock tx hash" }
 *     responses:
 *       200:
 *         description: Kima Chain execution result
 */
router.post(
  '/htlc/request-lock',
  [
    body('lockId').optional().isString(),
    body('senderAddress').optional().isString(),
    body('senderPubkey').optional().isString(),
    body('amountSats').optional().isString(),
    body('timeout').optional().isInt(),
    body('htlcAddress').optional().isString(),
    body('txHash').optional().isString(),
    validateRequest
  ],
  async (req: Request, res: Response) => {
    const {
      lockId,
      senderAddress,
      senderPubkey,
      amountSats,
      timeout,
      htlcAddress,
      txHash
    } = req.body as Record<string, string>

    const record = lockId ? getHtlcLock(String(lockId)) : undefined

    const resolvedSender = senderAddress || record?.senderAddress
    const resolvedPubkey = senderPubkey || record?.senderPubkey
    const resolvedAmountSats = amountSats || record?.amountSats
    const resolvedTimeout = timeout || record?.timeoutHeight
    const resolvedHtlcAddress = htlcAddress || record?.htlcAddress
    const resolvedTxHash = txHash || record?.lockTxId

    if (!resolvedSender || !resolvedPubkey || !resolvedAmountSats) {
      return res
        .status(400)
        .send('Missing sender address, pubkey, or amountSats')
    }
    if (!resolvedTimeout || !resolvedHtlcAddress || !resolvedTxHash) {
      return res
        .status(400)
        .send('Missing timeout, htlcAddress, or txHash')
    }

    try {
      const amountBtc = satsToBtcString(String(resolvedAmountSats))
      const result = await submitHtlcLock({
        fromAddress: resolvedSender,
        senderPubkey: resolvedPubkey,
        amount: amountBtc,
        htlcTimeout: String(resolvedTimeout),
        txHash: resolvedTxHash,
        htlcAddress: resolvedHtlcAddress
      })
      res.status(200).json(result)
    } catch (e) {
      console.error('[btc.htlc.request-lock] failed', e)
      res.status(500).send('failed to submit HTLC lock to Kima chain')
    }
  }
)

/**
 * @openapi
 * /btc/htlc/locking-status:
 *   get:
 *     summary: Check HTLC lock status on Kima Chain
 *     tags: [BTC]
 *     parameters:
 *       - name: txHash
 *         in: query
 *         required: true
 *         schema:
 *           type: string
 *       - name: senderAddress
 *         in: query
 *         required: false
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: HTLC status
 */
router.get(
  '/htlc/locking-status',
  [query('txHash').notEmpty(), validateRequest],
  async (req: Request, res: Response) => {
    const txHash = String(req.query.txHash ?? '').trim()
    const senderAddress = String(req.query.senderAddress ?? '').trim()

    try {
      const response = await getHtlcLockingTransactions({
        baseUrl: ENV.KIMA_BACKEND_NODE_PROVIDER_QUERY
      })
      console.log('[btc.htlc.locking-status] raw response', response)
      const items =
        (response as HtlcTransactionResponseDto)?.htlcLockingTransaction ?? []
      const match = items.find((item) => {
        if (item?.txHash !== txHash) return false
        if (senderAddress && item?.senderAddress !== senderAddress) return false
        return true
      })

      if (!match) {
        return res.status(404).send('HTLC lock not found on Kima chain yet')
      }

      const isReady =
        match.status === 'Completed' &&
        match.pull_status === 'htlc_pull_available'

      res.status(200).json({
        isReady,
        status: match.status,
        pullStatus: match.pull_status,
        htlc: match
      })
    } catch (e) {
      console.error('[btc.htlc.locking-status] failed', e)
      res.status(500).send('failed to fetch HTLC lock status from Kima chain')
    }
  }
)

/**
 * @openapi
 * /btc/htlc/scan:
 *   get:
 *     summary: Scan HTLC address UTXOs (on-chain)
 *     tags: [BTC]
 *     parameters:
 *       - name: address
 *         in: query
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: UTXO list for address
 */
router.get(
  '/htlc/scan',
  [query('address').notEmpty(), validateRequest],
  async (req: Request, res: Response) => {
    const address = (req.query.address as string).trim()
    const networkType = getBtcValidationNetwork()
    if (!validateBTC(address, networkType)) {
      return res
        .status(400)
        .send('HTLC address is not valid for this network')
    }

    try {
      const base = getMempoolBase()
      const utxos = await fetchWrapper.get(`${base}/address/${address}/utxo`)
      res.status(200).json({ address, utxos })
    } catch (e) {
      console.error('[btc.htlc.scan] failed', e)
      res.status(500).send('failed to scan HTLC address')
    }
  }
)

/**
 * @openapi
 * /btc/htlc/locks:
 *   get:
 *     summary: List HTLC locks (in-memory)
 *     tags: [BTC]
 *     responses:
 *       200:
 *         description: HTLC lock list
 */
router.get('/htlc/locks', async (_req: Request, res: Response) => {
  const address = (_req.query.address as string | undefined)?.trim()
  const locks = listHtlcLocks().filter((lock) => {
    if (!address) return true
    return lock.senderAddress === address
  })
  let height: number | null = null
  try {
    height = await getChainHeight()
  } catch {
    height = null
  }

  const result = locks.map((lock) => ({
    ...lock,
    refundable:
      height != null &&
      lock.lockTxId != null &&
      lock.lockVout != null &&
      height >= lock.timeoutHeight,
    currentHeight: height
  }))

  res.status(200).json({ locks: result })
})

/**
 * @openapi
 * /btc/htlc/refund-psbt-direct:
 *   post:
 *     summary: Build a refund PSBT without using lock store
 *     tags: [BTC]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - senderAddress
 *               - recipientAddress
 *               - senderPubkey
 *               - timeoutHeight
 *               - lockTxId
 *               - lockVout
 *               - amountSats
 *               - feeSats
 *             properties:
 *               senderAddress: { type: string }
 *               recipientAddress: { type: string }
 *               senderPubkey: { type: string }
 *               timeoutHeight: { type: number }
 *               lockTxId: { type: string }
 *               lockVout: { type: number }
 *               amountSats: { type: string }
 *               feeSats: { type: string }
 *               destinationAddress: { type: string }
 *     responses:
 *       200:
 *         description: Refund PSBT built
 */
router.post(
  '/htlc/refund-psbt-direct',
  [
    body('senderAddress').notEmpty(),
    body('recipientAddress').notEmpty(),
    body('senderPubkey').notEmpty(),
    body('timeoutHeight').isInt({ gt: 0 }),
    body('lockTxId').notEmpty(),
    body('lockVout').isInt({ min: 0 }),
    body('amountSats').notEmpty(),
    body('feeSats').isInt({ gt: 0 }),
    body('destinationAddress').optional().isString(),
    validateRequest
  ],
  async (req: Request, res: Response) => {
    const {
      senderAddress,
      recipientAddress,
      senderPubkey,
      timeoutHeight,
      lockTxId,
      lockVout,
      amountSats,
      feeSats,
      destinationAddress
    } = req.body

    const networkType = getBtcValidationNetwork()
    if (!validateBTC(senderAddress, networkType)) {
      return res
        .status(400)
        .send('Sender address is not valid for this network')
    }
    if (!validateBTC(recipientAddress, networkType)) {
      return res
        .status(400)
        .send('Recipient address is not valid for this network')
    }

    const refundAddress = destinationAddress || senderAddress
    if (!validateBTC(refundAddress, networkType)) {
      return res
        .status(400)
        .send('Refund address is not valid for this network')
    }

    try {
      const network = getBitcoinJsNetwork()
      const script = buildHtlcScript({
        recipientAddress,
        senderPubkey,
        timeoutHeight: Number(timeoutHeight),
        network
      })

      const p2wsh = bitcoin.payments.p2wsh({
        redeem: { output: script, network },
        network
      })

      if (!p2wsh.output) {
        return res.status(500).send('failed to derive HTLC scriptPubKey')
      }

      const amount = BigInt(amountSats)
      const fee = BigInt(feeSats)
      if (amount <= fee) {
        return res.status(400).send('fee exceeds HTLC amount')
      }

      const psbt = new bitcoin.Psbt({ network })
      psbt.setLocktime(Number(timeoutHeight))
      psbt.addInput({
        hash: lockTxId,
        index: Number(lockVout),
        witnessUtxo: {
          script: p2wsh.output,
          value: Number(amount)
        },
        witnessScript: script,
        sequence: 0xfffffffe
      })
      psbt.addOutput({
        address: refundAddress,
        value: Number(amount - fee)
      })

      res.status(200).json({
        refundAddress,
        amountSats: String(amount),
        feeSats: String(feeSats),
        timeoutHeight: Number(timeoutHeight),
        psbt: psbt.toBase64()
      })
    } catch (e) {
      console.error('[btc.htlc.refund-psbt-direct] failed', e)
      res.status(500).send('failed to build refund PSBT')
    }
  }
)

/**
 * @openapi
 * /btc/htlc/refund-psbt:
 *   post:
 *     summary: Build a refund PSBT for an HTLC lock (sender path)
 *     tags: [BTC]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [lockId, feeSats]
 *             properties:
 *               lockId: { type: string }
 *               feeSats: { type: string }
 *               destinationAddress: { type: string }
 *     responses:
 *       200:
 *         description: Refund PSBT built
 */
router.post(
  '/htlc/refund-psbt',
  [
    body('lockId').notEmpty(),
    body('feeSats').isInt({ gt: 0 }),
    body('destinationAddress').optional().isString(),
    validateRequest
  ],
  async (req: Request, res: Response) => {
    const { lockId, feeSats, destinationAddress } = req.body
    const record = getHtlcLock(lockId)
    if (!record) {
      return res.status(404).send('htlc lock not found')
    }
    if (record.lockTxId == null || record.lockVout == null) {
      return res.status(400).send('htlc lock tx not recorded')
    }

    const refundAddress = destinationAddress || record.senderAddress
    const networkType = getBtcValidationNetwork()
    if (!validateBTC(refundAddress, networkType)) {
      return res
        .status(400)
        .send('Refund address is not valid for this network')
    }

    try {
      const network = getBitcoinJsNetwork()
      if (!record.senderPubkey) {
        return res.status(400).send('htlc sender pubkey not found')
      }

      const script = buildHtlcScript({
        recipientAddress: record.recipientAddress,
        senderPubkey: record.senderPubkey,
        timeoutHeight: record.timeoutHeight,
        network
      })

      const p2wsh = bitcoin.payments.p2wsh({
        redeem: { output: script, network },
        network
      })

      if (!p2wsh.output) {
        return res.status(500).send('failed to derive HTLC scriptPubKey')
      }

      const amountSats = BigInt(record.amountSats)
      const fee = BigInt(feeSats)
      if (amountSats <= fee) {
        return res.status(400).send('fee exceeds HTLC amount')
      }

      const psbt = new bitcoin.Psbt({ network })
      psbt.setLocktime(record.timeoutHeight)
      psbt.addInput({
        hash: record.lockTxId,
        index: record.lockVout,
        witnessUtxo: {
          script: p2wsh.output,
          value: Number(amountSats)
        },
        witnessScript: script,
        sequence: 0xfffffffe
      })
      psbt.addOutput({
        address: refundAddress,
        value: Number(amountSats - fee)
      })

      res.status(200).json({
        lockId: record.id,
        refundAddress,
        amountSats: record.amountSats,
        feeSats: String(feeSats),
        timeoutHeight: record.timeoutHeight,
        psbt: psbt.toBase64()
      })
    } catch (e) {
      console.error('[btc.htlc.refund-psbt] failed', e)
      res.status(500).send('failed to build refund PSBT')
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
