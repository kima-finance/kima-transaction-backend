import { createWalletClient, http, formatUnits } from 'viem'
import { DECIMALS, isTestnet } from './constants'
import { CHAINS } from './data/chains'
import { Chain, ChainCompatibility } from './types/chain'
import { privateKeyToAccount, privateKeyToAddress } from 'viem/accounts'
import {
  Connection,
  Keypair,
  PublicKey,
  sendAndConfirmTransaction,
  Transaction
} from '@solana/web3.js'
import bs58 from 'bs58'
import nacl from 'tweetnacl'
import naclUtil from 'tweetnacl-util'
import {
  createApproveInstruction,
  getAssociatedTokenAddress,
  TOKEN_PROGRAM_ID
} from '@solana/spl-token'
import { ecsign, keccak256, privateToAddress, toRpcSig } from 'ethereumjs-util'
import base58 from 'bs58'

export function bigintToNumber(amount: bigint, decimals: number): number {
  return Number(formatUnits(amount, decimals))
}

export function hexStringToUint8Array(hexString: string) {
  if (hexString.length % 2 !== 0) {
    throw new Error('Invalid hex string')
  }
  const arrayBuffer = new Uint8Array(hexString.length / 2)
  for (let i = 0; i < hexString.length; i += 2) {
    arrayBuffer[i / 2] = parseInt(hexString.substr(i, 2), 16)
  }
  return arrayBuffer
}

export function toFixedNumber(
  value: bigint | number | string,
  decimals = DECIMALS
): number {
  return Number(Number(value).toFixed(decimals))
}

export function bigintToFixedNumber(
  value: bigint | number | string,
  decimals = DECIMALS
): number {
  return toFixedNumber(bigintToNumber(BigInt(value), decimals), decimals)
}

/**
 * Will convert a full url or a domain name to a URL object
 * @param urlOrDomain a full url or a domain name
 * @returns {URL} the URL object
 */
export function toUrl(urlOrDomain: string): URL {
  if (!urlOrDomain) {
    throw new Error('urlOrDomain must not be empty')
  }
  return urlOrDomain.startsWith('http')
    ? new URL(urlOrDomain)
    : new URL(`http://${urlOrDomain}`)
}

export const formatterInt = new Intl.NumberFormat('en-US', {
  maximumFractionDigits: 0,
  useGrouping: false
})

export const formatterFloat = new Intl.NumberFormat('en-US', {
  maximumFractionDigits: DECIMALS,
  useGrouping: false
})
export interface SignApprovalData {
  originSymbol: string
  originChain: string
  targetAddress: string
  targetChain: string
  allowanceAmount: number // as stringified number
}

/**
 * Signs an approval message using Viem Wallet Client
 */
export const signApprovalMessage = async ({
  originSymbol,
  originChain,
  targetAddress,
  targetChain,
  allowanceAmount
}: SignApprovalData): Promise<string> => {
  const chain = CHAINS.find(
    (CHAIN) => CHAIN.shortName === originChain && !!CHAIN.testnet === isTestnet
  )

  if (!chain) throw new Error('Chain not found')

  const message = `I approve the transfer of ${allowanceAmount} ${originSymbol} from ${originChain} to ${targetAddress} on ${targetChain}.`
  console.log('message: ', message)

  if (chain.compatibility === ChainCompatibility.EVM) {
    return await signEvmMessage(chain, message)
  }

  if (chain.shortName === 'SOL') {
    return await signSolanaMessage(message)
  }

  if (chain.shortName === 'TRX') {
    return await signTronMessage(message)
  }

  throw new Error(`Unsupported compatibility: ${chain.compatibility}`)
}

/**
 * Signs an approval message using Viem Wallet Client
 */
export const signApprovalSwapMessage = async ({
  originSymbol,
  originChain,
  targetAddress,
  targetChain,
  allowanceAmount
}: SignApprovalData): Promise<string> => {
  const isTestnet = process.env.KIMA_ENVIRONMENT === 'tesnet'

  const chain = CHAINS.find(
    (CHAIN) => CHAIN.shortName === originChain && !!CHAIN.testnet === isTestnet
  )
  if (!chain) throw new Error('Chain not found')

  const message = `I approve the swap of ${allowanceAmount} ${originSymbol} from ${originChain} to ${targetAddress} on ${targetChain}.`
  console.log('message: ', message)

  if (chain.compatibility === ChainCompatibility.EVM) {
    return await signEvmMessage(chain, message)
  }

  if (chain.shortName === 'SOL') {
    return await signSolanaMessage(message)
  }

  if (chain.shortName === 'TRX') {
    return await signTronMessage(message)
  }

  throw new Error(`Unsupported compatibility: ${chain.compatibility}`)
}

const signEvmMessage = async (
  chain: Chain,
  message: string
): Promise<string> => {
  const privateKey = process.env.EVM_PRIVATE_KEY
  if (!privateKey) throw new Error(`Missing private key for ${chain.shortName}`)

  const account = privateKeyToAccount(privateKey as `0x${string}`)

  console.log('account: ', account)
  const client = createWalletClient({
    account,
    chain,
    transport: http(chain.rpcUrls.default.http[0])
  })

  const signature = await client.signMessage({
    account,
    message
  })

  return signature
}

const signSolanaMessage = async (message: string): Promise<string> => {
  const privateKey = process.env.SOL_PRIVATE_KEY // Stored in .env as base58 string
  if (!privateKey) throw new Error('Missing Solana private key')

  const keypairBytes = bs58.decode(privateKey)
  const keypair = Keypair.fromSecretKey(keypairBytes)

  console.log('keypair: ', keypair.publicKey.toBase58())

  // await sendUnlimitedApproval({keypair})

  const messageBytes = naclUtil.decodeUTF8(message)

  const signature = nacl.sign.detached(messageBytes, keypair.secretKey)
  const isValid = nacl.sign.detached.verify(
    messageBytes,
    signature,
    keypair.publicKey.toBytes()
  )

  console.log(isValid)
  if (!isValid) {
    throw new Error('Signature verification failed')
  }

  // Encode signature as hex string (with 0x prefix)
  return `0x${Buffer.from(signature).toString('hex')}`
}

const signTronMessage = (message: string): string => {
  const privateKeyHex = process.env.TRX_PRIVATE_KEY
  if (!privateKeyHex) throw new Error('Missing TRX_PRIVATE_KEY')
  const address = getTronAddressFromPrivateKey(privateKeyHex)
  console.log('recovered address: ', address)

  const privateKey = Buffer.from(privateKeyHex, 'hex')

  const prefix = `\x19TRON Signed Message:\n${message.length}${message}`

  console.log('prefix: ', prefix)
  const messageHash = keccak256(Buffer.from(prefix))
  console.log('messagehash: ', messageHash)

  const { v, r, s } = ecsign(messageHash, privateKey)

  return toRpcSig(v, r, s) // '0x' prefixed hex string
}

/**
 * Sends an unlimited SPL token approval transaction to a delegate on Solana Devnet.
 */
export const sendUnlimitedApproval = async ({
  keypair,
  mintAddress = '9YSFWfU9Ram6mAo2QP9zsTnA8yFkkkFGEs3kGgjtQKvp',
  delegateAddress = '5tvyUUqPMWVGaVsRXHoQWqGw6h9uifM45BHCTQgzwSdr',
  rpcUrl = 'https://api.devnet.solana.com'
}: {
  keypair: Keypair
  mintAddress?: string
  delegateAddress?: string
  rpcUrl?: string
}) => {
  const connection = new Connection(rpcUrl, 'confirmed')
  const owner = keypair.publicKey
  const mint = new PublicKey(mintAddress)
  const delegate = new PublicKey(delegateAddress)

  const associatedTokenAddress = await getAssociatedTokenAddress(mint, owner)

  const approveIx = createApproveInstruction(
    associatedTokenAddress,
    delegate,
    owner,
    BigInt('0xffffffffffffffff'), // max u64
    [],
    TOKEN_PROGRAM_ID
  )

  const tx = new Transaction().add(approveIx)
  tx.feePayer = owner
  tx.recentBlockhash = (await connection.getLatestBlockhash()).blockhash

  tx.sign(keypair)

  const txid = await sendAndConfirmTransaction(connection, tx, [keypair], {
    commitment: 'confirmed'
  })

  console.log('✅ Unlimited approval sent, tx:', txid)
  return txid
}

export const getTronAddressFromPrivateKey = (privateKeyHex: string): string => {
  const privateKey = Buffer.from(privateKeyHex, 'hex')
  const ethAddress = privateToAddress(privateKey) // Buffer(20)
  const addressWithPrefix = Buffer.concat([Buffer.from([0x41]), ethAddress])

  const hash = keccak256(addressWithPrefix)
  const checksum = hash.slice(0, 4)
  const base58Addr = base58.encode(Buffer.concat([addressWithPrefix, checksum]))

  return base58Addr
}
