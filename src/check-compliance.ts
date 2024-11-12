import { ComplianceCheckResult } from './types/compliance'
import { getRisk, RiskResult, RiskScore, RiskScore2String } from './xplorisk'

export class ComplianceService {
  readonly riskScoreToCompliance: Record<RiskScore, boolean> = {
    [RiskScore.LOW]: true,
    [RiskScore.MED]: false,
    [RiskScore.HIGH]: false,
    [RiskScore.CRITICAL]: false
  }

  get enabled() {
    return !!process.env.COMPLIANCE_URL
  }

  private requireEnabled = () => {
    if (!this.enabled) {
      throw new Error('Compliance check is not enabled')
    }
  }

  private newResult = (): ComplianceCheckResult => ({
    isCompliant: true,
    isError: false,
    results: []
  })

  private isCompliant = (result: RiskResult): boolean | Error => {
    const isCompliant = this.riskScoreToCompliance[result.risk_score]
    if (isCompliant === undefined) {
      return new Error('Unknown risk score')
    }
    return isCompliant
  }

  /**
   * Checks the given addresses for thier compliance risk scores if enabled.
   *
   * @async
   * @param {string[]} addresses
   * @returns {Promise<ComplianceCheckResult>}
   */
  check = async (addresses: string[]): Promise<ComplianceCheckResult> => {
    this.requireEnabled()
    if (!addresses || addresses.length === 0) {
      return this.newResult()
    }
    const results = await getRisk(addresses)
    return this.handleRiskScores(results)
  }

  /**
   * Checks the risk score results. Only addresses with a score of LOW are considered safe.
   *
   * @param {RiskResult[]} results
   * @returns {ComplianceCheckResult}
   */
  private handleRiskScores = (results: RiskResult[]): ComplianceCheckResult => {
    if (!results || results.length === 0) {
      return this.newResult()
    }

    const output = results.reduce<ComplianceCheckResult>(
      (acc: ComplianceCheckResult, result: RiskResult) => {
        const isCompliant = this.isCompliant(result)
        if (isCompliant instanceof Error) {
          acc.isCompliant = false
          acc.isError = true
          acc.results.push({
            address: result.address,
            error: isCompliant.message
          })
          return acc
        }

        if (!isCompliant) acc.isCompliant = false
        acc.results.push({
          isCompliant,
          result
        })

        return acc
      },
      this.newResult()
    )

    return output
  }
}

export const complianceService = new ComplianceService()
