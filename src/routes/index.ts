import { Response, Router } from 'express'
import { serve, setup } from 'swagger-ui-express'
import swaggerJSDoc from 'swagger-jsdoc'
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

const swaggerSpec = swaggerJSDoc({
  definition: {
    openapi: '3.0.0',
    info: {
      title: 'Kima Transaction Backend',
      version: '1.3.0',
      description:
        'A web server that works as middleware between the Kima Transaction Widget and the Kima Chain.'
    }
  },
  apis: ['./src/routes/*.ts']
})

router.get('/', (_, res: Response) => {
  res.send('ok')
})

router.use('/auth', authRouter)
router.use('/btc', btcRouter)

// server OpenAPI docs
router.use('/docs', serve)
router.get('/docs', setup(swaggerSpec))

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
