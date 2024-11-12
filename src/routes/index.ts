import { Response, Router } from 'express'
import { v4 as uuidv4 } from 'uuid'

import authRouter from './auth'
import btcRouter from './btc'
import compliantRouter from './compliant'
import htlcRouter from './htlc'
import kycRouter from './kyc'
import reclaimRouter from './reclaim'
import submitRouter from './submit'
import txRouter from './tx'
import chainsRouter from './chains'

const router = Router()

router.get('/', (_, res: Response) => {
  res.send('ok')
})

router.use('/auth', authRouter)
router.use('/btc', btcRouter)
router.use('/chains', chainsRouter)
router.use('/compliant', compliantRouter)
router.use('/htlc', htlcRouter)
router.use('/kyc', kycRouter)
router.use('/reclaim', reclaimRouter)
router.use('/submit', submitRouter)
router.use('/tx', txRouter)

router.get('/uuid', async (_, res: Response) => {
  res.send(uuidv4())
})

export default router
