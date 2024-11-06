import { Request, Response, Router } from 'express'
import jwt from 'jsonwebtoken'
import { authenticateJWT } from '../middleware/auth'

const authRouter = Router()

authRouter.post('/', async (req: Request, res: Response) => {
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

authRouter.get('/verify', authenticateJWT, (_, res: Response) => {
  res.send('ok')
})

export default authRouter
