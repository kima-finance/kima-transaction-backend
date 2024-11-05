import { Request, Response, Router } from 'express'
import { authenticateJWT } from '../middleware/auth'
import { submitKimaTransaction } from '@kimafinance/kima-transaction-api'
import { validate } from '../validate'
import { getRisk, RiskResult, RiskScore, RiskScore2String } from '../xplorisk'

const submitRouter = Router()

submitRouter.post('/', authenticateJWT, async (req: Request, res: Response) => {
  const {
    originAddress,
    originChain,
    originSymbol,
    targetAddress,
    targetChain,
    targetSymbol,
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
      originSymbol,
      targetSymbol,
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

export default submitRouter
