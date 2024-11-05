import { Request, Response, Router } from 'express'
import { authenticateJWT } from '../middleware/auth'
import { getRisk, RiskResult, RiskScore, RiskScore2String } from '../xplorisk'
import { submitHtlcLock } from '@kimafinance/kima-transaction-api'

const htlcRouter = Router()

htlcRouter.post('/', authenticateJWT, async (req: Request, res: Response) => {
  const {
    fromAddress,
    senderPubkey,
    amount,
    htlcTimeout,
    htlcAddress,
    txHash
  } = req.body

  console.log(req.body)

  if (process.env.XPLORISK_URL) {
    try {
      const results: Array<RiskResult> = await getRisk([fromAddress])

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
    const result = await submitHtlcLock({
      fromAddress,
      amount,
      htlcTimeout,
      htlcAddress,
      txHash,
      senderPubkey
    })
    console.log(result)
    res.send(result)
  } catch (e) {
    console.log(e)
    res.status(500).send('failed to submit transaction')
  }
})

export default htlcRouter
