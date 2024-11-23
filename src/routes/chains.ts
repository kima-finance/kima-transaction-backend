import { Request, Response, Router } from 'express'
import { fetchWrapper } from '../fetch-wrapper'
import { param, query } from 'express-validator'
import { validateRequest } from '../middleware/validation'
import { ChainName } from '../types/chain-name'
import { ChainsResponseDto } from '../types/chains-response.dto'
import { AvailableChainsResponseDto } from '../types/available-chains-response.dto'
import { AvailableCurrenciesResponseDto } from '../types/available-currencies-response.dto'
import { ChainEnv } from '../types/chain-env'
import chainsService from '../service/chains.service'

const chainsRouter = Router()
const baseUrl = `${process.env.KIMA_BACKEND_NODE_PROVIDER_QUERY}/kima-finance/kima-blockchain`

/**
 * @openapi
 * /chains/chain:
 *   get:
 *     summary: Get all chains (dynamic)
 *     description: Returns an array of all chains and tokens. Dynamic query from Kima API. Check disabled chains using this endpoint.
 *     tags:
 *       - Chains
 *     responses:
 *       200:
 *         description: Successful response
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 Chain:
 *                   type: array
 *                   items:
 *                     type: object
 *                     properties:
 *                       id:
 *                         type: string
 *                         format: uint64
 *                       name:
 *                         type: string
 *                       symbol:
 *                         type: string
 *                       tokens:
 *                         type: array
 *                         items:
 *                           type: object
 *                           properties:
 *                             id:
 *                               type: string
 *                               format: uint64
 *                             symbol:
 *                               type: string
 *                             address:
 *                               type: string
 *                       disabled:
 *                         type: boolean
 *                       isEvm:
 *                         type: boolean
 *       500:
 *         description: Internal server error
 *         content:
 *           text/plain:
 *             schema:
 *               type: string
 */
chainsRouter.get('/chain', async (_, res: Response) => {
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
 * @openapi /chains/env:
 *   get:
 *     summary: Get chain environment
 *     description: Returns the chain environment
 *     tags:
 *       - Chains
 *     responses:
 *       200:
 *         description: Successful response
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 env:
 *                   type: string
 *                   enum:
 *                     - mainnet
 *                     - testnet
 */
chainsRouter.get('/env', async (_, res: Response) => {
  return res.json({ env: process.env.KIMA_ENVIRONMENT as ChainEnv })
})

/**
 * @openapi
 * /chains/get_available_chains/{targetChain}:
 *   get:
 *     summary: Get available chains for a target chain
 *     description: Returns an array of available chains for a target chain
 *     tags:
 *       - Chains
 *     parameters:
 *       - name: targetChain
 *         in: path
 *         required: true
 *         description: Target chain
 *         schema:
 *           type: string
 *           enum:
 *             - ARB
 *             - AVX
 *             - BSC
 *             - BTC
 *             - ETH
 *             - FIAT
 *             - OPT
 *             - POL
 *             - SOL
 *             - TRX
 *     responses:
 *       200:
 *         description: Successful response
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
 *         description: Internal server error
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 error:
 *                   type: string
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
 *     summary: Get currencies for a source chain and a target chain
 *     description: Returns an array of currencies for a source chain and a target chain
 *     tags:
 *       - Chains
 *     parameters:
 *       - name: originChain
 *         in: path
 *         required: true
 *         description: Source chain
 *         schema:
 *           type: string
 *           enum:
 *             - ARB
 *             - AVX
 *             - BSC
 *             - BTC
 *             - ETH
 *             - FIAT
 *             - OPT
 *             - POL
 *             - SOL
 *             - TRX
 *       - name: targetChain
 *         in: path
 *         required: true
 *         description: Target chain
 *         schema:
 *           type: string
 *           enum:
 *             - ARBITRUM
 *             - AVALANCHE
 *             - BSC
 *             - BTC
 *             - ETHEREUM
 *             - FIAT
 *             - OPTIMISM
 *             - POLYGON
 *             - POLYGON_ZKEVM
 *             - SOLANA
 *             - TRON
 *     responses:
 *       200:
 *         description: Successful response
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 Currencies:
 *                   type: array
 *                   items:
 *                     type: string
 *       500:
 *         description: Internal server error
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 error:
 *                   type: string
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
      res.json({
        Currencies: result
      })
    } catch (e) {
      console.error(e)
      res
        .status(500)
        .send(`failed to get currencies for ${originChain} to ${targetChain}`)
    }
  }
)

/**
 * @openapi /chains/names:
 *   get:
 *     summary: Get chain names
 *     description: Returns an array of all chain names
 *     tags:
 *       - Chains
 *     responses:
 *       200:
 *         description: Successful response
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 Chain:
 *                   type: array
 *                   items:
 *                     type: string
 */
chainsRouter.get('/names', async (_, res: Response) => {
  try {
    const result = await chainsService.getChainNames()
    res.json({
      Chains: result
    })
  } catch (e) {
    console.error(e)
    res.status(500).send('failed to get chain names')
  }
})

/**
 * @openapi
 * /chains/pool_balance:
 *   get:
 *     summary: Get pool balance
 *     description: Returns the pool balance
 *     tags:
 *       - Chains
 *     responses:
 *       200:
 *         description: Successful response
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 poolBalance:
 *                   type: array
 *                   items:
 *                     type: object
 *                     properties:
 *                       index:
 *                         type: string
 *                       chainName:
 *                         type: string
 *                       balance:
 *                         type: array
 *                         items:
 *                           type: object
 *                           properties:
 *                             amount:
 *                               type: string
 *                             tokenSymbol:
 *                               type: string
 *                             decimal:
 *                               type: string
 *                       nativeGasAmount:
 *                         type: string
 *       500:
 *         description: Internal server error
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 error:
 *                   type: string
 */
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

/**
 * @openapi /chains/pool:
 *   get:
 *     summary: Get pool addresses
 *     description: Returns the pool addresses for the available chains
 *     tags:
 *       - Chains
 *     responses:
 *       200:
 *         description: Successful response
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 type: object
 *                 properties:
 *                   chainName:
 *                     type: string
 *                   poolAddress:
 *                     type: string
 *       500:
 *         description: Internal server error
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 error:
 *                   type: string
 */
chainsRouter.get('/pool', async (_, res: Response) => {
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
 *     summary: Get TSS public keys
 *     description: Returns the TSS public keys
 *     tags:
 *       - Chains
 *     responses:
 *       200:
 *         description: Successful response
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 tssPubkey:
 *                   type: array
 *                   items:
 *                     type: object
 *                     properties:
 *                       index:
 *                         type: string
 *                       tssPubkey:
 *                         type: string
 *                       tssPubkeyEddsa:
 *                         type: string
 *                       ecdsa:
 *                         type: string
 *                       ecdsaPubkey:
 *                         type: string
 *                       eddsa:
 *                         type: string
 *                       reserved:
 *                         type: string
 *       500:
 *         description: Internal server error
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 error:
 *                   type: string
 */
chainsRouter.get('/tss_pubkey', async (_, res: Response) => {
  try {
    const result = await chainsService.getTssPubkeys()
    res.status(200).json(result)
  } catch (e) {
    console.error(e)
    res.status(500).send('failed to get tss pubkeys')
  }
})

/**
 * @openapi /chains:
 *   get:
 *     summary: Get all supported chains (static)
 *     description: Returns a list of supported chains. Static but has more information than the dynamic endpoint.
 *     tags:
 *       - Chains
 *     parameters:
 *       - name: env
 *         in: query
 *         required: false
 *         description: Chain environment
 *         schema:
 *           type: string
 *           enum:
 *             - mainnet
 *             - testnet
 *     responses:
 *       200:
 *         description: Successful response
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 type: object
 *                 properties:
 *                   id:
 *                     type: string
 *                   name:
 *                     type: string
 *                   shortName:
 *                     type: string
 *                   compatibility:
 *                     type: string
 *                     enum:
 *                       - EVM
 *                       - FIAT
 *                       - BTC
 *                       - COSMOS
 *                       - NONE
 *                       - SOL
 *                   supportedTokens:
 *                     type: array
 *                     items:
 *                       type: object
 *                       properties:
 *                         id:
 *                           type: string
 *                         symbol:
 *                           type: string
 *                         address:
 *                           type: string
 *                   disabled:
 *                     type: boolean
 *                   faucets:
 *                     type: array
 *                     items:
 *                       type: string
 *                   rpcUrls:
 *                     type: object
 *                     properties:
 *                       default:
 *                         type: object
 *                         properties:
 *                           http:
 *                             type: array
 *                             items:
 *                               type: string
 *                   blockExplorers:
 *                     type: object
 *                     properties:
 *                       default:
 *                         type: object
 *                         properties:
 *                           name:
 *                             type: string
 *                           url:
 *                             type: string
 *                   testnet:
 *                    type: boolean
 *       500:
 *         description: Internal server error
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 error:
 *                   type: string
 *
 */
chainsRouter.get(
  '/',
  [
    query('env')
      .isIn(Object.values(ChainEnv))
      .withMessage('env must be a valid chain environment')
      .optional()
  ],
  async (req: Request, res: Response) => {
    const { env = process.env.KIMA_ENVIRONMENT } = req.query
    const chains = chainsService.getChains(env as ChainEnv)
    res.status(200).json(chains)

    // if (env === ChainEnv.TESTNET) {
    //   res.json(CHAINS.filter((chain) => chain.testnet))
    //   return
    // }

    // res.json(CHAINS.filter((chain) => !chain.testnet))
  }
)

export default chainsRouter
