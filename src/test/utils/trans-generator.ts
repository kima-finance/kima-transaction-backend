import { TransactionDetailsType } from '../../types/submit-transaction'

export const generateTransDetails = (
  data?: Partial<TransactionDetailsType>
) => {
  return {
    amount: '100000000',
    fee: '500000',
    decimals: 6,
    originAddress: '0xDD4c48C0B24039969fC16D1cdF626eaB821d3384',
    originChain: 'ETH',
    originSymbol: 'USDK',
    targetAddress: '0x001474b877f98f41701397a65d4d313ab180c7b2',
    targetChain: 'POL',
    targetSymbol: 'USDK',
    ...data
  }
}
