import type { Express } from 'express'

import chainsRouter from '@features/chains/api/router'
import submitRouter from '@features/submit/api/router'
import txTransferRouter from '@features/tx/api/transfer'
import txSwapRouter from '@features/tx/api/swap'
import kycRouter from '@features/kyc/api/router'
import compliantRouter from '@features/compliance/api/router'
import btcRouter from '@features/btc/api/router'
import htlcRouter from '@features/htlc/api/router'
import reclaimRouter from '@features/reclaim/api/router'
import uuidRouter from '@features/uuid/api/router'

const registerRoutes = (app: Express) => {
  app.use('/chains', chainsRouter)
  app.use('/submit', submitRouter)
  app.use('/tx', txTransferRouter)
  app.use('/swap_tx', txSwapRouter)
  app.use('/kyc', kycRouter)
  app.use('/compliant', compliantRouter)
  app.use('/btc', btcRouter)
  app.use('/htlc', htlcRouter)
  app.use('/reclaim', reclaimRouter)
  app.use('/', uuidRouter) // /uuid
}

export default registerRoutes
