import express, { Express, Request, Response } from 'express'
import cors from 'cors'
import dotenv from 'dotenv'
import jwt from 'jsonwebtoken'
import bodyParser from 'body-parser'
import CookieParser from 'cookie-parser'
import { validate } from './validate'
import { RiskResult, RiskScore, getRisk, RiskScore2String } from './xplorisk'
import {
  SupportNetworks,
  submitKimaTransaction
} from '@kimafinance/kima-transaction-api'
import { CurrencyOptions } from '@kimafinance/kima-transaction-api'
import { fetchWrapper } from './fetch-wrapper'

dotenv.config()

const app: Express = express()
const port = process.env.PORT || 3001

app.use(
  cors({
    origin: (origin, callback) => {
      callback(null, true)
      return

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

app.post('/submit-btc', async (req: Request, res: Response) => {
  try {
    const result = await submitKimaTransaction({
      originAddress: '0x1150bd27bA25fa13806C98324F201dfe815A4502',
      originChain: SupportNetworks.Polygon,
      targetAddress: '0x97810930b49D820205Be8eFe370201D32d9255B5',
      targetChain: SupportNetworks.Ethereum,
      symbol: CurrencyOptions.USDK,
      amount: 5,
      fee: 0
    })
    res.send(result)
  } catch (e) {
    console.log(e)
    res.status(500).send('failed to submit transaction')
  }
})

type TxResponse = {
  originAddress: string
  originChain: string
  targetChain: string
  targetAddress: string
}

app.get('/transaction_data', async (req: Request, res: Response) => {
  try {
    const result: any = await fetchWrapper.get(
      'https://api_testnet.kima.finance/kima-finance/kima/kima/transaction_data'
    )

    if (!result?.transactionData) {
      res.status(500).send('internal server error')
      return
    }

    const data: TxResponse[] = result.transactionData
    const filteredData = data.filter(
      (tx) =>
        (tx.originAddress === '0x1150bd27bA25fa13806C98324F201dfe815A4502' &&
          tx.targetAddress === '0x97810930b49D820205Be8eFe370201D32d9255B5' &&
          tx.originChain === 'POL' &&
          tx.targetChain === 'ETH') ||
        (tx.targetAddress === '0x1150bd27bA25fa13806C98324F201dfe815A4502' &&
          tx.originAddress === '0x97810930b49D820205Be8eFe370201D32d9255B5' &&
          tx.targetChain === 'POL' &&
          tx.originChain === 'ETH')
    )
    res.send(
      filteredData.map((tx) => {
        if (tx.originChain === SupportNetworks.Polygon) {
          return {
            ...tx,
            originAddress: '2NFiup6DHUQdsqCAgEiRDEC6jY5gyYR5MBu',
            originChain: 'BTC',
            symbol: 'WBTC',
            tssPullHash:
              '42e38f7c0b5a7d7700b720d9191bbe6adc9e157e4527da0eba65fbdae8902508'
          }
        }

        return {
          ...tx,
          targetAddress: '2NFiup6DHUQdsqCAgEiRDEC6jY5gyYR5MBu',
          targetChain: 'BTC',
          symbol: 'WBTC',
          tssPullHash:
            '42e38f7c0b5a7d7700b720d9191bbe6adc9e157e4527da0eba65fbdae8902508'
        }
      })
    )
  } catch (e) {
    console.log(e)
    res.status(500).send('internal server error')
  }
})

app.get('/transaction_data/:id', async (req: Request, res: Response) => {
  const id = req.params.id

  try {
    const result: any = await fetchWrapper.get(
      `https://api_testnet.kima.finance/kima-finance/kima/kima/transaction_data/${id}`
    )

    const tx = result?.transactionData
    if (tx.originChain === SupportNetworks.Polygon) {
      res.send({
        ...tx,
        originAddress: '2NFiup6DHUQdsqCAgEiRDEC6jY5gyYR5MBu',
        originChain: 'BTC',
        symbol: 'WBTC',
        tssPullHash:
          '42e38f7c0b5a7d7700b720d9191bbe6adc9e157e4527da0eba65fbdae8902508'
      })
    } else {
      res.send({
        ...tx,
        targetAddress: '2NFiup6DHUQdsqCAgEiRDEC6jY5gyYR5MBu',
        targetChain: 'BTC',
        symbol: 'WBTC',
        tssPullHash:
          '42e38f7c0b5a7d7700b720d9191bbe6adc9e157e4527da0eba65fbdae8902508'
      })
    }
  } catch (e) {
    console.log(e)
    res.status(500).send('internal server error')
  }
})

app.post('/submit', async (req: Request, res: Response) => {
  try {
    const result = await submitKimaTransaction({
      originAddress: '0x97810930b49D820205Be8eFe370201D32d9255B5',
      originChain: SupportNetworks.Ethereum,
      targetAddress: '0x1150bd27bA25fa13806C98324F201dfe815A4502',
      targetChain: SupportNetworks.Polygon,
      symbol: CurrencyOptions.USDK,
      amount: 5,
      fee: 0
    })
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
