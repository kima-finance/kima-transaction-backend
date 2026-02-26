import {
  BtcHtlcLockValidationError,
  ensureBtcHtlcLockRegistered
} from './btc-htlc-lock'

jest.mock('core/env', () => ({
  __esModule: true,
  default: {
    KIMA_BACKEND_NODE_PROVIDER_QUERY: 'https://kima-node.test'
  }
}))

jest.mock('@kimafinance/kima-transaction-api', () => ({
  getHtlcLockingTransactions: jest.fn(),
  submitHtlcLock: jest.fn()
}))

jest.mock('@features/btc/htlc-store', () => ({
  getHtlcLock: jest.fn()
}))

import {
  getHtlcLockingTransactions,
  submitHtlcLock
} from '@kimafinance/kima-transaction-api'
import { getHtlcLock } from '@features/btc/htlc-store'

const mockGetHtlcLockingTransactions =
  getHtlcLockingTransactions as jest.MockedFunction<
    typeof getHtlcLockingTransactions
  >
const mockSubmitHtlcLock = submitHtlcLock as jest.MockedFunction<
  typeof submitHtlcLock
>
const mockGetHtlcLock = getHtlcLock as jest.MockedFunction<typeof getHtlcLock>
const VALID_COMPRESSED_PUBKEY = `02${'ab'.repeat(32)}`

describe('ensureBtcHtlcLockRegistered', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  it('submits lock registration when lock is not present on Kima', async () => {
    mockGetHtlcLock.mockReturnValue({
      id: 'lock-1',
      preimageHex: 'aa',
      hashHex: 'bb',
      htlcAddress: 'tb1htlc',
      senderAddress: 'tb1sender',
      senderPubkey: VALID_COMPRESSED_PUBKEY,
      recipientAddress: 'tb1recipient',
      amountSats: '125000000',
      timeoutHeight: 12345,
      lockTxId: 'tx-hash-1',
      lockVout: 0
    })
    mockGetHtlcLockingTransactions.mockResolvedValue({
      htlcLockingTransaction: []
    } as any)
    mockSubmitHtlcLock.mockResolvedValue({ events: [] } as any)

    const result = await ensureBtcHtlcLockRegistered({
      lockId: 'lock-1'
    })

    expect(result.status).toBe('submitted')
    expect(mockSubmitHtlcLock).toHaveBeenCalledWith({
      fromAddress: 'tb1sender',
      senderPubkey: VALID_COMPRESSED_PUBKEY,
      amount: '1.25',
      htlcTimeout: '12345',
      txHash: 'tx-hash-1',
      htlcAddress: 'tb1htlc'
    })
  })

  it('canonicalizes sender pubkey before lock registration submit', async () => {
    mockGetHtlcLock.mockReturnValue(undefined)
    mockGetHtlcLockingTransactions.mockResolvedValue({
      htlcLockingTransaction: []
    } as any)
    mockSubmitHtlcLock.mockResolvedValue({ events: [] } as any)

    await ensureBtcHtlcLockRegistered({
      originAddress: 'tb1sender',
      senderPubKey: `0x02${'AB'.repeat(32)}`,
      htlcAmountSats: '100000',
      htlcExpirationTimestamp: '12345',
      htlcAddress: 'tb1htlc',
      htlcCreationHash: 'tx-hash-canonical'
    })

    expect(mockSubmitHtlcLock).toHaveBeenCalledWith(
      expect.objectContaining({
        senderPubkey: `02${'ab'.repeat(32)}`
      })
    )
  })

  it('is idempotent when lock is already registered on Kima', async () => {
    mockGetHtlcLock.mockReturnValue(undefined)
    mockGetHtlcLockingTransactions.mockResolvedValue({
      htlcLockingTransaction: [
        {
          txHash: 'tx-hash-existing',
          senderAddress: 'tb1sender',
          status: 'Completed',
          pull_status: 'htlc_pull_available'
        }
      ]
    } as any)

    const result = await ensureBtcHtlcLockRegistered({
      originAddress: 'tb1sender',
      senderPubKey: VALID_COMPRESSED_PUBKEY,
      htlcAmountSats: '100000',
      htlcExpirationTimestamp: '111',
      htlcAddress: 'tb1htlc',
      htlcCreationHash: 'tx-hash-existing'
    })

    expect(result.status).toBe('already-registered')
    expect(mockSubmitHtlcLock).not.toHaveBeenCalled()
  })

  it('fails with validation error when required BTC lock fields are missing', async () => {
    mockGetHtlcLock.mockReturnValue(undefined)

    await expect(
      ensureBtcHtlcLockRegistered({
        originAddress: 'tb1sender',
        htlcCreationHash: 'tx-hash-only'
      })
    ).rejects.toBeInstanceOf(BtcHtlcLockValidationError)
  })
})
