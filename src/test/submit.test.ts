import { FieldValidationError } from 'express-validator'
import { RiskScore } from '../xplorisk'
import { mockGetRisk, setRisk } from './mocks/xplorisk.mock'
import { useTestAuth } from './utils/auth-utils'

jest.mock('../xplorisk')

describe('POST /submit', () => {
  it('should return status 400 when properties are missing', async () => {
    const { testAgent, payload, cookie } = await useTestAuth({
      amount: 101,
      targetSymbol: ''
    })
    expect(payload.targetSymbol).toEqual('')
    setRisk({ risk_score: RiskScore.LOW })
    console.log('payload', payload)

    const res = await testAgent
      .post('/submit')
      .set('Cookie', cookie)
      .send(payload)
      .expect(400)

    const errors = res.body.errors as FieldValidationError[]
    expect(errors.length).toEqual(1)

    const error = errors[0]
    expect(error.path).toEqual('targetSymbol')
  })

  it('should return status 400 with an invalid Solana address', async () => {
    const { testAgent, payload, cookie } = await useTestAuth({
      originAddress: '8bct1AEUdkfVdEaQBrFVpCYXdw6kUDReo5ZF3cxqsEQU',
      originChain: 'SOL'
    })
    setRisk({ risk_score: RiskScore.LOW })

    const res = await testAgent
      .post('/submit')
      .set('Cookie', cookie)
      .send(payload)

    expect(res.status).toEqual(400)
    expect(res.text).toEqual('validation error')
  })

  it('should return status 403 for a risky address', async () => {
    const { testAgent, payload, cookie } = await useTestAuth({
      originAddress: '0xDD4c48C0B24039969fC16D1cdF626eaB821d3384',
      targetAddress: '0x001474b877f98f41701397a65d4d313ab180c7b2'
    })
    setRisk({ risk_score: RiskScore.MED })

    const res = await testAgent
      .post('/submit')
      .set('Cookie', cookie)
      .send(payload)

    expect(res.status).toEqual(403)
    expect(res.text).toContain('risk')
    expect(mockGetRisk).toHaveBeenCalledWith([
      payload.originAddress,
      payload.targetAddress
    ])
  })
})
