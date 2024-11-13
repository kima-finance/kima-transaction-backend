import { Request, Response, Router } from 'express'
import jwt from 'jsonwebtoken'
import { authenticateJWT } from '../middleware/auth'
import { ChainName } from '../types/chain-name'
import { validateRequest } from '../middleware/validation'
import { body } from 'express-validator'

const authRouter = Router()

/**
 * @openapi
 * /auth:
 *   post:
 *     summary: Authenticate
 *     description: Authenticate the tranaction details
 *     tags:
 *       - Auth
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               amount:
 *                 type: number
 *                 description: Amount to send
 *               fee:
 *                 type: number
 *                 description: Fee to pay
 *               originAddress:
 *                 type: string
 *                 description: Origin address
 *               originChain:
 *                 type: string
 *                 description: Origin chain
 *                 enum:
 *                   - ARBITRUM
 *                   - AVALANCHE
 *                   - BSC
 *                   - BTC
 *                   - ETHEREUM
 *                   - FIAT
 *                   - OPTIMISM
 *                   - POLYGON
 *                   - POLYGON_ZKEVM
 *                   - SOLANA
 *                   - TRON
 *               targetAddress:
 *                 type: string
 *                 description: Target address
 *               targetChain:
 *                 type: string
 *                 description: Target chain
 *                 enum:
 *                   - ARBITRUM
 *                   - AVALANCHE
 *                   - BSC
 *                   - BTC
 *                   - ETHEREUM
 *                   - FIAT
 *                   - OPTIMISM
 *                   - POLYGON
 *                   - POLYGON_ZKEVM
 *                   - SOLANA
 *                   - TRON
 *               targetSymbol:
 *                 type: string
 *                 description: Target symbol
 *     responses:
 *       200:
 *         description: Successful response
 *         content:
 *           text/plain:
 *             schema:
 *               type: string
 */
authRouter.post(
  '/',
  [
    body('amount')
      .isFloat({ gt: 0 })
      .withMessage('amount must be greater than 0'),
    body('fee').isFloat({ gt: 0 }).withMessage('fee must be greater than 0'),
    body('originAddress').notEmpty(),
    body('originChain')
      .isIn(Object.values(ChainName))
      .withMessage('originChain must be a valid chain name'),
    body('targetAddress').notEmpty(),
    body('targetChain')
      .isIn(Object.values(ChainName))
      .withMessage('targetChain must be a valid chain name'),
    body('targetSymbol').notEmpty(),
    validateRequest
  ],
  async (req: Request, res: Response) => {
    const token = jwt.sign(
      req.body,
      process.env.KIMA_BACKEND_SECRET as string,
      {
        expiresIn: '10s'
      }
    )

    res.cookie('authToken', token, {
      maxAge: 10000,
      httpOnly: true,
      sameSite: 'none',
      secure: true
    })
    res.send('ok')
  }
)

/**
 * @openapi
 * /auth/verify:
 *   get:
 *     summary: Verify authentication
 *     description: Verify the authentication
 *     tags:
 *       - Auth
 *     responses:
 *       200:
 *         description: Successful response
 *         content:
 *           text/plain:
 *             schema:
 *               type: string
 */
authRouter.get('/verify', authenticateJWT, (_, res: Response) => {
  res.send('ok')
})

export default authRouter
