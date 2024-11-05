import { getRisk, RiskResult, RiskScore } from '../xplorisk'

describe.skip('xplorisk API test', () => {
  it('should reject empty addresses', async () => {
    await expect(getRisk([])).rejects.toThrowError(
      'Must provide at least one address to check'
    )
  })

  it('should get an address with low risk', async () => {
    const results: Array<RiskResult> = await getRisk([
      '0x47B079c8EE493678e771886103705b39BF1A4992'
    ])
    expect(results.length).toBe(1)
    expect(results[0].risk_score).toEqual(RiskScore.LOW)
  })

  it('should get an address with medium risk', async () => {
    const results: Array<RiskResult> = await getRisk([
      '0x001474b877f98f41701397a65d4d313ab180c7b2'
    ])
    expect(results.length).toBe(1)
    expect(results[0].risk_score).toEqual(RiskScore.MED)
  })

  it('should get an address with high risk', async () => {
    const results: Array<RiskResult> = await getRisk([
      '0x39D908dac893CBCB53Cc86e0ECc369aA4DeF1A29'
    ])
    expect(results.length).toBe(1)
    expect(results[0].risk_score).toEqual(RiskScore.HIGH)
  })

  it('should get multiple results', async () => {
    const addresses: Array<string> = [
      '0x47B079c8EE493678e771886103705b39BF1A4992', //low
      '0x001474b877f98f41701397a65d4d313ab180c7b2', //medium
      '0xDD4c48C0B24039969fC16D1cdF626eaB821d3384', //high
      '0x098B716B8Aaf21512996dC57EB0615e2383E2f96', //high
      'bc1qfg4gfg0y6t6xjnpmlhuwx5k0wlw6nmfzxn2psc', //high
      '0x39D908dac893CBCB53Cc86e0ECc369aA4DeF1A29' //high
    ]
    const results: Array<RiskResult> = await getRisk(addresses)
    expect(results.length).toBe(addresses.length)
    const totalRisky: number = results.reduce(
      (a, c) => a + (c.risk_score !== RiskScore.LOW ? 1 : 0),
      0
    )
    expect(totalRisky).toEqual(5)
  })
})
