import {
  arbitrum,
  arbitrumSepolia,
  avalanche,
  avalancheFuji,
  bsc,
  bscTestnet,
  mainnet,
  optimism,
  optimismSepolia,
  polygon,
  polygonAmoy,
  polygonZkEvm,
  polygonZkEvmTestnet,
  sepolia,
  tron
} from 'viem/chains'
import { Chain, ChainCompatibility } from '../types/chain'

export const CHAINS: Chain[] = [
  {
    ...arbitrum,
    compatibility: ChainCompatibility.EVM,
    shortName: 'ARB',
    supportedTokens: [
      {
        id: '0',
        symbol: 'USDT',
        address: '0xfd086bc7cd5c481dcc9c85ebe478a1c0b69fcbb9'
      },
      {
        id: '1',
        symbol: 'USDC',
        address: '0xaf88d065e77c8cC2239327C5EDb3A432268e5831'
      }
    ]
  },
  {
    ...arbitrumSepolia,
    compatibility: ChainCompatibility.EVM,
    shortName: 'ARB',
    supportedTokens: [
      {
        id: '0',
        symbol: 'USDK',
        address: '0x2cf79df2879902a2fc06329b1760e0f2ad9a3a47'
      }
    ]
  },
  {
    ...avalanche,
    compatibility: ChainCompatibility.EVM,
    shortName: 'AVX',
    supportedTokens: [
      {
        id: '0',
        symbol: 'USDT',
        address: '0x9702230A8Ea53601f5cD2dc00fDBc13d4dF4A8c7'
      },
      {
        id: '1',
        symbol: 'USDC',
        address: '0xB97EF9Ef8734C71904D8002F8b6Bc66Dd9c48a6E'
      }
    ]
  },
  {
    ...avalancheFuji,
    compatibility: ChainCompatibility.EVM,
    shortName: 'AVX',
    supportedTokens: [
      {
        id: '0',
        symbol: 'USDK',
        address: '0x5d8598Ce65f15f14c58aD3a4CD285223c8e76a2E'
      }
    ]
  },
  {
    ...bsc,
    compatibility: ChainCompatibility.EVM,
    shortName: 'BSC',
    supportedTokens: [
      {
        id: '0',
        symbol: 'USDT',
        address: '0x55d398326f99059fF775485246999027B3197955'
      },
      {
        id: '1',
        symbol: 'USDC',
        address: '0x8ac76a51cc950d9822d68b83fe1ad97b32cd580d'
      }
    ]
  },
  {
    ...bscTestnet,
    compatibility: ChainCompatibility.EVM,
    shortName: 'BSC',
    supportedTokens: [
      {
        id: '0',
        symbol: 'USDK',
        address: '0x3eb36be2c3FD244139756F681420637a2a9464e3'
      }
    ],
    faucets: ['https://testnet.bnbchain.org/faucet-smart']
  },
  {
    id: 0,
    shortName: 'BTC',
    name: 'Bitcoin',
    supportedTokens: [],
    compatibility: ChainCompatibility.BTC,
    rpcUrls: {
      default: { http: [] }
    },
    faucets: [],
    nativeCurrency: {
      name: 'Bitcoin',
      symbol: 'BTC',
      decimals: 8
    },
    blockExplorers: {
      default: {
        name: 'blockstream',
        url: 'https://blockstream.info'
      }
    }
  },
  {
    id: 0,
    name: 'Bitcoin Testnet',
    shortName: 'BTC',
    supportedTokens: [
      {
        id: '1',
        symbol: 'WBTC',
        address: 'NativeCoin'
      }
    ],
    compatibility: ChainCompatibility.BTC,
    rpcUrls: {
      default: { http: [] }
    },
    faucets: [],
    nativeCurrency: {
      name: 'Bitcoin',
      symbol: 'BTC',
      decimals: 8
    },
    blockExplorers: {
      default: {
        name: 'blockstream',
        url: 'https://blockstream.info/testnet/'
      }
    }
  },
  {
    ...mainnet,
    shortName: 'ETH',
    compatibility: ChainCompatibility.EVM,
    supportedTokens: [
      {
        id: '0',
        symbol: 'USDT',
        address: '0xdAC17F958D2ee523a2206206994597C13D831ec7'
      },
      {
        id: '1',
        symbol: 'USDC',
        address: '0xa0b86991c6218b36c1d19d4a2e9eb0ce3606eb48'
      }
    ]
  },
  {
    ...sepolia,
    shortName: 'ETH',
    compatibility: ChainCompatibility.EVM,
    supportedTokens: [
      {
        id: '0',
        symbol: 'USDK',
        address: '0x5FF59Bf2277A1e6bA9bB8A38Ea3F9ABfd3d9345a'
      },
      {
        id: '1',
        symbol: 'WBTC',
        address: '0x5703992Cd91cAB655f2BF3EcbD4cD22e3c75832D'
      }
    ]
  },
  {
    ...optimism,
    shortName: 'OPT',
    compatibility: ChainCompatibility.EVM,
    supportedTokens: [
      {
        id: '0',
        symbol: 'USDT',
        address: '0x94b008aa00579c1307b0ef2c499ad98a8ce58e58'
      },
      {
        id: '1',
        symbol: 'USDC',
        address: '0x0b2C639c533813f4Aa9D7837CAf62653d097Ff85'
      }
    ]
  },
  {
    ...optimismSepolia,
    shortName: 'OPT',
    compatibility: ChainCompatibility.EVM,
    supportedTokens: [
      {
        id: '0',
        symbol: 'USDK',
        address: '0x2cf79df2879902a2fc06329b1760e0f2ad9a3a47'
      }
    ]
  },
  {
    ...polygon,
    shortName: 'POL',
    compatibility: ChainCompatibility.EVM,
    supportedTokens: [
      {
        id: '0',
        symbol: 'USDT',
        address: '0xc2132d05d31c914a87c6611c10748aeb04b58e8f'
      },
      {
        id: '1',
        symbol: 'USDC',
        address: '0x3c499c542cEF5E3811e1192ce70d8cC03d5c3359'
      }
    ]
  },
  {
    ...polygonAmoy,
    shortName: 'POL',
    compatibility: ChainCompatibility.EVM,
    supportedTokens: [
      {
        id: '0',
        symbol: 'USDK',
        address: '0x30171cfb10ed578814a22475a190306776bc8392'
      },
      {
        id: '1',
        symbol: 'WBTC',
        address: '0x66E1537e2A62168Ca19Bf5b6e2E66b5C806b8ab1'
      }
    ]
  },
  {
    ...polygonZkEvm,
    shortName: 'ZKE',
    compatibility: ChainCompatibility.EVM,
    supportedTokens: [
      {
        id: '0',
        symbol: 'USDT',
        address: '0x1e4a5963abfd975d8c9021ce480b42188849d41d'
      },
      {
        id: '1',
        symbol: 'USDC',
        address: '0xa8ce8aee21bc2a48a5ef670afcc9274c7bbbc035'
      }
    ]
  },
  {
    ...polygonZkEvmTestnet,
    shortName: 'ZKE',
    compatibility: ChainCompatibility.EVM,
    supportedTokens: [
      {
        id: '0',
        symbol: 'USDK',
        address: '0x2cf79df2879902a2fc06329b1760e0f2ad9a3a47'
      }
    ]
  },
  {
    id: 101,
    name: 'Solana',
    shortName: 'SOL',
    compatibility: ChainCompatibility.SOL,
    supportedTokens: [
      {
        id: '0',
        symbol: 'USDT',
        address: 'Es9vMFrzaCERmJfrF4H2FYD4KCoNkY11McCe8BenwNYB'
      },
      {
        id: '1',
        symbol: 'USDC',
        address: 'EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v'
      }
    ],
    rpcUrls: {
      default: { http: ['https://api.mainnet-beta.solana.com'] }
    },
    faucets: [],
    nativeCurrency: {
      name: 'Solana',
      symbol: 'SOL',
      decimals: 9
    },
    blockExplorers: {
      default: {
        name: 'solscan',
        url: 'https://solscan.io'
      }
    }
  },
  {
    id: 102,
    name: 'Solana Testnet',
    shortName: 'SOL',
    compatibility: ChainCompatibility.SOL,
    supportedTokens: [
      {
        id: '0',
        symbol: 'USDK',
        address: '9YSFWfU9Ram6mAo2QP9zsTnA8yFkkkFGEs3kGgjtQKvp'
      }
    ],
    rpcUrls: {
      default: { http: ['https://api.testnet.solana.com'] }
    },
    faucets: [],
    nativeCurrency: {
      name: 'Solana',
      symbol: 'SOL',
      decimals: 9
    },
    blockExplorers: {
      default: {
        name: 'solscan',
        url: 'https://solscan.io'
      }
    }
  },
  {
    ...tron,
    shortName: 'TRX',
    compatibility: ChainCompatibility.EVM,
    supportedTokens: [
      {
        id: '0',
        symbol: 'USDT',
        address: 'TR7NHqjeKQxGTCi8q8ZY4pL8otSzgjLj6t'
      }
    ]
  },
  {
    id: 3448148188,
    name: 'Tron Nile',
    shortName: 'TRX',
    compatibility: ChainCompatibility.EVM,
    supportedTokens: [
      {
        id: '0',
        symbol: 'USDK',
        address: 'TEuRmCALTUY2syY1EE6mMYnyfmNfFfMpYz'
      }
    ],
    nativeCurrency: {
      name: 'TRON',
      symbol: 'TRX',
      decimals: 6
    },
    rpcUrls: { default: { http: ['https://api.nileex.io/jsonrpc'] } },
    faucets: ['http://nileex.io/join/getJoinPage'],
    blockExplorers: {
      default: {
        name: 'Tronscan',
        url: 'https://nile.tronscan.org/'
      }
    },
    testnet: true
  }
  // Tron Shasta not supported yet
  // {
  //   id: 2494104990,
  //   name: 'Tron Shasta',
  //   shortName: 'TRX',
  //   compatibility: ChainCompatibility.EVM,
  //   supportedTokens: [],
  //   nativeCurrency: {
  //     name: 'TRON',
  //     symbol: 'TRX',
  //     decimals: 6
  //   },
  //   rpcUrls: {
  //     default: { http: ['https://api.shasta.trongrid.io/jsonrpc'] }
  //   },
  //   faucets: ['https://shasta.tronex.io/'],
  //   blockExplorers: {
  //     default: {
  //       name: 'Tronscan',
  //       url: 'https://shasta.tronscan.org'
  //     }
  //   }
  // }
] satisfies Chain[]
