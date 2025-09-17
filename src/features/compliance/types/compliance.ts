export enum RiskScore {
  LOW = 'low',
  MED = 'med',
  HIGH = 'high',
  CRITICAL = 'critical'
}

export type RiskResult = {
  address: string
  name: string
  classification: string[]
  risk_factors: string[]
  risk_score: RiskScore
}

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
