import './env-validate'
import express, { Express } from 'express'
import helmet from 'helmet'
import morgan from 'morgan'
import './bigint-shim'

import { corsConfig } from './middleware/cors'
import { unhandledError } from './middleware/error'
import router from './routes'
import { isDev } from './constants'

const app: Express = express()

// middleware
app.use(corsConfig)
app.use(helmet())
app.use(express.json())
app.use(express.urlencoded({ extended: false }))
app.use(morgan(isDev ? 'dev' : 'combined'))

// API routes
app.use('/', router)

app.use(unhandledError)

export default app
