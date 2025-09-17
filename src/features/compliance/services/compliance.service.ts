import ENV from 'core/env'
import {
  RiskResult,
  RiskScore,
  ComplianceCheckResult
} from '../types/compliance'

const getRisk = async (addresses: string[]): Promise<RiskResult[]> => {
  if (!addresses.length) throw new Error('Must provide at least one address')
  if (!ENV.COMPLIANCE_URL) throw new Error('Compliance is not configured')

  const res: Response = await fetch(ENV.COMPLIANCE_URL, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ addresses })
  })

  if (!res.ok) {
    const text = await res.text()
    throw new Error(`HTTP ${res.status} ${text}`)
  }

  const json = await res.json()
  if (json?.status === 'fail') throw new Error(json.error ?? 'Compliance error')
  return json as RiskResult[]
}

class ComplianceService {
  readonly enabled: boolean

  constructor(private readonly url?: string) {
    this.enabled = Boolean(url)
  }

  check = async (addresses: string[]): Promise<ComplianceCheckResult> => {
    try {
      const results = await getRisk(addresses)
      const mapped = results.map((result) => ({
        isCompliant: result.risk_score === RiskScore.LOW,
        result
      }))
      const isCompliant = mapped.every((r) => r.isCompliant)
      return { isCompliant, isError: false, results: mapped }
    } catch (e) {
      const message = (e as Error)?.message ?? 'Compliance check failed'
      return {
        isCompliant: false,
        isError: true,
        results: addresses.map((address) => ({ address, error: message }))
      }
    }
  }
}

const complianceService = new ComplianceService(ENV.COMPLIANCE_URL)
export default complianceService
export { complianceService }
