import { Request, Response, Router } from 'express'
import { fetchWrapper } from '../fetch-wrapper'
import { Network, validate as validateBTC } from 'bitcoin-address-validation'
import { query } from 'express-validator'
import { validateRequest } from '../middleware/validation'

const btcRouter = Router()

btcRouter.get(
  '/balance',
  [
    query('address').custom((address) => validateBTC(address, Network.testnet)),
    validateRequest
  ],
  async (req: Request, res: Response) => {
    const address = req.query.address as string

    try {
      const btcInfo: any = await fetchWrapper.get(
        `https://blockstream.info/testnet/api/address/${address}`
      )

      const balance =
        btcInfo.chain_stats.funded_txo_sum - btcInfo.chain_stats.spent_txo_sum

      res.send({ balance })
      return
    } catch (e) {
      console.log(e)
    }

    res.status(500).send('failed to get bitcoin balance')
  }
)

btcRouter.get(
  '/transaction',
  [query('hash').isHexadecimal(), validateRequest],
  async (req: Request, res: Response) => {
    const hash = req.query.hash as string

    try {
      const btcInfo: any = await fetchWrapper.get(
        `https://blockstream.info/testnet/api/tx/${hash}`
      )

      res.send(btcInfo)
      return
    } catch (e) {
      console.log(e)
    }

    res.status(500).send('failed to get bitcoin tx info')
  }
)

export default btcRouter
