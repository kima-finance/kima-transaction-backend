import { Response, Router } from 'express'

import btcRouter from './btc'
import compliantRouter from './compliant'
import htlcRouter from './htlc'
import kycRouter from './kyc'
import reclaimRouter from './reclaim'
import submitRouter from './submit'
import txRouter from './tx'
import chainsRouter from './chains'
import docsRouter from './docs'
import uuidRouter from './uuid'

const router = Router()

/**
 * @openapi /:
 *   get:
 *     summary: Health check
 *     description: Returns ok
 *     tags:
 *       - Health
 *     responses:
 *       200:
 *         description: Successful response
 *         content:
 *           text/plain:
 *             schema:
 *               type: string
 */
router.get('/', (_, res: Response) => {
  res.send('ok')
})

router.use('/btc', btcRouter)
router.use('/docs', docsRouter)
router.use('/chains', chainsRouter)
router.use('/compliant', compliantRouter)
router.use('/htlc', htlcRouter)
router.use('/kyc', kycRouter)
router.use('/reclaim', reclaimRouter)
router.use('/submit', submitRouter)
router.use('/tx', txRouter)
router.use('/uuid', uuidRouter)

export default router
