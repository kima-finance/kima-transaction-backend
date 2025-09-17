import { Router } from 'express'

import { chainsRouter } from '@features/chains'
import { submitRouter } from '@features/submit'
import { transferTxRouter, swapTxRouter } from '@features/tx'
import { btcRouter } from '@features/btc'
import { complianceRouter } from '@features/compliance'
import { htlcRouter } from '@features/htlc'
import { kycRouter } from '@features/kyc'
import { uuidRouter } from '@features/uuid'

// docs router
import docsRouter from './docs'

const router = Router()

// health
router.get('/health', (_req, res) => res.status(200).send('ok'))

// docs
router.use('/docs', docsRouter)

router.use('/chains', chainsRouter)
router.use('/tx', transferTxRouter)
router.use('/swap_tx', swapTxRouter)
router.use('/submit', submitRouter)
router.use('/btc', btcRouter)
router.use('/compliant', complianceRouter)
router.use('/htlc', htlcRouter)
router.use('/kyc', kycRouter)
router.use('/uuid', uuidRouter)

export default router
