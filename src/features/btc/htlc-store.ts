import { v4 as uuidv4 } from 'uuid'

export type HtlcLockRecord = {
  id: string
  preimageHex: string
  hashHex: string
  htlcAddress: string
  senderAddress: string
  senderPubkey: string
  recipientAddress: string
  amountSats: string
  timeoutHeight: number
  lockTxId?: string
  lockVout?: number
}

const store = new Map<string, HtlcLockRecord>()

export const createHtlcLock = (data: Omit<HtlcLockRecord, 'id'>) => {
  const id = uuidv4()
  const record: HtlcLockRecord = { id, ...data }
  store.set(id, record)
  return record
}

export const getHtlcLock = (id: string) => store.get(id)

export const updateHtlcLock = (
  id: string,
  updates: Partial<HtlcLockRecord>
) => {
  const existing = store.get(id)
  if (!existing) return undefined
  const next = { ...existing, ...updates }
  store.set(id, next)
  return next
}

export const listHtlcLocks = () => Array.from(store.values())
