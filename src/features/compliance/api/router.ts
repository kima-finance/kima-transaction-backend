import { Router, type Request, type Response } from 'express'
import { query } from 'express-validator'
import { validateRequest } from '@shared/middleware/validation'
import complianceService from '../services/compliance.service'

const router = Router()

/**
 * @openapi
 * tags:
 *   - name: Compliant
 *     description: Address compliance checks
 */

/**
 * @openapi
 * /compliant/enabled:
 *   get:
 *     summary: Check if compliance is enabled
 *     description: Returns whether the backend is configured to perform compliance checks.
 *     tags: [Compliant]
 *     responses:
 *       200:
 *         description: Compliance enabled state
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 enabled:
 *                   type: boolean
 */
router.get('/enabled', (_: Request, res: Response) => {
  res.json({ enabled: complianceService.enabled })
})

/**
 * @openapi
 * /compliant:
 *   get:
 *     summary: Check address compliance
 *     description: Checks the compliance risk for one or more addresses. Requires compliance to be enabled.
 *     tags: [Compliant]
 *     parameters:
 *       - name: address
 *         in: query
 *         required: true
 *         description: Address to check. Provide multiple times for array (e.g., `?address=0x...&address=0x...`).
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Compliance check completed
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
 *                     oneOf:
 *                       - type: object
 *                         properties:
 *                           isCompliant:
 *                             type: boolean
 *                           result:
 *                             type: object
 *                             properties:
 *                               address:
 *                                 type: string
 *                               name:
 *                                 type: string
 *                               classification:
 *                                 type: array
 *                                 items: { type: string }
 *                               risk_factors:
 *                                 type: array
 *                                 items: { type: string }
 *                               risk_score:
 *                                 type: string
 *                                 enum: [low, med, high, critical]
 *                       - type: object
 *                         properties:
 *                           address:
 *                             type: string
 *                           error:
 *                             type: string
 *       501:
 *         description: Compliance is not enabled
 *         content:
 *           text/plain:
 *             schema:
 *               type: string
 *       400:
 *         description: Validation error
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 errors:
 *                   type: array
 *                   items: { type: object }
 *       500:
 *         description: Internal server error
 *         content:
 *           text/plain:
 *             schema: { type: string }
 */
router.get(
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
      console.error(e)
      res.status(500).send('failed to check compliance')
    }
  }
)

export default router
