import { getRisk, RiskResult, RiskScore } from '../../xplorisk'

export const mockGetRisk = getRisk as jest.MockedFunction<typeof getRisk>

/**
 * Example response:
 * [
  {
    "name": "TORNADO CASH",
    "contract": "False",
    "classification": [
      "sanctioned",
      "blocked"
    ],
    "risk_factors": [
      "blocked",
      "mixer_in"
    ],
    "risk_score": "critical",
    "address": "0xDD4c48C0B24039969fC16D1cdF626eaB821d3384"
  }
]
 */

export const setRisk = (risk: Partial<RiskResult>) =>
  mockGetRisk.mockImplementation(async (addresses: Array<string>) => {
    if (!addresses || addresses.length === 0) {
      throw new Error('Must provide at least one address to check')
    }
    return addresses.map((address: string) => ({
      name: risk.name ?? 'Mock Address',
      classification: risk.classification ?? [],
      risk_factors: risk.risk_factors ?? [],
      risk_score: risk.risk_score ?? RiskScore.LOW,
      address
    }))
  })
