import { encodeHexString } from './hex'

describe('encodeHexString', () => {
  it('returns canonical lowercase hex', () => {
    expect(encodeHexString('A1B2C3', 'senderPubKey')).toBe('a1b2c3')
  })

  it('accepts 0x-prefixed values', () => {
    expect(encodeHexString('0x03AABB', 'senderPubKey')).toBe('03aabb')
  })

  it('throws when empty', () => {
    expect(() => encodeHexString('   ', 'senderPubKey')).toThrow(
      'senderPubKey is empty'
    )
  })

  it('throws on odd-length hex', () => {
    expect(() => encodeHexString('abc', 'senderPubKey')).toThrow(
      'senderPubKey must be valid even-length hex'
    )
  })

  it('throws on non-hex characters', () => {
    expect(() => encodeHexString('zz00', 'senderPubKey')).toThrow(
      'senderPubKey must be valid hex'
    )
  })
})
