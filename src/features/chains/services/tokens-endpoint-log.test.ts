import { buildTokensEndpointLogPayload } from './tokens-endpoint-log'
import { ChainDto } from '../types/chain.dto'

describe('buildTokensEndpointLogPayload', () => {
  it('builds token symbols and shape from chain data', () => {
    const chains: ChainDto[] = [
      {
        id: '1',
        name: 'Ethereum',
        symbol: 'ETH',
        disabled: false,
        isEvm: true,
        derivationAlgorithm: 'ECDSA',
        tokens: [
          {
            symbol: 'USDT',
            address: '0x123',
            decimals: '6',
            peggedTo: 'USD'
          },
          {
            symbol: 'USDC',
            address: '0x456',
            decimals: '6',
            peggedTo: 'USD'
          }
        ]
      },
      {
        id: '2',
        name: 'Polygon',
        symbol: 'POL',
        disabled: false,
        isEvm: true,
        derivationAlgorithm: 'ECDSA',
        tokens: []
      }
    ]

    expect(buildTokensEndpointLogPayload(chains)).toEqual({
      chainCount: 2,
      responseShape: ['Chain'],
      tokenShape: ['address', 'decimals', 'peggedTo', 'symbol'],
      chains: [
        {
          chainSymbol: 'ETH',
          tokenCount: 2,
          tokens: ['USDT', 'USDC']
        },
        {
          chainSymbol: 'POL',
          tokenCount: 0,
          tokens: []
        }
      ]
    })
  })

  it('returns empty token shape when no tokens are present', () => {
    const chains: ChainDto[] = [
      {
        id: '1',
        name: 'Ethereum',
        symbol: 'ETH',
        disabled: false,
        isEvm: true,
        derivationAlgorithm: 'ECDSA',
        tokens: []
      }
    ]

    expect(buildTokensEndpointLogPayload(chains).tokenShape).toEqual([])
  })
})
