import { Router, type Request, type Response } from 'express'
import { query } from 'express-validator'
import { validateRequest } from '@shared/middleware/validation'
import ENV from 'core/env'
import fetchWrapper from '@shared/http/fetch'
import { KYCResponseDto } from '../types/kyc-response.dto'

const router = Router()

/**
 * @openapi
 * tags:
 *   - name: KYC
 *     description: KYC verification endpoints
 */

/**
 * @openapi
 * /kyc:
 *   get:
 *     summary: Get KYC status
 *     description: Returns the KYC status for the given UUID. Returns 403 when KYC is not enabled on the backend.
 *     tags: [KYC]
 *     parameters:
 *       - in: query
 *         name: uuid
 *         required: true
 *         description: External UUID for the KYC verification session
 *         schema:
 *           type: string
 *           format: uuid
 *     responses:
 *       200:
 *         description: KYC status
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 id: { type: string }
 *                 status: { type: string }
 *                 name: { type: string }
 *                 surname: { type: string }
 *                 external_uuid: { type: string, format: uuid }
 *                 account_id: { type: string }
 *                 created_at: { type: number }
 *       403:
 *         description: KYC is not enabled on the backend
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message: { type: string }
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
    query('uuid').isUUID().withMessage('uuid must be a valid UUID'),
    validateRequest
  ],
  async (req: Request, res: Response) => {
    if (!ENV.DEPASIFY_API_KEY) {
      return res.status(403).json({ message: 'KYC is not enabled' })
    }
    const { uuid } = req.query

    try {
      const kycResult = await fetchWrapper.get<KYCResponseDto>(
        `http://sandbox.depasify.com/api/v1/identifications?filter[external_uuid]=${uuid}`,
        ENV.DEPASIFY_API_KEY as string
      )
      res.send(kycResult)
    } catch (e) {
      console.error(e)
      res.status(500).send('failed to get kyc status')
    }
  }
)

export default router
