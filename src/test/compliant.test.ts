import { FieldValidationError } from 'express-validator'
import { RiskScore } from '../xplorisk'
import { testServer } from './config'
import { mockGetRisk, setRisk } from './mocks/xplorisk.mock'

jest.mock('../xplorisk')

describe('POST /compliant', () => {
  beforeEach(() => {
    jest.resetAllMocks()
  })

  it('should respond with status 400 if no address is provided', async () => {
    setRisk({ risk_score: RiskScore.LOW })
    const res = await testServer.post('/compliant').send({}).expect(400)

    const errors = res.body.errors as FieldValidationError[]
    expect(errors.length).toEqual(1)
    expect(errors[0].path).toEqual('address')
  })

  it('should return critical risk from compliant endpoint', async () => {
    setRisk({ risk_score: RiskScore.CRITICAL })
    const address = '0xDD4c48C0B24039969fC16D1cdF626eaB821d3384'

    const res = await testServer.post('/compliant').send({ address })

    expect(res.status).toEqual(200)
    expect(res.text).toEqual('critical')
    expect(res.type).toEqual(expect.stringContaining('text/html'))
    expect(mockGetRisk).toHaveBeenCalledWith([address])
  })

  it('should return low risk from compliant endpoint', async () => {
    setRisk({ risk_score: RiskScore.LOW })
    const address = '0x76d031825134aaf073436Aba2087a3B589babd9F'

    const res = await testServer.post('/compliant').send({ address })

    expect(res.status).toEqual(200)
    expect(res.text).toEqual('low')
    expect(res.type).toEqual(expect.stringContaining('text/html'))
    expect(mockGetRisk).toHaveBeenCalledWith([address])
  })

  it('should respond with status 500 if xplorisk returns error', async () => {
    mockGetRisk.mockRejectedValue(new Error('Xplorisk test error'))
    const address = '0x76d031825134aaf073436Aba2087a3B589babd9F'

    const res = await testServer.post('/compliant').send({ address })

    expect(res.status).toEqual(500)
    expect(res.text).toEqual('failed to check xplorisk')
  })
})
