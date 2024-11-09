import { getRisk, RiskResult, RiskScore, RiskScore2String } from './xplorisk'

export class ComplianceService {
  get enabled() {
    return !!process.env.COMPLIANCE_URL
  }

  /**
   * Checks the given addresses for thier compliance risk scores if enabled.
   *
   * @async
   * @param {string[]} addresses
   * @returns {Promise<string>} Returns the empty string when the check passes, a comma separated list
   * of addresses and their scores otherwise.
   */
  check = async (addresses: string[]): Promise<string> => {
    if (!this.enabled || addresses.length === 0) {
      return ''
    }

    try {
      const results = await getRisk(addresses)
      return this.handleRiskScores(results)
    } catch (e) {
      // this should probably throw an error
      console.log(e)
      return ''
    }
  }

  score = async (address: string): Promise<string> => {
    if (!this.enabled) {
      return ''
    }

    const results: Array<RiskResult> = await getRisk([address])
    if (results.length === 0) return ''

    return RiskScore2String[results[0].risk_score]
  }

  /**
   * Checks the risk score results. Only addresses with a score of LOW are considered safe.
   *
   * @param {RiskResult[]} results
   * @returns {string} the empty string when the check passes,
   * a comma separated list of addresses and their scores otherwise.
   */
  private handleRiskScores = (results: RiskResult[]) => {
    const totalRisky: number = results.reduce(
      (a, c) => a + (c.risk_score !== RiskScore.LOW ? 1 : 0),
      0
    )

    let riskyResult = ''
    if (totalRisky > 0) {
      for (let i = 0; i < results.length; i++) {
        if (results[i].risk_score === RiskScore.LOW) continue
        if (riskyResult.length > 0) riskyResult += ', '
        riskyResult += `${results[i].address} has ${
          RiskScore2String[results[i].risk_score]
        } risk`
      }
    }

    return riskyResult
  }
}

export const complianceService = new ComplianceService()
