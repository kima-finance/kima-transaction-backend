import { Response, Router } from 'express'
import { v4 as uuidv4 } from 'uuid'

const uuidRouter = Router()

/**
 * @openapi /uuid:
 *   get:
 *     summary: Get UUID
 *     description: Returns a UUID for KYC
 *     tags:
 *       - UUID
 *     responses:
 *       200:
 *         description: Successful response
 *         content:
 *           text/plain:
 *             schema:
 *               type: string
 */
uuidRouter.get('/uuid', async (_, res: Response) => {
  res.send(uuidv4())
})

export default uuidRouter
