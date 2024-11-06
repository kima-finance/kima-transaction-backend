import { testServer } from './config'
import jwt from 'jsonwebtoken'
import { useTestAuth, getTokenFromReqCookie } from './utils/auth-utils'

describe('POST /auth', () => {
  it('should return ok from auth endpoint', async () => {
    const res = await testServer
      .post('/auth')
      .send({
        originAddress: '0x76d031825134aaf073436Aba2087a3B589babd9F'
      })
      .expect('set-cookie', /authToken/)

    expect(res.status).toEqual(200)
    expect(res.text).toEqual('ok')
  })

  it('should include the body in the cookie', async () => {
    const payload = {
      someAddress: '0x76d031825134aaf073436Aba2087a3B589babd9F',
      someChain: 'SOL'
    }
    const res = await testServer
      .post('/auth')
      .send(payload)
      .expect('set-cookie', /authToken/)

    const token = getTokenFromReqCookie(res)
    const decoded = jwt.verify(
      token,
      process.env.KIMA_BACKEND_SECRET as string,
      {
        ignoreExpiration: true
      }
    )

    expect(decoded).toMatchObject({
      exp: expect.any(Number),
      iat: expect.any(Number),
      ...payload
    })
  })

  it('should pass authentication middleware', async () => {
    const { testAgent, cookie, payload } = await useTestAuth()

    const verifyRes = await testAgent
      .get('/auth/verify')
      .send(payload)
      .set('Cookie', cookie)

    expect(verifyRes.status).toEqual(200)
    expect(verifyRes.text).toEqual('ok')
  })
})
