import 'dotenv/config'
import express, { Express } from 'express'
import CookieParser from 'cookie-parser'
import helmet from 'helmet'
import morgan from 'morgan'
import './bigint-shim'

import { sameOriginOnly } from './middleware/same-origin'
import { corsConfig } from './middleware/cors'
import { unhandledError } from './middleware/error'
import router from './routes'

const app: Express = express()

// middleware
app.use(sameOriginOnly)
app.use(corsConfig)
app.use(helmet())
app.use(CookieParser())
app.use(express.json())
app.use(express.urlencoded({ extended: false }))
app.use(morgan(process.env.NODE_ENV === 'development' ? 'dev' : 'combined'))

// API routes
app.use('/', router)

app.use(unhandledError)

export default app
