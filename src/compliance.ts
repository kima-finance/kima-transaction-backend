/// <reference lib="dom" />
/**
 * Compliance API
 */

import { ENV } from './env-validate'

export enum RiskScore {
  LOW = 'low',
  MED = 'med',
  HIGH = 'high',
  CRITICAL = 'critical'
}

export const RiskScore2String: { [riskScore: string]: string } = {
  [RiskScore.LOW]: 'low',
  [RiskScore.MED]: 'medium',
  [RiskScore.HIGH]: 'high',
  [RiskScore.CRITICAL]: 'critical'
}

export type RiskResult = {
  address: string
  name: string
  classification: Array<string>
  risk_factors: Array<string>
  risk_score: RiskScore
}

/**
 * Returns the risk score for each address
 *
 * @async
 * @param {Array<string>} addresses
 * @returns {Promise<Array<RiskResult>>}
 */
export const getRisk = async (
  addresses: Array<string>
): Promise<Array<RiskResult>> => {
  // TODO: refactor to use client (sub) API key
  if (!addresses.length) {
    throw new Error('Must provide at least one address to check')
  }
  const response: Response = await fetch(ENV.COMPLIANCE_URL as string, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      addresses
    })
  })

  if (response.ok) {
    const json = await response.json()
    if (json.status === 'fail') {
      throw new Error(json.error ?? 'Unexpected error occured')
    }
    return json as Array<RiskResult>
  } else {
    const statusText: string = await response.text()
    throw new Error(`HTTP error!: ${response.status} ${statusText}`)
  }
}
