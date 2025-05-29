import './env-validate'
import express, { Express } from 'express'
import * as Sentry from '@sentry/node'
import CookieParser from 'cookie-parser'
import helmet from 'helmet'
import morgan from 'morgan'
import './bigint-shim'
import './instrument'

import { corsConfig } from './middleware/cors'
import { unhandledError } from './middleware/error'
import router from './routes'
import { isDev, isProd } from './constants'
import { ENV } from './env-validate'

const app: Express = express()

// middleware
app.use(corsConfig)
app.use(helmet())
app.use(CookieParser())
app.use(express.json())
app.use(express.urlencoded({ extended: false }))
app.use(morgan(isDev ? 'dev' : 'combined'))

// API routes
app.use('/', router)

if (isProd && ENV.SENTRY_DSN) {
  // The error handler must be registered before any other error middleware and after all controllers
  Sentry.setupExpressErrorHandler(app)
  console.info('Sentry enabled')
} else {
  console.info('Sentry disabled')
}

app.use(unhandledError)

export default app
