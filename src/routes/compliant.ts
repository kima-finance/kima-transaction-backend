import { Request, Response, Router } from 'express'
import { query } from 'express-validator'
import { validateRequest } from '../middleware/validation'
import { complianceService } from '../check-compliance'

const compliantRouter = Router()

compliantRouter.get(
  '/',
  [
    query('address')
      .notEmpty()
      .withMessage('address query parameter must be provided'),
    validateRequest
  ],
  async (req: Request, res: Response) => {
    if (!complianceService.enabled) {
      return res.status(501).send('not supported')
    }

    try {
      const address = Array.isArray(req.query.address)
        ? (req.query.address as string[])
        : [req.query.address as string]
      const result = await complianceService.check(address)

      if (result.isError) {
        res.status(500).json(result)
        return
      }

      res.status(200).json(result)
    } catch (e) {
      console.log(e)
      res.status(500).send('failed to check compliance')
    }
  }
)

export default compliantRouter
