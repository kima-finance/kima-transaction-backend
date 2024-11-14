import 'dotenv/config'
import express, { Express } from 'express'
import CookieParser from 'cookie-parser'
import './bigint-shim'

import { sameOriginOnly } from './middleware/same-origin'
import { corsConfig } from './middleware/cors'
import { unhandledError } from './middleware/error'
import router from './routes'

const app: Express = express()

// middleware
app.use(sameOriginOnly)
app.use(corsConfig)
app.use(CookieParser())
app.use(express.json())
app.use(express.urlencoded({ extended: false }))

// API routes
app.use('/', router)

app.use(unhandledError)

export default app
