import { Request, Response, Router } from 'express'
import { query } from 'express-validator'
import { validateRequest } from '../middleware/validation'
import { complianceService } from '../check-compliance'

const compliantRouter = Router()

/**
 * @openapi /compliant/enabled:
 *   get:
 *     summary: Check if compliance is enabled
 *     description: Check if compliance is enabled
 *     tags:
 *       - Compliant
 *     responses:
 *       200:
 *         description: Successful response
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 enabled:
 *                   type: boolean
 */
compliantRouter.get('/enabled', async (_, res: Response) => {
  res.json({ enabled: complianceService.enabled })
})

/**
 * @openapi
 * /compliant:
 *   get:
 *     summary: Check compliance
 *     description: Check if the address is compliant
 *     tags:
 *       - Compliant
 *     parameters:
 *       - name: address
 *         in: query
 *         required: true
 *         description: Address to check. Can also be an array of addresses.
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Successful response
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 isCompliant:
 *                   type: boolean
 *                 isError:
 *                   type: boolean
 *                 results:
 *                   type: array
 *                   items:
 *                     type: object
 *                     properties:
 *                       isCompliant:
 *                         type: boolean
 *                       result:
 *                         type: object
 *                         properties:
 *                           address:
 *                             type: string
 *                           name:
 *                             type: string
 *                           classification:
 *                             type: array
 *                             items:
 *                               type: string
 *                           risk_factors:
 *                             type: array
 *                             items:
 *                               type: string
 *                           risk_score:
 *                             type: string
 *                             enum:
 *                               - LOW
 *                               - MED
 *                               - HIGH
 *                               - CRITICAL
 *       500:
 *         description: Internal server error
 *         content:
 *           text/plain:
 *             schema:
 *               type: string
 *       501:
 *         description: Returns 501 if compliance is not enabled
 *         content:
 *           text/plain:
 *             schema:
 *               type: string
 */
compliantRouter.get(
  '/',
  [
    query('address')
      .notEmpty()
      .withMessage('address query parameter must be provided'),
    validateRequest
  ],
  async (req: Request, res: Response) => {
    if (!complianceService.enabled) {
      return res.status(501).send('not supported')
    }

    try {
      const address = Array.isArray(req.query.address)
        ? (req.query.address as string[])
        : [req.query.address as string]
      const result = await complianceService.check(address)

      if (result.isError) {
        res.status(500).json(result)
        return
      }

      res.status(200).json(result)
    } catch (e) {
      console.log(e)
      res.status(500).send('failed to check compliance')
    }
  }
)

export default compliantRouter
