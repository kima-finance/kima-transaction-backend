import {
  getHtlcLockingTransactions,
  submitHtlcLock
} from '@kimafinance/kima-transaction-api'
import { getHtlcLock } from '@features/btc/htlc-store'
import type { HtlcTransactionResponseDto } from '@features/htlc/types/htlc-transaction.dto'
import ENV from 'core/env'
import { encodeHexString } from '@shared/utils/hex'

type EnsureBtcHtlcLockArgs = {
  lockId?: string
  originAddress?: string
  senderPubKey?: string
  htlcAmountSats?: string
  htlcExpirationTimestamp?: string | number
  htlcAddress?: string
  htlcCreationHash?: string
}

export class BtcHtlcLockValidationError extends Error {}

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

const findExistingHtlcLockByTxHash = async (args: {
  txHash: string
  senderAddress?: string
}) => {
  const response = await getHtlcLockingTransactions({
    baseUrl: ENV.KIMA_BACKEND_NODE_PROVIDER_QUERY
  })
  const items =
    (response as HtlcTransactionResponseDto)?.htlcLockingTransaction ?? []
  return items.find((item) => {
    if (item?.txHash !== args.txHash) return false
    if (args.senderAddress && item?.senderAddress !== args.senderAddress) {
      return false
    }
    return true
  })
}

const getKimaErrorMessage = (result: any): string | undefined => {
  const errorEvent = Array.isArray(result?.events)
    ? result.events.find((evt: any) => evt?.type === 'error')
    : undefined
  if (!errorEvent) return undefined
  const messageAttr = Array.isArray(errorEvent.attributes)
    ? errorEvent.attributes.find((attr: any) => attr?.key === 'content')
    : undefined
  return messageAttr?.value
}

export const ensureBtcHtlcLockRegistered = async (
  args: EnsureBtcHtlcLockArgs
) => {
  const record = args.lockId ? getHtlcLock(args.lockId) : undefined

  const fromAddress = args.originAddress || record?.senderAddress
  const senderPubkey = args.senderPubKey || record?.senderPubkey
  const amountSats = args.htlcAmountSats || record?.amountSats
  const htlcTimeout =
    args.htlcExpirationTimestamp != null && args.htlcExpirationTimestamp !== ''
      ? String(args.htlcExpirationTimestamp)
      : record?.timeoutHeight != null
        ? String(record.timeoutHeight)
        : undefined
  const htlcAddress = args.htlcAddress || record?.htlcAddress
  const txHash = args.htlcCreationHash || record?.lockTxId

  const missing: string[] = []
  if (!fromAddress) missing.push('originAddress')
  if (!senderPubkey) missing.push('senderPubKey')
  if (!amountSats) missing.push('htlcAmountSats')
  if (!htlcTimeout) missing.push('htlcExpirationTimestamp')
  if (!htlcAddress) missing.push('htlcAddress')
  if (!txHash) missing.push('htlcCreationHash')
  if (missing.length > 0) {
    throw new BtcHtlcLockValidationError(
      `Missing BTC HTLC lock parameters: ${missing.join(', ')}`
    )
  }
  const resolvedFromAddress = fromAddress as string
  const resolvedSenderPubkey = senderPubkey as string
  const resolvedAmountSats = amountSats as string
  const resolvedHtlcTimeout = htlcTimeout as string
  const resolvedHtlcAddress = htlcAddress as string
  const resolvedTxHash = txHash as string
  const encodedSenderPubkey = (() => {
    try {
      return encodeHexString(resolvedSenderPubkey, 'senderPubKey')
    } catch (error) {
      throw new BtcHtlcLockValidationError(
        error instanceof Error ? error.message : 'senderPubKey is invalid'
      )
    }
  })()

  try {
    const existing = await findExistingHtlcLockByTxHash({
      txHash: resolvedTxHash,
      senderAddress: resolvedFromAddress
    })
    if (existing) {
      return { status: 'already-registered', existing }
    }
  } catch (error) {
    console.warn(
      '[submit.btc-htlc-lock] pre-check failed, submitting lock anyway',
      error
    )
  }

  const kimaPayload = {
    fromAddress: resolvedFromAddress,
    senderPubkey: encodedSenderPubkey,
    amount: satsToBtcString(resolvedAmountSats),
    htlcTimeout: resolvedHtlcTimeout,
    txHash: resolvedTxHash,
    htlcAddress: resolvedHtlcAddress
  }

  console.log(
    '[submit.btc-htlc-lock] payload to kima',
    JSON.stringify(
      {
        ...kimaPayload,
        senderPubkeyRaw: resolvedSenderPubkey,
        senderPubkeyHexEncoded: encodedSenderPubkey
      },
      null,
      2
    )
  )

  const submitResult = await submitHtlcLock(kimaPayload)

  const errorMessage = getKimaErrorMessage(submitResult)
  if (!errorMessage) {
    return { status: 'submitted', submitResult }
  }

  try {
    const existingAfterError = await findExistingHtlcLockByTxHash({
      txHash: resolvedTxHash,
      senderAddress: resolvedFromAddress
    })
    if (existingAfterError) {
      return {
        status: 'already-registered',
        existing: existingAfterError,
        submitResult
      }
    }
  } catch (error) {
    console.warn('[submit.btc-htlc-lock] post-error check failed', error)
  }

  throw new Error(`Failed to register BTC HTLC lock: ${errorMessage}`)
}
