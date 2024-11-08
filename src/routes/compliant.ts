import { Request, Response, Router } from 'express'
import { body } from 'express-validator'
import { validateRequest } from '../middleware/validation'
import { complianceService } from '../check-compliance'

const compliantRouter = Router()

compliantRouter.post(
  '/',
  [body('address').notEmpty(), validateRequest],
  async (req: Request, res: Response) => {
    if (!complianceService.enabled) {
      return res.status(501).send('not supported')
    }

    try {
      const { address } = req.body
      const result = await complianceService.score(address)
      res.send(result)
    } catch (e) {
      console.log(e)
      res.status(500).send('failed to check compliance')
    }
  }
)

export default compliantRouter
