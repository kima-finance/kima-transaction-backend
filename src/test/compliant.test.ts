import { FieldValidationError } from 'express-validator'
import { RiskScore } from '../xplorisk'
import { testServer } from './config'
import { mockGetRisk, setRisk } from './mocks/xplorisk.mock'
import { ComplianceService } from '../check-compliance'
import { ComplianceCheckResult } from '../types/compliance'

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
    beforeEach(() => {
      jest.resetModules()
      process.env = {
        ...originalEnv,
        COMPLIANCE_URL: ''
      }
    })

    afterEach(() => {
      process.env = originalEnv
    })

    describe('Compliance enabled', () => {
      it('should return false', () => {
        expect(service.enabled).toBe(false)
      })
    })

    describe('Check Compliance', () => {
      it('should throw an error', async () => {
        await expect(service.check(addresses)).rejects.toThrow(
          'Compliance check is not enabled'
        )
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
      { risk: RiskScore.LOW, expected: true },
      { risk: RiskScore.MED, expected: false },
      { risk: RiskScore.HIGH, expected: false },
      { risk: RiskScore.CRITICAL, expected: false },
      { risk: 'shady' as RiskScore, expected: 'error' }
    ])('Check Compliance: Risk $risk', ({ risk, expected }) => {
      beforeEach(() => {
        setRisk({ risk_score: risk })
      })

      it('should return $expected', async () => {
        const result = await service.check(addresses)
        if (expected === 'error') {
          expect(result.isError).toEqual(true)
        } else {
          expect(result.isCompliant).toEqual(expected)
          expect(result.isError).toEqual(false)
        }
        expect(mockGetRisk).toHaveBeenCalledWith(addresses)
      })
    })

    describe('when no addresses are provided', () => {
      it('should return true', async () => {
        const result = await service.check([])
        expect(result.isCompliant).toEqual(true)
        expect(mockGetRisk).not.toHaveBeenCalled()
      })
    })
  })
})

describe('POST /compliant', () => {
  const address = '0x76d031825134aaf073436Aba2087a3B589babd9F'

  beforeEach(() => {
    jest.resetAllMocks()
  })

  it('should respond with status 400 if no address is provided', async () => {
    setRisk({ risk_score: RiskScore.LOW })
    const res = await testServer.get('/compliant').expect(400)

    const errors = res.body.errors as FieldValidationError[]
    expect(errors.length).toEqual(1)
    expect(errors[0].path).toEqual('address')
  })

  describe.each([
    { risk: RiskScore.LOW, expected: true },
    { risk: RiskScore.MED, expected: false },
    { risk: RiskScore.HIGH, expected: false },
    { risk: RiskScore.CRITICAL, expected: false },
    { risk: 'shady' as RiskScore, expected: 'error' }
  ])('Compliance: Risk $risk', ({ risk, expected }) => {
    beforeEach(() => {
      setRisk({ risk_score: risk })
    })

    it('should return $expected', async () => {
      const res = await testServer.get('/compliant').query({ address })
      const result = res.body as ComplianceCheckResult
      if (expected === 'error') {
        expect(res.status).toEqual(500)
        expect(result.isError).toEqual(true)
      } else {
        expect(res.status).toEqual(200)
        expect(result.isError).toEqual(false)
        expect(result.isCompliant).toEqual(expected)
      }
      expect(mockGetRisk).toHaveBeenCalledWith([address])
    })
  })

  it('should handle multiple addresses', async () => {
    setRisk({ risk_score: RiskScore.LOW })
    const addresses = [
      '0x76d031825134aaf073436Aba2087a3B589babd9F',
      '0xDD4c48C0B24039969fC16D1cdF626eaB821d3384'
    ]

    const res = await testServer.get('/compliant').query({ address: addresses })

    const result = res.body as ComplianceCheckResult
    expect(res.status).toEqual(200)
    expect(result.isError).toEqual(false)
    expect(result.isCompliant).toEqual(true)
    expect(result.results.length).toEqual(2)
    expect(mockGetRisk).toHaveBeenCalledWith(addresses)
  })

  it('should respond with status 500 if xplorisk returns error', async () => {
    mockGetRisk.mockRejectedValue(new Error('Xplorisk test error'))
    const address = '0x76d031825134aaf073436Aba2087a3B589babd9F'

    const res = await testServer.get('/compliant').query({ address })

    expect(res.status).toEqual(500)
    expect(res.text).toEqual('failed to check compliance')
  })

  describe('when COMPLIANCE_URL is not set', () => {
    beforeEach(() => {
      jest.resetModules()
      process.env = {
        ...originalEnv,
        COMPLIANCE_URL: ''
      }
      setRisk({ risk_score: RiskScore.LOW })
    })

    afterEach(() => {
      process.env = originalEnv
    })

    it('should return 501 with a not supported error', async () => {
      const res = await testServer.get('/compliant').query({ address })
      expect(res.status).toEqual(501)
      expect(res.text).toEqual('not supported')
    })
  })
})
