import { Router } from 'express'
import { serve, setup } from 'swagger-ui-express'
import swaggerJSDoc from 'swagger-jsdoc'

const docsRouter = Router()

if (process.env.NODE_ENV === 'development') {
  // serve OpenAPI docs
  docsRouter.use('/', serve)

  docsRouter.get(
    '/',
    setup(
      swaggerJSDoc({
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
    )
  )
} else {
  docsRouter.get('/', (_, res) => {
    res.send('Not available in production')
  })
}

export default docsRouter
