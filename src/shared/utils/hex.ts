const HEX_RE = /^[0-9a-fA-F]+$/

export const encodeHexString = (value: string, fieldName = 'value'): string => {
  const trimmed = value.trim()
  if (!trimmed) {
    throw new Error(`${fieldName} is empty`)
  }

  const noPrefix = trimmed.startsWith('0x') ? trimmed.slice(2) : trimmed
  if (!noPrefix) {
    throw new Error(`${fieldName} is empty`)
  }

  if (noPrefix.length % 2 !== 0) {
    throw new Error(`${fieldName} must be valid even-length hex`)
  }

  if (!HEX_RE.test(noPrefix)) {
    throw new Error(`${fieldName} must be valid hex`)
  }

  // Canonical lowercase hex string (equivalent to Go hex.EncodeToString on decoded bytes).
  return Buffer.from(noPrefix, 'hex').toString('hex')
}
