import { validatePermit2Payload } from './permit2'

const HEX_32_A = `0x${'aa'.repeat(32)}`
const HEX_32_B = `0x${'bb'.repeat(32)}`

describe('validatePermit2Payload', () => {
  it('accepts a valid permit payload', () => {
    const parsed = validatePermit2Payload(
      {
        r: HEX_32_A,
        s: HEX_32_B,
        v: 27,
        deadline: 1_900_000_000
      },
      1_800_000_000
    )

    expect(parsed).toEqual({
      r: HEX_32_A,
      s: HEX_32_B,
      v: 27,
      deadline: 1_900_000_000
    })
  })

  it('normalizes recovery id v from 0/1 to 27/28', () => {
    expect(
      validatePermit2Payload(
        {
          r: HEX_32_A,
          s: HEX_32_B,
          v: 0,
          deadline: 1_900_000_000
        },
        1_800_000_000
      ).v
    ).toBe(27)

    expect(
      validatePermit2Payload(
        {
          r: HEX_32_A,
          s: HEX_32_B,
          v: 1,
          deadline: 1_900_000_000
        },
        1_800_000_000
      ).v
    ).toBe(28)
  })

  it('rejects invalid r/s hex payloads', () => {
    expect(() =>
      validatePermit2Payload(
        {
          r: '0x1234',
          s: HEX_32_B,
          v: 27,
          deadline: 1_900_000_000
        },
        1_800_000_000
      )
    ).toThrow('options.permit2.r must be exactly 32 bytes')
  })

  it('rejects invalid v values', () => {
    expect(() =>
      validatePermit2Payload(
        {
          r: HEX_32_A,
          s: HEX_32_B,
          v: 30,
          deadline: 1_900_000_000
        },
        1_800_000_000
      )
    ).toThrow('options.permit2.v must be 27 or 28')
  })

  it('rejects expired permit deadlines', () => {
    expect(() =>
      validatePermit2Payload(
        {
          r: HEX_32_A,
          s: HEX_32_B,
          v: 27,
          deadline: 1_700_000_000
        },
        1_800_000_000
      )
    ).toThrow('options.permit2.deadline must be in the future')
  })
})

