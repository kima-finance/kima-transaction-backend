import { FieldValidationError } from 'express-validator'
import { RiskScore } from '../xplorisk'
import { testServer } from './config'
import { mockGetRisk, setRisk } from './mocks/xplorisk.mock'
import { ComplianceService } from '../check-compliance'

jest.mock('../xplorisk')
const originalEnv = process.env

describe('Compliance Service', () => {
  let service: ComplianceService
  const addresses = ['0x76d031825134aaf073436Aba2087a3B589babd9F']

  beforeEach(() => {
    jest.resetAllMocks()
    setRisk({ risk_score: RiskScore.LOW })
    service = new ComplianceService()
  })

  describe('when COMPLIANCE_URL is not set', () => {
    beforeAll(() => {
      jest.resetModules()
      process.env = {
        ...originalEnv,
        COMPLIANCE_URL: ''
      }
    })

    afterAll(() => {
      process.env = originalEnv
    })

    describe('Compliance enabled', () => {
      it('should return false', () => {
        expect(service.enabled).toBe(false)
      })
    })

    describe('Check Compliance', () => {
      it('should return the empty string', async () => {
        const result = await service.check(addresses)
        expect(result).toEqual('')
        expect(mockGetRisk).not.toHaveBeenCalled()
      })
    })

    describe('Score', () => {
      it('should return the empty string', async () => {
        const result = await service.score(addresses[0])
        expect(result).toEqual('')
        expect(mockGetRisk).not.toHaveBeenCalled()
      })
    })
  })

  describe('when COMPLIANCE_URL is set', () => {
    describe('Compliance enabled', () => {
      it('should return true', () => {
        expect(service.enabled).toBe(true)
      })
    })

    describe.each([
      { risk: RiskScore.LOW, expected: '' },
      { risk: RiskScore.MED, expected: `${addresses[0]} has medium risk` },
      { risk: RiskScore.HIGH, expected: `${addresses[0]} has high risk` },
      {
        risk: RiskScore.CRITICAL,
        expected: `${addresses[0]} has critical risk`
      }
    ])('Check Compliance: Risk $risk', ({ risk, expected }) => {
      beforeEach(() => {
        setRisk({ risk_score: risk })
      })

      it('should return the expected string', async () => {
        const result = await service.check(addresses)
        expect(result).toEqual(expected)
        expect(mockGetRisk).toHaveBeenCalledWith(addresses)
      })
    })

    describe.each([
      { risk: RiskScore.LOW, expected: 'low' },
      { risk: RiskScore.MED, expected: 'medium' },
      { risk: RiskScore.HIGH, expected: 'high' },
      { risk: RiskScore.CRITICAL, expected: 'critical' }
    ])('Score: Risk $risk', ({ risk, expected }) => {
      beforeEach(() => {
        setRisk({ risk_score: risk })
      })

      it('should return the expected string', async () => {
        const result = await service.score(addresses[0])
        expect(result).toEqual(expected)
        expect(mockGetRisk).toHaveBeenCalledWith(addresses)
      })
    })

    describe('when no addresses are provided', () => {
      it('should return the empty string', async () => {
        const result = await service.check([])
        expect(result).toEqual('')
        expect(mockGetRisk).not.toHaveBeenCalled()
      })
    })
  })
})

describe('POST /compliant', () => {
  const addresses = ['0x76d031825134aaf073436Aba2087a3B589babd9F']

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
    expect(res.text).toEqual('failed to check compliance')
  })

  describe('when COMPLIANCE_URL is not set', () => {
    beforeAll(() => {
      jest.resetModules()
      process.env = {
        ...originalEnv,
        COMPLIANCE_URL: ''
      }
      setRisk({ risk_score: RiskScore.LOW })
    })

    afterAll(() => {
      process.env = originalEnv
    })

    it('should return 501 with a not supported error', async () => {
      const res = await testServer
        .post('/compliant')
        .send({ address: addresses[0] })
      expect(res.status).toEqual(501)
      expect(res.text).toEqual('not supported')
    })
  })
})
