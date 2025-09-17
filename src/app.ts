import './bigint-shim'
import express, { Express } from 'express'
import CookieParser from 'cookie-parser'
import helmet from 'helmet'
import requestId from '@shared/middleware/request-id'
import httpLogger from '@shared/middleware/logger'
import corsConfig from '@shared/middleware/cors'
import registerRoutes from '@config/register-routes'
import { unhandledError } from '@shared/middleware/error'

const app: Express = express()

app.use(requestId)
app.use(httpLogger)

app.use(corsConfig)
app.use(helmet())
app.use(CookieParser())
app.use(express.json())
app.use(express.urlencoded({ extended: false }))

app.get('/health', (_req, res) =>
  res.status(200).json({ ok: true, env: process.env.NODE_ENV })
)

// mount all routers centrally
registerRoutes(app) 

app.use(unhandledError)

export default app
