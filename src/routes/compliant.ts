import { Request, Response, Router } from 'express'
import { getRisk, RiskResult, RiskScore2String } from '../xplorisk'
import { body } from 'express-validator'
import { validateRequest } from '../middleware/validation'

const compliantRouter = Router()

compliantRouter.post(
  '/',
  [body('address').notEmpty(), validateRequest],
  async (req: Request, res: Response) => {
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
  }
)

export default compliantRouter
