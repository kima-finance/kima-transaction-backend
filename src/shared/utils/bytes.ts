const hexStringToUint8Array = (hex?: string): Uint8Array => {
  if (!hex) return new Uint8Array() // tolerate undefined/empty -> caller can omit field
  const clean = hex.startsWith('0x') ? hex.slice(2) : hex
  if (clean.length === 0) return new Uint8Array()
  if (clean.length % 2 !== 0) {
    throw new Error('hex must have even length')
  }
  const out = new Uint8Array(clean.length / 2)
  for (let i = 0; i < clean.length; i += 2) {
    out[i / 2] = parseInt(clean.slice(i, i + 2), 16)
  }
  return out
}

export default hexStringToUint8Array
