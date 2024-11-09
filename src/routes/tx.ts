import { Request, Response, Router } from 'express'
import { fetchWrapper } from '../fetch-wrapper'
import { param } from 'express-validator'
import { validateRequest } from '../middleware/validation'

const txRouter = Router()

txRouter.get(
  '/lp/:txId/status',
  [
    param('txId')
      .isInt()
      .withMessage(
        'txId must be a valid tx id (a sequential numeric value different from the hash)'
      ),
    validateRequest
  ],
  async (req: Request, res: Response) => {
    const { txId } = req.params

    try {
      const result = await fetchWrapper.post(
        process.env.KIMA_BACKEND_NODE_PROVIDER_GRAPHQL as string,
        {
          query: `
            query TransactionDetailsKima($txId: bigint) {
              liquidity_transaction_data(where: { tx_id: { _eq: $txId } }, limit: 1) {
                failreason
                pullfailcount
                pullhash
                releasefailcount
                releasehash
                txstatus
                amount
                creator
                chain
                providerchainaddress
                symbol
                tx_id
                kimahash
              }
            }`,
          variables: {
            txId: BigInt(txId)
          }
        }
      )
      res.status(200).send(result)
    } catch (e) {
      console.error(e)
      res.status(500).send(`failed to get status for transaction ${txId}`)
    }
  }
)

txRouter.get(
  '/:txId/status',
  [
    param('txId')
      .isInt()
      .withMessage(
        'txId must be a valid tx id (a sequential numeric value different from the hash)'
      ),
    validateRequest
  ],
  async (req: Request, res: Response) => {
    const { txId } = req.params

    try {
      const result = await fetchWrapper.post(
        process.env.KIMA_BACKEND_NODE_PROVIDER_GRAPHQL as string,
        {
          query: `
            query TransactionDetailsKima($txId: bigint) {
              transaction_data(where: { tx_id: { _eq: $txId } }, limit: 1) {
                failreason
                pullfailcount
                pullhash
                releasefailcount
                releasehash
                txstatus
                amount
                creator
                originaddress
                originchain
                originsymbol
                targetsymbol
                targetaddress
                targetchain
                tx_id
                kimahash
              }
            }`,
          variables: {
            txId: BigInt(txId)
          }
        }
      )
      res.status(200).send(result)
    } catch (e) {
      console.error(e)
      res.status(500).send(`failed to get status for transaction ${txId}`)
    }
  }
)

export default txRouter
