import { formatterFloat } from '@shared/utils/numbers'

export type TxMessageInputs = {
  allowanceAmount: string // number in whole units (stringified)
  originChain: string
  originSymbol: string
  targetAddress: string
  targetChain: string
}

export const txTransferMessage = (data: TxMessageInputs): string => {
  const amount = Number(data.allowanceAmount)
  return `I approve the transfer of ${formatterFloat.format(amount)} ${data.originSymbol} from ${data.originChain} to ${data.targetAddress} on ${data.targetChain}.`
}

export const txSwapMessage = (data: TxMessageInputs): string => {
  const amount = Number(data.allowanceAmount)
  return `I approve the swap of ${formatterFloat.format(amount)} ${data.originSymbol} from ${data.originChain} to ${data.targetAddress} on ${data.targetChain}.`
}

export default { txTransferMessage, txSwapMessage }
