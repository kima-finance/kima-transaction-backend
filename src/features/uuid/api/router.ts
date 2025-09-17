import { Router, type Response } from 'express'
import { v4 as uuidv4 } from 'uuid'

const router = Router()

/**
 * @openapi
 * tags:
 *   - name: UUID
 *     description: Utility endpoints for client flows
 */

/**
 * @openapi
 * /uuid:
 *   get:
 *     summary: Generate UUID
 *     description: Returns a new UUID (v4), useful for kicking off KYC sessions.
 *     tags: [UUID]
 *     responses:
 *       200:
 *         description: UUID string
 *         content:
 *           text/plain:
 *             schema:
 *               type: string
 *               format: uuid
 */
router.get('/', (_req, res: Response) => {
  res.send(uuidv4())
})

export default router
