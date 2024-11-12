import { Request, Response, Router } from 'express'
import { fetchWrapper } from '../fetch-wrapper'
import { param } from 'express-validator'
import { validateRequest } from '../middleware/validation'
import { ChainName } from '../types/chain-name'

const chainsRouter = Router()
const baseUrl = `${process.env.KIMA_BACKEND_NODE_PROVIDER_QUERY}/kima-finance/kima-blockchain`

chainsRouter.get('/chain', async (_, res: Response) => {
  try {
    const result = await fetchWrapper.get(`${baseUrl}/chain/get_chains`)
    res.json(result)
  } catch (e) {
    console.error(e)
    res.status(500).send('failed to get chains')
  }
})

chainsRouter.get(
  '/get_available_chains/:targetChain',
  [
    param('targetChain')
      .isIn(Object.values(ChainName))
      .withMessage('targetChain must be a valid chain name'),
    validateRequest
  ],
  async (req: Request, res: Response) => {
    const { targetChain } = req.params
    try {
      const result = await fetchWrapper.get(
        `${baseUrl}/chains/get_available_chains/${targetChain}`
      )
      res.json(result)
    } catch (e) {
      console.error(e)
      res.status(500).send(`failed to get available chains for ${targetChain}`)
    }
  }
)

chainsRouter.get(
  '/get_currencies/:originChain/:targetChain',
  [
    param('originChain')
      .isIn(Object.values(ChainName))
      .withMessage('originChain must be a valid chain name'),
    param('targetChain')
      .isIn(Object.values(ChainName))
      .withMessage('targetChain must be a valid chain name'),
    validateRequest
  ],
  async (req: Request, res: Response) => {
    const { originChain, targetChain } = req.params
    try {
      const result = await fetchWrapper.get(
        `${baseUrl}/chains/get_currencies/${originChain}/${targetChain}`
      )
      res.json(result)
    } catch (e) {
      console.error(e)
      res
        .status(500)
        .send(`failed to get currencies for ${originChain} to ${targetChain}`)
    }
  }
)

chainsRouter.get('/pool_balance', async (_, res: Response) => {
  try {
    const result = await fetchWrapper.get(
      `${process.env.KIMA_BACKEND_NODE_PROVIDER_QUERY}/kima-finance/kima-blockchain/chains/pool_balance`
    )
    res.json(result)
  } catch (e) {
    console.error(e)
    res.status(500).send('failed to get pool balance')
  }
})

chainsRouter.get('/tss_pubkey', async (_, res: Response) => {
  try {
    const result = await fetchWrapper.get(
      `${process.env.KIMA_BACKEND_NODE_PROVIDER_QUERY}/kima-finance/kima-blockchain/kima/tss_pubkey`
    )
    res.json(result)
  } catch (e) {
    console.error(e)
    res.status(500).send('failed to get tss pubkeys')
  }
})

export default chainsRouter
