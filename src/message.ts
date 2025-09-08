import { formatterFloat } from './utils'

export interface TxMessageInputs extends Record<string, string> {
  allowanceAmount: string // number in whole units
  originChain: string
  originSymbol: string
  targetAddress: string
  targetChain: string
  // targetSymbol: string
}

export const txTransferMessage = (data: TxMessageInputs): string => {
  const message = `I approve the transfer of ${formatterFloat.format(Number(data.allowanceAmount))} ${data.originSymbol} from ${data.originChain} to ${data.targetAddress} on ${data.targetChain}.`
  console.log('message:', message)
  return message
}

export const txSwapMessage = (data: TxMessageInputs): string => {
  const message = `I approve the swap of ${formatterFloat.format(Number(data.allowanceAmount))} ${data.originSymbol} from ${data.originChain} to ${data.targetAddress} on ${data.targetChain}.`
  console.log('message:', message)
  return message
}
