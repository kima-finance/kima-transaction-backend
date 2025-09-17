import { Router } from 'express'
import { serve, setup } from 'swagger-ui-express'
import swaggerJSDoc from 'swagger-jsdoc'

const docsRouter = Router()

// single source of truth for swagger-jsdoc options
const swaggerOptions = {
  definition: {
    openapi: '3.0.0',
    info: {
      title: 'Kima Transaction Backend',
      version: '1.5.0',
      description:
        'Middleware between the Kima Transaction Widget and Kima Chain. Auto-generated from JSDoc blocks.'
    }
  },
  apis: ['src/routes/**/*.ts', 'src/features/**/*.ts']
}

if (process.env.NODE_ENV === 'development') {
  const spec = swaggerJSDoc(swaggerOptions)
  docsRouter.use('/', serve)
  docsRouter.get('/', setup(spec))
} else {
  docsRouter.get('/', (_req, res) => {
    res.send('Not available in production')
  })
}

export default docsRouter
