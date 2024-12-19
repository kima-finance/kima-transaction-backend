import { RiskResult } from '../compliance'

export interface ComplianceResult {
  isCompliant: boolean
  result: RiskResult
}

export interface ComplianceResultError {
  address: string
  error: string
}

export interface ComplianceCheckResult {
  isCompliant: boolean
  isError: boolean
  results: Array<ComplianceResult | ComplianceResultError>
}
