import { FieldValidationError } from 'express-validator'
import { RiskScore } from '../compliance'
import { generateTransDetails } from './utils/trans-generator'
import { mockGetRisk, setRisk } from './mocks/compliance.mock'
import { testServer } from './config'
import { submitKimaTransaction } from '@kimafinance/kima-transaction-api'
import { CHAINS } from '../data/chains'
import chainsService from '../service/chains.service'
import { ENV } from '../env-validate'

jest.mock('../service/chains.service')
jest.mock('../compliance')
jest.mock('@kimafinance/kima-transaction-api')

export const mockSubmitKimaTransaction =
  submitKimaTransaction as jest.MockedFunction<typeof submitKimaTransaction>
const originalEnv = process.env

const mockChainService = chainsService as jest.Mocked<typeof chainsService>

describe('POST /submit', () => {
  beforeEach(() => {
    jest.resetAllMocks()

    const chains = CHAINS.map((chain) => chain.shortName)
    mockChainService.getChainNames.mockResolvedValue(chains)
    mockChainService.getAvailableCurrencies.mockResolvedValue(['USDK'])
  })

  it('should return status 400 when properties are missing', async () => {
    const payload = generateTransDetails({
      amount: '101',
      targetSymbol: ''
    })
    expect(payload.targetSymbol).toEqual('')
    setRisk({ risk_score: RiskScore.LOW })
    console.log('payload', payload)

    const res = await testServer.post('/submit').send(payload).expect(400)

    const errors = res.body.errors as FieldValidationError[]
    expect(errors.length).toEqual(1)

    const error = errors[0]
    expect(error.path).toEqual('targetSymbol')
  })

  it('should return status 400 with an invalid Solana address', async () => {
    const payload = generateTransDetails({
      originAddress: '8bct1AEUdkfVdEaQBrFVpCYXdw6kUDReo5ZF3cxqsEQU',
      originChain: 'SOL'
    })
    setRisk({ risk_score: RiskScore.LOW })

    const res = await testServer.post('/submit').send(payload)

    expect(res.status).toEqual(400)
    expect(res.text).toMatch(/invalid Solana address/i)
    expect(mockChainService.getChainNames).toHaveBeenCalledTimes(1)
  })

  describe('when compliance is enabled', () => {
    it('should return status 200 for a compliant address', async () => {
      const payload = generateTransDetails()
      setRisk({ risk_score: RiskScore.LOW })

      const res = await testServer.post('/submit').send(payload)

      expect(res.status).toEqual(200)
      expect(mockGetRisk).toHaveBeenCalledWith([
        payload.originAddress,
        payload.targetAddress
      ])
      expect(mockSubmitKimaTransaction).toHaveBeenCalledTimes(1)
    })

    it('should return status 403 for a risky address', async () => {
      const payload = generateTransDetails({
        originAddress: '0xDD4c48C0B24039969fC16D1cdF626eaB821d3384',
        targetAddress: '0x001474b877f98f41701397a65d4d313ab180c7b2'
      })
      setRisk({ risk_score: RiskScore.MED })

      const res = await testServer.post('/submit').send(payload)

      expect(res.status).toEqual(403)
      expect(res.text).toContain('risk')
      expect(mockGetRisk).toHaveBeenCalledWith([
        payload.originAddress,
        payload.targetAddress
      ])
    })
  })

  describe('when compliance is not enabled', () => {
    let replacedEnv: jest.ReplaceProperty<string>
    beforeEach(() => {
      replacedEnv = jest.replaceProperty(ENV, 'COMPLIANCE_URL', '')
      process.env = {
        ...originalEnv,
        COMPLIANCE_URL: ''
      }
      expect(ENV.COMPLIANCE_URL).toBe('')
    })

    afterEach(() => {
      replacedEnv.restore()
    })

    it('should return status 200 for a risky address', async () => {
      const payload = generateTransDetails()
      setRisk({ risk_score: RiskScore.MED })

      const res = await testServer.post('/submit').send(payload)

      expect(res.status).toEqual(200)
      expect(mockGetRisk).not.toHaveBeenCalled()
      expect(mockSubmitKimaTransaction).toHaveBeenCalledTimes(1)
    })
  })
})
