import { Request, Response, Router } from 'express'
import { fetchWrapper } from '../fetch-wrapper'
import { validateRequest } from '../middleware/validation'
import { query } from 'express-validator'
import { KYCResponseDto } from '../types/kyc-response.dto'
import { ENV } from '../env-validate'

const kycRouter = Router()

/**
 * @openapi
 * /kyc:
 *   get:
 *     summary: Get KYC status
 *     description: Returns the KYC status for the given UUID
 *     tags:
 *       - KYC
 *     parameters:
 *       - name: uuid
 *         in: query
 *         required: true
 *         description: UUID
 *         schema:
 *           type: string
 *           format: uuidv4
 *     responses:
 *       200:
 *         description: Successful response
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 id:
 *                   type: string
 *                 status:
 *                   type: string
 *                 name:
 *                   type: string
 *                 surname:
 *                   type: string
 *                 external_uuid:
 *                   type: string
 *                   format: uuidv4
 *                 account_id:
 *                   type: string
 *                 created_at:
 *                   type: number
 *       500:
 *         description: Internal server error
 *         content:
 *           text/plain:
 *             schema:
 *               type: string
 */
kycRouter.get(
  '/',
  [
    query('uuid').isUUID().withMessage('uuid must be a valid UUID'),
    validateRequest
  ],
  async (req: Request, res: Response) => {
    if (!ENV.DEPASIFY_API_KEY) {
      return res.status(403).json({ message: 'KYC is not enabled' })
    }
    const { uuid } = req.body

    try {
      const kycResult = await fetchWrapper.get<KYCResponseDto>(
        `http://sandbox.depasify.com/api/v1/identifications?filter[external_uuid]=${uuid}`,
        ENV.DEPASIFY_API_KEY as string
      )

      res.send(kycResult)
    } catch (e) {
      console.error(e)
    }
    res.status(500).send('failed to get kyc status')
  }
)

export default kycRouter
