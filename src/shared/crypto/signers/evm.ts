import { createWalletClient, http } from 'viem'
import { privateKeyToAccount } from 'viem/accounts'
import type { Chain } from '@features/chains/types/chain'

const signEvmMessage = async (
  chain: Chain,
  message: string
): Promise<string> => {
  const privateKey = process.env.EVM_PRIVATE_KEY
  if (!privateKey) throw new Error(`Missing private key for ${chain.shortName}`)

  const account = privateKeyToAccount(privateKey as `0x${string}`)
  const client = createWalletClient({
    account,
    chain,
    transport: http(chain.rpcUrls.default.http[0])
  })
  return client.signMessage({ account, message })
}

export default signEvmMessage
export { signEvmMessage }
