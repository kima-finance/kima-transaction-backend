import { FEE_URL } from './constants'
import { ChainName } from './types/chain-name'
import { fetchWrapper } from './fetch-wrapper'

export interface GetFeeInput {
  amount: number
  originChain: ChainName
  targetChain: ChainName
}

/**
 * Fetch the total gas fees in USD for the given chains
 *
 * @export
 * @async
 * @param {GetFeeInput} args amount and chains
 * @returns {Promise<number>} the total fee in USD
 */
export async function calcServiceFee(args: GetFeeInput): Promise<number> {
  const { amount, originChain, targetChain } = args
  // exceptions
  if (originChain === ChainName.FIAT || targetChain === ChainName.FIAT) {
    return 0
  }

  if (originChain === ChainName.BTC) {
    return 0.0004
  }

  if (targetChain === ChainName.BTC) {
    return 0
  }

  const [originFee, targetFee] = await Promise.all([
    getServiceFee(originChain),
    getServiceFee(targetChain)
  ])

  const fee = originFee + targetFee

  // TODO: convert amount into origin token amount
  // using USD price of origin token
  // Note even stable coins are often not exactly 1:1

  // TODO: how to handle 0.05% Kima service fee?

  return fee
}

async function getServiceFee(chain: ChainName): Promise<number> {
  const result = (await fetchWrapper.get(
    `${FEE_URL}/fee/${chain}`
  )) as unknown as { fee: string }

  // parse the dash separated fee
  // <Amount USD>-<Timestamp>-<Amount Crypto>
  // we want the USD amount
  const { fee } = result
  const [amount] = fee.split('-')

  return +amount
}
