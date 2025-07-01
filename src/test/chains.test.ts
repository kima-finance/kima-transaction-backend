import { CHAINS } from '../data/chains'
import { fetchWrapper } from '../fetch-wrapper'
import { ChainsService } from '../service/chains.service'
import { ChainList, ChainLocation, FilterConfig } from '../types/chain'
import { ChainEnv } from '../types/chain-env'
import apiChainsResponse from './data/api-chains-response.json'

jest.mock('../fetch-wrapper')

const mockedFetchWrapper = fetchWrapper as {
  get: jest.Mock
  post: jest.Mock
}

describe('Chain Service', () => {
  let chainFilter: FilterConfig
  let service: ChainsService
  let chainEnv: ChainEnv

  beforeEach(() => {
    jest.resetAllMocks()
    mockedFetchWrapper.get.mockImplementation((url: string) => {
      if (url.includes('/chains/chain')) {
        return Promise.resolve(apiChainsResponse)
      }
      return Promise.resolve({ status: 'fail', error: 'not found' })
    })

    chainFilter = {
      origin: {
        mode: 'whitelist',
        chains: ['ARB', 'OPT'] as ChainList
      },
      target: {
        mode: 'blacklist',
        chains: ['BSC', 'TRX'] as ChainList
      }
    } satisfies FilterConfig
    chainEnv = ChainEnv.TESTNET
  })

  it('should be created', () => {
    service = new ChainsService(chainEnv, chainFilter)
    expect(service).toBeDefined()
  })

  describe('Chain filtering', () => {
    describe('Validation', () => {
      describe('When no filter is set', () => {
        beforeEach(() => {
          service = new ChainsService(chainEnv, undefined)
        })

        it.each(
          CHAINS.flatMap((chain) =>
            ['origin', 'target'].map((location) => ({
              chain: chain.shortName,
              location,
              expected: chain.supportedLocations.includes(
                location as ChainLocation
              )
            }))
          )
        )(
          'should return the chain value: case $chain $location $expected',
          ({ chain, location, expected }) => {
            const result = service.isSupportedChain(
              chain,
              location as ChainLocation
            )
            expect(result).toEqual(expected)
          }
        )
      })

      describe('When a filter is set', () => {
        beforeEach(() => {
          expect(chainFilter?.origin?.mode).toEqual('whitelist')
          service = new ChainsService(chainEnv, chainFilter)
        })

        it.each([
          // whitelist from origin
          {
            case: 'whitelist',
            chain: 'ARB',
            location: 'origin',
            expected: true
          },
          {
            case: 'whitelist',
            chain: 'AVX',
            location: 'origin',
            expected: false
          },
          {
            case: 'whitelist',
            chain: 'BASE',
            location: 'origin',
            expected: false
          },
          {
            case: 'whitelist',
            chain: 'BERA',
            location: 'origin',
            expected: false
          },
          {
            case: 'whitelist',
            chain: 'BSC',
            location: 'origin',
            expected: false
          },
          {
            case: 'whitelist',
            chain: 'ETH',
            location: 'origin',
            expected: false
          },
          {
            case: 'whitelist',
            chain: 'OPT',
            location: 'origin',
            expected: true
          },
          {
            case: 'whitelist',
            chain: 'POL',
            location: 'origin',
            expected: false
          },
          {
            case: 'whitelist',
            chain: 'SOL',
            location: 'origin',
            expected: false
          },
          {
            case: 'whitelist',
            chain: 'TRX',
            location: 'origin',
            expected: false
          },

          // blacklist from target
          {
            case: 'blacklist',
            chain: 'ARB',
            location: 'target',
            expected: true
          },
          {
            case: 'blacklist',
            chain: 'AVX',
            location: 'target',
            expected: true
          },
          {
            case: 'blacklist',
            chain: 'BASE',
            location: 'target',
            expected: true
          },
          {
            case: 'blacklist',
            chain: 'BERA',
            location: 'target',
            expected: false
          },
          {
            case: 'blacklist',
            chain: 'BSC',
            location: 'target',
            expected: false
          },
          {
            case: 'blacklist',
            chain: 'ETH',
            location: 'target',
            expected: true
          },
          {
            case: 'blacklist',
            chain: 'OPT',
            location: 'target',
            expected: true
          },
          {
            case: 'blacklist',
            chain: 'POL',
            location: 'target',
            expected: true
          },
          {
            case: 'blacklist',
            chain: 'SOL',
            location: 'target',
            expected: true
          },
          {
            case: 'blacklist',
            chain: 'TRX',
            location: 'target',
            expected: false
          },

          // invalid chain shortname
          {
            case: 'invalid',
            chain: 'INVALID',
            location: 'origin',
            expected: false
          },
          {
            case: 'invalid',
            chain: 'INVALID',
            location: 'target',
            expected: false
          }
        ])(
          'case: $case $location filter should return $expected for $chain',
          ({ chain, location, expected }) => {
            const result = service.isSupportedChain(
              chain,
              location as ChainLocation
            )
            expect(result).toEqual(expected)
          }
        )
      })
    })
  })
})
