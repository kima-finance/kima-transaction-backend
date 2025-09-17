/**
 * @openapi
 * tags:
 *   - name: Chains
 *     description: Chain metadata and availability
 */
import { Request, Response, Router } from 'express'
import fetchWrapper from '@shared/http/fetch'
import { param } from 'express-validator'
import { validateRequest } from '@shared/middleware/validation'
import chainsService from '../services/singleton'
import { ChainsResponseDto } from '../types/chains-response.dto'
import ENV from 'core/env'
import { BlockchainParamsResponseDto } from '../types/kima-blockchain-params.dto'
import { ChainEnv } from 'core/types/chain-env'
import { ChainName } from '../types/chain-name'
import { AvailableChainsResponseDto } from '../types/available-chains-response.dto'

const chainsRouter = Router()
const baseUrl = `${ENV.KIMA_BACKEND_NODE_PROVIDER_QUERY}/kima-finance/kima-blockchain`
const isSimulator = process.env.SIMULATOR

/**
 * @openapi
 * /chains/chain:
 *   get:
 *     summary: Raw chain registry (proxy)
 *     description: Returns the raw chain list from Kima API.
 *     tags: [Chains]
 *     responses:
 *       200:
 *         description: Chain registry
 *       500:
 *         description: Failed to get chains
 */
chainsRouter.get('/chain', async (_req, res: Response) => {
  try {
    const result = await fetchWrapper.get<ChainsResponseDto>(
      `${baseUrl}/chains/chain`
    )
    res.json(result)
  } catch (e) {
    console.error(e)
    res.status(500).send('failed to get chains')
  }
})

/**
 * @openapi
 * /chains/env:
 *   get:
 *     summary: Environment info for frontend
 *     description: Returns current Kima environment, explorer URL, transfer limits, and payment partner id.
 *     tags: [Chains]
 *     responses:
 *       200:
 *         description: Environment info
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 env:
 *                   type: string
 *                   enum: [mainnet, testnet]
 *                 kimaExplorer:
 *                   type: string
 *                 transferLimitMaxUSDT:
 *                   type: string
 *                   nullable: true
 *                 paymentPartnerId:
 *                   type: string
 *                   nullable: true
 *       500:
 *         description: Failed to get environment info
 */
chainsRouter.get('/env', async (_req, res: Response) => {
  let maxAmount: string | null
  try {
    if (!isSimulator) {
      const response = await fetchWrapper.get<BlockchainParamsResponseDto>(
        `${ENV.KIMA_BACKEND_NODE_PROVIDER_QUERY}/kima-finance/kima-blockchain/transaction/params`
      )
      maxAmount =
        typeof response === 'string'
          ? null
          : response.params.transferLimitMaxUSDT
    } else {
      maxAmount = '100000'
    }
  } catch (e) {
    console.error('/chains/env: failed to get max tx amount from Kima API', e)
    maxAmount = null
  }

  return res.json({
    env: ENV.KIMA_ENVIRONMENT as ChainEnv,
    kimaExplorer: ENV.KIMA_EXPLORER as string,
    transferLimitMaxUSDT: maxAmount,
    paymentPartnerId: ENV.PAYMENT_PARTNER_ID as string
  })
})

/**
 * @openapi
 * /chains/get_available_chains/{targetChain}:
 *   get:
 *     summary: Get available origin chains for a target
 *     description: Returns origin chains that are available for the specified target chain.
 *     tags: [Chains]
 *     parameters:
 *       - in: path
 *         name: targetChain
 *         required: true
 *         schema:
 *           type: string
 *           enum: [ARB, AVX, BASE, BERA, BSC, ETH, OPT, POL, SOL, TRX, CFX, CC, BANK, FIAT]
 *     responses:
 *       200:
 *         description: Available chains
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 Chains:
 *                   type: array
 *                   items:
 *                     type: string
 *       400:
 *         description: Validation error
 *       500:
 *         description: Failed to get available chains
 */
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
      const result = await fetchWrapper.get<AvailableChainsResponseDto>(
        `${baseUrl}/chains/get_available_chains/${targetChain}`
      )
      res.json(result)
    } catch (e) {
      console.error(e)
      res.status(500).send(`failed to get available chains for ${targetChain}`)
    }
  }
)

/**
 * @openapi
 * /chains/get_currencies/{originChain}/{targetChain}:
 *   get:
 *     summary: Get available currencies between two chains
 *     description: Returns the available token symbols for a route from origin to target.
 *     tags: [Chains]
 *     parameters:
 *       - in: path
 *         name: originChain
 *         required: true
 *         schema:
 *           type: string
 *           enum: [ARB, AVX, BASE, BERA, BSC, ETH, OPT, POL, SOL, TRX, CFX, CC, BANK, FIAT]
 *       - in: path
 *         name: targetChain
 *         required: true
 *         schema:
 *           type: string
 *           enum: [ARB, AVX, BASE, BERA, BSC, ETH, OPT, POL, SOL, TRX, CFX, CC, BANK, FIAT]
 *     responses:
 *       200:
 *         description: Available currencies
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 Currencies:
 *                   type: array
 *                   items:
 *                     type: string
 *       400:
 *         description: Validation error
 *       500:
 *         description: Failed to get currencies
 */
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
      const result = await chainsService.getAvailableCurrencies({
        originChain,
        targetChain
      })
      res.json({ Currencies: result })
    } catch (e) {
      console.error(e)
      res
        .status(500)
        .send(`failed to get currencies for ${originChain} to ${targetChain}`)
    }
  }
)

/**
 * @openapi
 * /chains/names:
 *   get:
 *     summary: Get chain short names
 *     description: Returns supported chain short names as reported by Kima API and filters.
 *     tags: [Chains]
 *     responses:
 *       200:
 *         description: Chain names
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 Chains:
 *                   type: array
 *                   items:
 *                     type: string
 *       500:
 *         description: Failed to get chain names
 */
chainsRouter.get('/names', async (_req, res: Response) => {
  try {
    const result = await chainsService.getChainNames()
    res.json({ Chains: result })
  } catch (e) {
    console.error(e)
    res.status(500).send('failed to get chain names')
  }
})

/**
 * @openapi
 * /chains/pool_balance:
 *   get:
 *     summary: Get pool balances
 *     description: Returns pool balances for each chain.
 *     tags: [Chains]
 *     responses:
 *       200:
 *         description: Pool balances
 *       500:
 *         description: Failed to get pool balance
 */
chainsRouter.get('/pool_balance', async (_req, res: Response) => {
  try {
    const result = await chainsService.getPoolBalances()
    res.json({ poolBalance: result })
  } catch (e) {
    console.error(e)
    res.status(500).send('failed to get pool balance')
  }
})

/**
 * @openapi
 * /chains/pool:
 *   get:
 *     summary: Get pool addresses with balances
 *     description: Returns TSS-derived pool addresses and balances for each chain.
 *     tags: [Chains]
 *     responses:
 *       200:
 *         description: Pools
 *       500:
 *         description: Failed to get pools
 */
chainsRouter.get('/pool', async (_req, res: Response) => {
  try {
    const result = await chainsService.getPools()
    res.json(result)
  } catch (e) {
    console.error(e)
    res.status(500).send('failed to get pools')
  }
})

/**
 * @openapi
 * /chains/tss_pubkey:
 *   get:
 *     summary: Get Kima TSS public keys
 *     description: Returns TSS public keys used to derive pool addresses.
 *     tags: [Chains]
 *     responses:
 *       200:
 *         description: TSS public keys
 *       500:
 *         description: Failed to get TSS pubkeys
 */
chainsRouter.get('/tss_pubkey', async (_req, res: Response) => {
  try {
    const result = await chainsService.getTssPubkeys()
    res.status(200).json(result)
  } catch (e) {
    console.error(e)
    res.status(500).send('failed to get tss pubkeys')
  }
})

/**
 * @openapi
 * /chains:
 *   get:
 *     summary: Supported chains (filtered)
 *     description: Returns locally supported chains, reflecting Kima enable/disable and local filters.
 *     tags: [Chains]
 *     responses:
 *       200:
 *         description: Supported chain objects
 *       500:
 *         description: Failed to fetch chain data
 */
chainsRouter.get('/', async (_req: Request, res: Response) => {
  try {
    const chains = await chainsService.supportedChains()
    res.status(200).json(chains)
  } catch (e) {
    console.error('cant get chains: ', e)
    res.status(500).send('failed to fetch chain data')
  }
})

export default chainsRouter
