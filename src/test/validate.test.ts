import { fetchWrapper } from '../fetch-wrapper'
import type { Request } from 'express'
import { validate } from '../validate'
import { generateTransDetails } from './utils/trans-generator'
import { TransactionDetailsType } from '../types/submit-transaction'

jest.mock('../fetch-wrapper', () => ({
  fetchWrapper: {
    get: jest.fn((url) => {
      const apiChainsResponse = require('./data/api-chains-response.json')
      console.log('mock fetch', url)
      if (url.includes('/chains/chain')) {
        console.log('mock fetch returning chains')
        return Promise.resolve(apiChainsResponse)
      }
      return Promise.resolve({})
    }),
    post: jest.fn()
  }
}))

const mockedFetchWrapper = fetchWrapper as {
  get: jest.Mock
  post: jest.Mock
}

console.log('validate.tests.ts loaded')

describe('validate', () => {
  beforeEach(() => {
    jest.resetAllMocks()
  })

  const generateSubmitRequest = (
    data?: Partial<TransactionDetailsType>
  ): Request => {
    return {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: generateTransDetails(data)
    } as unknown as Request
  }

  it('should return the empty string for a valid request', async () => {
    const req = generateSubmitRequest()
    const result = await validate(req)
    expect(result).toEqual('')
  })

  it('should return an error for tokens that are not pegged to the same currency', async () => {
    const req = generateSubmitRequest({
      originChain: 'FIAT',
      originSymbol: 'EUR',
      targetSymbol: 'USDK'
    })
    const result = await validate(req)
    expect(result).toMatch(
      /origin and target tokens must be pagged to the same currency/i
    )
  })

  it('should return the empty string for currency pegged to the same currency: case EUR', async () => {
    const req = generateSubmitRequest({
      originChain: 'CC',
      originSymbol: 'EUR',
      targetChain: 'ETH',
      targetSymbol: 'KEUR'
    })
    const result = await validate(req)
    expect(result).toEqual('')
  })

  it('should return the empty string for currency pegged to the same currency: case USD', async () => {
    const req = generateSubmitRequest({
      originChain: 'CC',
      originSymbol: 'USD',
      targetChain: 'ETH',
      targetSymbol: 'USDK'
    })
    const result = await validate(req)
    expect(result).toEqual('')
  })
})
