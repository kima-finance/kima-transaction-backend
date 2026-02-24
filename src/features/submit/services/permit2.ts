export type Permit2Payload = {
  r: string
  s: string
  v: number
  deadline: number
}

const toHex32 = (value: unknown, label: 'r' | 's'): string => {
  if (typeof value !== 'string') {
    throw new Error(`options.permit2.${label} must be a hex string`)
  }

  const trimmed = value.trim()
  const noPrefix = trimmed.startsWith('0x') ? trimmed.slice(2) : trimmed
  if (noPrefix.length !== 64) {
    throw new Error(`options.permit2.${label} must be exactly 32 bytes`)
  }
  if (!/^[0-9a-fA-F]+$/.test(noPrefix)) {
    throw new Error(`options.permit2.${label} must be valid hex`)
  }

  const bytes = Buffer.from(noPrefix, 'hex')
  if (bytes.length !== 32) {
    throw new Error(`options.permit2.${label} must be exactly 32 bytes`)
  }

  return `0x${noPrefix}`
}

const toPermitV = (value: unknown): number => {
  const parsed =
    typeof value === 'number'
      ? value
      : typeof value === 'string'
        ? Number.parseInt(value, 10)
        : Number.NaN

  if (!Number.isInteger(parsed)) {
    throw new Error('options.permit2.v must be an integer')
  }

  if (parsed === 0 || parsed === 1) return parsed + 27
  if (parsed === 27 || parsed === 28) return parsed
  throw new Error('options.permit2.v must be 27 or 28')
}

const toDeadline = (value: unknown, nowSec: number): number => {
  const parsed =
    typeof value === 'number'
      ? value
      : typeof value === 'string'
        ? Number.parseInt(value, 10)
        : Number.NaN

  if (!Number.isSafeInteger(parsed)) {
    throw new Error('options.permit2.deadline must be a valid integer timestamp')
  }

  if (parsed <= nowSec) {
    throw new Error('options.permit2.deadline must be in the future')
  }

  return parsed
}

export const validatePermit2Payload = (
  permit2: unknown,
  nowSec = Math.floor(Date.now() / 1000)
): Permit2Payload => {
  if (!permit2 || typeof permit2 !== 'object' || Array.isArray(permit2)) {
    throw new Error('options.permit2 is required for permit tokens')
  }

  const payload = permit2 as Record<string, unknown>

  return {
    r: toHex32(payload.r, 'r'),
    s: toHex32(payload.s, 's'),
    v: toPermitV(payload.v),
    deadline: toDeadline(payload.deadline, nowSec)
  }
}
