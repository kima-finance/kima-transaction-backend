import 'dotenv/config'
import express, { Express } from 'express'
import CookieParser from 'cookie-parser'

import { rejectSameOrigin } from './middleware/same-origin'
import { corsConfig } from './middleware/cors'
import router from './routes'

const app: Express = express()

// middleware
app.use(rejectSameOrigin)
app.use(corsConfig)
app.use(CookieParser())
app.use(express.json())
app.use(express.urlencoded({ extended: false }))

// API routes
app.use('/', router)

export default app
