// Keep these types local to the submit feature.
// They describe the Cosmos/Kima "submit" response we get back.
export type KimaAttribute = { key: string; value: string }
export type KimaEvent = { type: string; attributes: KimaAttribute[] }

export type KimaSubmitResponse = {
  code?: number
  rawLog?: string
  events?: KimaEvent[]
  [key: string]: unknown
}

export type KimaError = { code?: string; content?: string }

export type OptionsMap = Record<string, unknown>

/**
 * Options are sent as stringified JSON. We need a safe parse that
 * never throws and returns an object.
 */
export const parseOptions = (raw: unknown): OptionsMap => {
  if (typeof raw !== 'string') return {}
  try {
    return JSON.parse(raw) as OptionsMap
  } catch {
    return {}
  }
}

/**
 * rawLog is a Cosmos JSON array string. When present, it may
 * hold the same "error" event as `events`. We use it as a fallback.
 */
const parseRawLog = (rawLog?: string): Array<{ events?: KimaEvent[] }> => {
  if (!rawLog) return []
  try {
    const parsed = JSON.parse(rawLog)
    return Array.isArray(parsed) ? parsed : []
  } catch {
    return []
  }
}

/**
 * Find an "error" event in the submit response. If found, return its
 * code/content so the API can surface it as a proper HTTP error.
 */
export const extractKimaError = (
  submitResponse: KimaSubmitResponse
): KimaError | null => {
  // Prefer structured `events`
  if (Array.isArray(submitResponse.events)) {
    const errorEvent = submitResponse.events.find((e) => e?.type === 'error')
    if (errorEvent?.attributes?.length) {
      const code = errorEvent.attributes.find((a) => a.key === 'code')?.value
      const content = errorEvent.attributes.find(
        (a) => a.key === 'content'
      )?.value
      if (code || content) return { code, content }
    }
  }

  // Fallback to rawLog if present
  const rawLogEvents = parseRawLog(submitResponse.rawLog)[0]?.events ?? []
  const rawLogError = rawLogEvents.find((e) => e?.type === 'error')
  if (rawLogError?.attributes?.length) {
    const code = rawLogError.attributes.find((a) => a.key === 'code')?.value
    const content = rawLogError.attributes.find(
      (a) => a.key === 'content'
    )?.value
    if (code || content) return { code, content }
  }

  return null
}
