import { Request, Response, Router } from 'express'
import { fetchWrapper } from '../fetch-wrapper'

const kycRouter = Router()

kycRouter.get('/', async (req: Request, res: Response) => {
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

export default kycRouter