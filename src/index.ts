import express, { Express, Request, Response } from 'express'
import cors from 'cors'
import dotenv from 'dotenv'
import jwt from 'jsonwebtoken'
import bodyParser from 'body-parser'
import CookieParser from 'cookie-parser'
import { v4 as uuidv4 } from 'uuid'
import { validate } from './validate'
import { RiskResult, RiskScore, getRisk, RiskScore2String } from './xplorisk'
import { submitKimaTransaction } from '@kimafinance/kima-transaction-api'
import { fetchWrapper } from './fetch-wrapper'
import { Network, validate as validateBTC } from 'bitcoin-address-validation'

dotenv.config()

const app: Express = express()
const port = process.env.PORT || 3001

app.use((req, res, next) => {
  const originDomain = (req.headers['x-forwarded-host'] ||
    req.headers['host']) as string

  const domains = (process.env.DOMAIN as string).split(',')

  for (let i = 0; i < domains.length; i++) {
    if (domains[i].length && originDomain.endsWith(domains[i])) {
      return next()
    }
  }

  return res
    .status(401)
    .send({ message: `Same Origin Issue for: ${originDomain}` })
})

app.use(
  cors({
    origin: (origin, callback) => {
      if (
        process.env.NODE_ENV === 'test' ||
        (process.env.NODE_ENV === 'development' && !origin)
      ) {
        callback(null, true)
        return
      }

      if (!origin) {
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

app.get('/uuid', async (req: Request, res: Response) => {
  res.send(uuidv4())
})

app.get('/btc/balance', async (req: Request, res: Response) => {
  const address = req.query.address as string

  if (!address || !validateBTC(address, Network.testnet)) {
    res.status(500).send('validation error')
    return
  }

  try {
    const btcInfo: any = await fetchWrapper.get(
      `https://blockstream.info/testnet/api/address/${address}`
    )

    const balance =
      btcInfo.chain_stats.funded_txo_sum - btcInfo.chain_stats.spent_txo_sum

    res.send({ balance })
    return
  } catch (e) {
    console.log(e)
  }

  res.status(500).send('failed to get bitcoin balance')
})

app.get('/btc/transaction', async (req: Request, res: Response) => {
  const hash = req.query.hash as string

  if (!hash) {
    res.status(500).send('validation error')
    return
  }

  try {
    const btcInfo: any = await fetchWrapper.get(
      `https://blockstream.info/testnet/api/tx/${hash}`
    )

    res.send(btcInfo)
    return
  } catch (e) {
    console.log(e)
  }

  res.status(500).send('failed to get bitcoin tx info')
})

app.post('/kyc', async (req: Request, res: Response) => {
  const { uuid } = req.body

  if (uuid) {
    try {
      const kycResult = await fetchWrapper.get(
        `http://sandbox.depasify.com/api/v1/identifications?filter[external_uuid]=${uuid}`,
        process.env.DEPASIFY_API_KEY as string
      )

      res.send(kycResult)
      return
    } catch (e) {
      console.log(e)
    }
  }

  res.status(500).send('failed to get kyc status')
})

function hexStringToUint8Array(hexString: string) {
  if (hexString.length % 2 !== 0) {
    throw new Error('Invalid hex string')
  }
  const arrayBuffer = new Uint8Array(hexString.length / 2)
  for (let i = 0; i < hexString.length; i += 2) {
    arrayBuffer[i / 2] = parseInt(hexString.substr(i, 2), 16)
  }
  return arrayBuffer
}

app.post('/submit', authenticateJWT, async (req: Request, res: Response) => {
  const {
    originAddress,
    originChain,
    targetAddress,
    targetChain,
    symbol,
    amount,
    fee,
    htlcCreationHash,
    htlcCreationVout,
    htlcExpirationTimestamp,
    htlcVersion,
    senderPubKey
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
      fee,
      htlcCreationHash,
      htlcCreationVout,
      htlcExpirationTimestamp,
      htlcVersion,
      senderPubKey: hexStringToUint8Array(senderPubKey)
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
