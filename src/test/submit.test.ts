import { RiskScore } from '../compliance'
import { generateTransDetails } from './utils/trans-generator'
import { mockGetRisk, setRisk } from './mocks/compliance.mock'
import { testServer } from './config'
import { submitKimaTransaction } from '@kimafinance/kima-transaction-api'
import { CHAINS } from '../data/chains'
import { chainsService } from '../service/chain-service-singleton'
import { ENV } from '../env-validate'

jest.mock('../service/chain-service-singleton')
jest.mock('../compliance')
jest.mock('@kimafinance/kima-transaction-api')

export const mockSubmitKimaTransaction =
  submitKimaTransaction as jest.MockedFunction<typeof submitKimaTransaction>

const mockChainService = chainsService as jest.Mocked<typeof chainsService>

describe('POST /submit', () => {
  beforeEach(() => {
    jest.resetAllMocks()

    const chains = CHAINS.map((chain) => chain.shortName)
    mockChainService.getChainNames.mockResolvedValue(chains)
    mockChainService.getAvailableCurrencies.mockResolvedValue(['USDK'])
    mockChainService.isDisabledChain.mockResolvedValue(false)
    mockChainService.isSupportedChain.mockReturnValue(true)
    mockChainService.getToken.mockResolvedValue({
      address: '0x001474b877f98f41701397a65d4d313ab180c7b2',
      symbol: 'USDK',
      decimals: 6,
      peggedTo: 'USD'
    })
  })

  it('should return status 400 when properties are missing', async () => {
    const data = generateTransDetails({
      amount: '101',
      targetSymbol: ''
    })
    const { targetSymbol, ...payload } = data

    expect('targetSymbol' in payload).toEqual(false)
    setRisk({ risk_score: RiskScore.LOW })

    const res = await testServer.post('/submit').send(payload).expect(400)
    const { body } = res

    expect(body.error).toEqual('Validation failed')
    expect(JSON.stringify(body.details)).toMatch(/targetSymbol/i)
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
      expect(ENV.COMPLIANCE_URL).toBe('')
    })

    afterEach(() => {
      replacedEnv?.restore()
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
