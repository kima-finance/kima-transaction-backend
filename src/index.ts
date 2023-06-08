import express, { Express, Request, Response } from 'express'
import cors from 'cors'
import dotenv from 'dotenv'
import jwt from 'jsonwebtoken'
import bodyParser from 'body-parser'
import CookieParser from 'cookie-parser'
import { validate } from './validate'
import { RiskResult, RiskScore, getRisk, RiskScore2String } from './xplorisk'
import {
  SupportedNetworks,
  submitKimaTransaction
} from '@kimafinance/kima-transaction-api'
import { CurrencyOptions } from '@kimafinance/kima-transaction-api'

dotenv.config()

const app: Express = express()
const port = process.env.PORT || 3001

app.use(
  cors({
    origin: (origin, callback) => {
      if (process.env.NODE_ENV === 'test') {
        callback(null, true)
        return
      }

      const hostname = new URL(origin as string).hostname
      const domains = (process.env.DOMAIN as string).split(',')
      for (let i = 0; i < domains.length; i++) {
        if (domains[i].length && hostname.endsWith(domains[i])) {
          callback(null, true)
          return
        }
      }

      callback(new Error())
    },
    credentials: true
  })
)

app.use(CookieParser())
app.use(express.json())
app.use(
  bodyParser.urlencoded({
    extended: false
  })
)

app.post('/auth', async (req: Request, res: Response) => {
  const token = jwt.sign(req.body, process.env.KIMA_BACKEND_SECRET as string, {
    expiresIn: '10s'
  })
  res.cookie('authToken', token, {
    maxAge: 10000,
    httpOnly: true,
    sameSite: 'none',
    secure: true
  })
  res.send('ok')
})

const authenticateJWT = (req: Request, res: Response, next: any) => {
  if (process.env.NODE_ENV === 'test') {
    next()
    return
  }

  const token = req.cookies.authToken
  const {
    originAddress,
    originChain,
    targetAddress,
    targetChain,
    symbol,
    amount,
    fee
  } = req.body

  if (token) {
    jwt.verify(
      token,
      process.env.KIMA_BACKEND_SECRET as string,
      (err: any, params: any) => {
        if (
          err ||
          params.originAddress !== originAddress ||
          params.originChain !== originChain ||
          params.targetAddress !== targetAddress ||
          params.targetChain !== targetChain ||
          params.symbol !== symbol ||
          params.amount !== amount ||
          params.fee !== fee
        )
          return res.sendStatus(401)

        next()
      }
    )
  } else {
    res.sendStatus(401)
  }
}

app.post('/compliant', async (req: Request, res: Response) => {
  const { address } = req.body

  if (address) {
    try {
      const results: Array<RiskResult> = await getRisk([address])

      if (results.length > 0) {
        res.send(RiskScore2String[results[0].risk_score])
        return
      }
    } catch (e) {
      console.log(e)
    }
  }
  res.status(500).send('failed to check xplorisk')
})

app.post(
  '/submit-btc',
  authenticateJWT,
  async (req: Request, res: Response) => {
    console.log(req.body)

    try {
      const result = await submitKimaTransaction({
        originAddress: '0x1150bd27bA25fa13806C98324F201dfe815A4502',
        originChain: SupportedNetworks.ETHEREUM,
        targetAddress: '0x97810930b49D820205Be8eFe370201D32d9255B5',
        targetChain: SupportedNetworks.POLYGON,
        symbol: CurrencyOptions.USDT,
        amount: 5,
        fee: 0
      })
      console.log(result)
      res.send(result)
    } catch (e) {
      console.log(e)
      res.status(500).send('failed to submit transaction')
    }
  }
)

app.post('/submit', authenticateJWT, async (req: Request, res: Response) => {
  const {
    originAddress,
    originChain,
    targetAddress,
    targetChain,
    symbol,
    amount,
    fee
  } = req.body

  console.log(req.body)

  if (!(await validate(req))) {
    return res.status(500).send('validation error')
  }

  if (process.env.XPLORISK_URL) {
    try {
      const results: Array<RiskResult> = await getRisk([
        originAddress,
        targetAddress
      ])

      const totalRisky: number = results.reduce(
        (a, c) => a + (c.risk_score !== RiskScore.LOW ? 1 : 0),
        0
      )
      if (totalRisky > 0) {
        let riskyResult = ''
        for (let i = 0; i < results.length; i++) {
          if (results[i].risk_score === RiskScore.LOW) continue
          if (riskyResult.length > 0) riskyResult += ', '
          riskyResult += `${results[i].address} has ${
            RiskScore2String[results[i].risk_score]
          } risk`
        }
        res.status(500).send(riskyResult)
        return
      }
    } catch (e) {
      console.log(e)
    }
  }

  try {
    const result = await submitKimaTransaction({
      originAddress,
      originChain,
      targetAddress,
      targetChain,
      symbol,
      amount,
      fee
    })
    console.log(result)
    res.send(result)
  } catch (e) {
    console.log(e)
    res.status(500).send('failed to submit transaction')
  }
})

const server = app.listen(port, () => {
  console.log(`⚡️[server]: Server is running at http://localhost:${port}`)
})

module.exports = server
