// import * as chains from 'viem/chains'
// import { Chain as ViemChain } from 'viem'
import { Chain, ChainCompatibility } from '../types/chain'

import {
  arbitrum,
  arbitrumSepolia,
  avalanche,
  avalancheFuji,
  base,
  baseSepolia,
  berachain,
  berachainBepolia,
  bsc,
  bscTestnet,
  mainnet,
  optimism,
  optimismSepolia,
  polygon,
  polygonAmoy,
  sepolia,
  tron,
  confluxESpaceTestnet,
  confluxESpace
} from 'viem/chains'

// const allViemChains: Record<number, ViemChain> = Object.values(chains)
//   .filter((c) => typeof c === 'object' && 'id' in c && 'rpcUrls' in c)
//   .reduce((acc, chain) => {
//     acc[chain.id] = chain as ViemChain
//     return acc
//   }, {} as Record<number, ViemChain>)

// this won't work for chains returned from the Kima API as they don't chain chainId
// export const getChainById = (id: number): ViemChain | undefined => {
//   return allViemChains[id]
// }

export const CHAINS: Chain[] = [
  {
    id: 0,
    name: 'Bank',
    shortName: 'BANK',
    compatibility: ChainCompatibility.BANK,
    supportedLocations: ['target'],
    supportedTokens: [
      {
        symbol: 'USD',
        decimals: 2,
        address: '',
        peggedTo: 'USD',
        protocol: 'swift_usd'
      },
      {
        symbol: 'EUR',
        decimals: 2,
        address: '',
        peggedTo: 'EUR',
        protocol: 'sepa_eur'
      }
    ],
    nativeCurrency: {
      name: 'USD',
      symbol: 'USD',
      decimals: 2
    },
    rpcUrls: {
      default: { http: [] }
    },
    faucets: [],
    blockExplorers: {
      default: {
        name: '',
        url: ''
      }
    },
    testnet: true
  },
  {
    id: 0,
    name: 'Bank',
    shortName: 'BANK',
    compatibility: ChainCompatibility.BANK,
    supportedLocations: ['target'],
    supportedTokens: [
      {
        symbol: 'USD',
        decimals: 2,
        address: '',
        peggedTo: 'USD',
        protocol: 'swift_usd'
      },
      {
        symbol: 'EUR',
        decimals: 2,
        address: '',
        peggedTo: 'EUR',
        protocol: 'sepa_eur'
      }
    ],
    nativeCurrency: {
      name: 'USD',
      symbol: 'USD',
      decimals: 2
    },
    rpcUrls: {
      default: { http: [] }
    },
    faucets: [],
    blockExplorers: {
      default: {
        name: '',
        url: ''
      }
    }
  },
  {
    id: 0,
    name: 'Credit Card',
    shortName: 'CC',
    compatibility: ChainCompatibility.CC,
    supportedLocations: ['origin'],
    supportedTokens: [
      {
        symbol: 'USD',
        decimals: 2,
        address: '',
        peggedTo: 'USD',
        protocol: 'credit_card'
      },
      {
        symbol: 'EUR',
        decimals: 2,
        address: '',
        peggedTo: 'EUR',
        protocol: 'credit_card'
      }
    ],
    nativeCurrency: {
      name: 'USD',
      symbol: 'USD',
      decimals: 2
    },
    rpcUrls: {
      default: { http: [] }
    },
    faucets: [],
    blockExplorers: {
      default: {
        name: '',
        url: ''
      }
    },
    testnet: true
  },
  {
    id: 0,
    name: 'Credit Card',
    shortName: 'CC',
    compatibility: ChainCompatibility.CC,
    supportedLocations: ['origin'],
    supportedTokens: [
      {
        symbol: 'USD',
        decimals: 2,
        address: '',
        peggedTo: 'USD',
        protocol: 'swift_usd'
      },
      {
        symbol: 'EUR',
        decimals: 2,
        address: '',
        peggedTo: 'EUR',
        protocol: 'sepa_eur'
      }
    ],
    nativeCurrency: {
      name: 'USD',
      symbol: 'USD',
      decimals: 2
    },
    rpcUrls: {
      default: { http: [] }
    },
    faucets: [],
    blockExplorers: {
      default: {
        name: '',
        url: ''
      }
    }
  },
  {
    ...arbitrum,
    compatibility: ChainCompatibility.EVM,
    shortName: 'ARB',
    supportedLocations: ['origin', 'target'],
    supportedTokens: [
      {
        symbol: 'USDT',
        address: '0xfd086bc7cd5c481dcc9c85ebe478a1c0b69fcbb9',
        decimals: 6,
        peggedTo: 'USD'
      },
      {
        symbol: 'USDC',
        address: '0xaf88d065e77c8cC2239327C5EDb3A432268e5831',
        decimals: 6,
        peggedTo: 'USD'
      }
    ]
  },
  {
    ...arbitrumSepolia,
    compatibility: ChainCompatibility.EVM,
    shortName: 'ARB',
    supportedLocations: ['origin', 'target'],
    supportedTokens: [
      {
        symbol: 'USDK',
        address: '0x2cf79df2879902a2fc06329b1760e0f2ad9a3a47',
        decimals: 18,
        peggedTo: 'USD'
      }
    ]
  },
  {
    ...avalanche,
    compatibility: ChainCompatibility.EVM,
    shortName: 'AVX',
    supportedLocations: ['origin', 'target'],
    supportedTokens: [
      {
        symbol: 'EURC',
        address: '0xC891EB4cbdEFf6e073e859e987815Ed1505c2ACD',
        decimals: 6,
        peggedTo: 'EUR'
      },
      {
        symbol: 'USDT',
        address: '0x9702230A8Ea53601f5cD2dc00fDBc13d4dF4A8c7',
        decimals: 6,
        peggedTo: 'USD'
      },
      {
        symbol: 'USDC',
        address: '0xB97EF9Ef8734C71904D8002F8b6Bc66Dd9c48a6E',
        decimals: 6,
        peggedTo: 'USD'
      }
    ]
  },
  {
    ...avalancheFuji,
    compatibility: ChainCompatibility.EVM,
    shortName: 'AVX',
    supportedLocations: ['origin', 'target'],
    supportedTokens: [
      {
        symbol: 'EURK',
        address: '0xd29ccaF2f4EEafF1f49cAF871AaeaF4780c67eF0',
        decimals: 18,
        peggedTo: 'EUR'
      },
      {
        symbol: 'USDK',
        address: '0x5d8598Ce65f15f14c58aD3a4CD285223c8e76a2E',
        decimals: 18,
        peggedTo: 'USD'
      }
    ]
  },
  {
    ...base,
    compatibility: ChainCompatibility.EVM,
    shortName: 'BASE',
    supportedLocations: ['origin', 'target'],
    supportedTokens: [
      {
        symbol: 'EURC',
        address: '0x60a3E35Cc302bFA44Cb288Bc5a4F316Fdb1adb42',
        decimals: 6,
        peggedTo: 'EUR'
      },
      {
        symbol: 'USDC',
        address: '0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913',
        decimals: 6,
        peggedTo: 'USD'
      }
    ]
  },
  {
    ...baseSepolia,
    compatibility: ChainCompatibility.EVM,
    shortName: 'BASE',
    supportedLocations: ['origin', 'target'],
    supportedTokens: [
      {
        symbol: 'USDK',
        address: '0x2B0F2060d358a2DF51dBc4147a09445b11EF5D41',
        decimals: 18,
        peggedTo: 'USD'
      },
      {
        symbol: 'EURK',
        address: '0xC9421eB9e4942cb156310Dcf218321D66de4f0D3',
        decimals: 18,
        peggedTo: 'EUR'
      }
    ]
  },
  {
    ...berachain,
    shortName: 'BERA',
    compatibility: ChainCompatibility.EVM,
    supportedLocations: ['target'],
    supportedTokens: [
      {
        symbol: 'HONEY',
        address: '0xFCBD14DC51f0A4d49d5E53C2E0950e0bC26d0Dce',
        decimals: 18,
        peggedTo: 'USD'
      }
    ]
  },
  {
    ...berachainBepolia,
    shortName: 'BERA',
    compatibility: ChainCompatibility.EVM,
    supportedLocations: ['target'],
    supportedTokens: [
      {
        symbol: 'USDK',
        address: '0xe5dB851969B4d8EE8A023F4b991CbED6e39dca80',
        decimals: 18,
        peggedTo: 'USD'
      }
    ]
  },
  {
    ...bsc,
    compatibility: ChainCompatibility.EVM,
    shortName: 'BSC',
    supportedLocations: ['origin', 'target'],
    supportedTokens: [
      {
        symbol: 'USDT',
        address: '0x55d398326f99059fF775485246999027B3197955',
        decimals: 6,
        peggedTo: 'USD'
      },
      {
        symbol: 'USDC',
        address: '0x8ac76a51cc950d9822d68b83fe1ad97b32cd580d',
        decimals: 6,
        peggedTo: 'USD'
      }
    ]
  },
  {
    ...bscTestnet,
    compatibility: ChainCompatibility.EVM,
    shortName: 'BSC',
    supportedLocations: ['origin', 'target'],
    supportedTokens: [
      {
        symbol: 'USDK',
        address: '0x3eb36be2c3FD244139756F681420637a2a9464e3',
        decimals: 18,
        peggedTo: 'USD'
      }
    ],
    faucets: ['https://testnet.bnbchain.org/faucet-smart']
  },
  // {
  //   id: 0,
  //   shortName: 'BTC',
  //   name: 'Bitcoin',
  //   supportedLocations: ['origin', 'target'],
  //   supportedTokens: [],
  //   compatibility: ChainCompatibility.BTC,
  //   rpcUrls: {
  //     default: { http: [] }
  //   },
  //   faucets: [],
  //   nativeCurrency: {
  //     name: 'Bitcoin',
  //     symbol: 'BTC',
  //     decimals: 8
  //   },
  //   blockExplorers: {
  //     default: {
  //       name: 'blockstream',
  //       url: 'https://blockstream.info'
  //     }
  //   }
  // },
  // {
  //   id: 0,
  //   name: 'Bitcoin Testnet',
  //   shortName: 'BTC',
  //   supportedTokens: [
  //     {
  //       id: '1',
  //       symbol: 'WBTC',
  //       address: 'NativeCoin'
  //     }
  //   ],
  //   compatibility: ChainCompatibility.BTC,
  //   supportedLocations: ['origin', 'target'],
  //   rpcUrls: {
  //     default: { http: [] }
  //   },
  //   faucets: [],
  //   nativeCurrency: {
  //     name: 'Bitcoin',
  //     symbol: 'BTC',
  //     decimals: 8
  //   },
  //   blockExplorers: {
  //     default: {
  //       name: 'blockstream',
  //       url: 'https://blockstream.info/testnet/'
  //     }
  //   },
  //   testnet: true
  // },
  {
    ...confluxESpace,
    compatibility: ChainCompatibility.EVM,
    shortName: 'CFX',
    supportedLocations: ['origin', 'target'],
    supportedTokens: [
      {
        symbol: 'USDT',
        address: '0xfe97e85d13abd9c1c33384e796f10b73905637ce',
        decimals: 18,
        peggedTo: 'USD'
      },
      {
        symbol: 'USDC',
        address: '0x6963efed0ab40f6c3d7bda44a05dcf1437c44372',
        decimals: 18,
        peggedTo: 'USD'
      }
    ]
  },
  {
    ...confluxESpaceTestnet,
    compatibility: ChainCompatibility.EVM,
    shortName: 'CFX',
    supportedLocations: ['origin', 'target'],
    supportedTokens: [
      {
        symbol: 'USDK',
        address: '0xb16de57a9c4d28cfe7ce2ab87ee4a4debd643cd1',
        decimals: 18,
        peggedTo: 'USD'
      }
    ]
  },
  {
    ...mainnet,
    shortName: 'ETH',
    compatibility: ChainCompatibility.EVM,
    supportedLocations: ['origin', 'target'],
    supportedTokens: [
      {
        symbol: 'EURC',
        address: '0x1aBaEA1f7C830bD89Acc67eC4af516284b1bC33c',
        decimals: 6,
        peggedTo: 'EUR'
      },
      {
        symbol: 'USDT',
        address: '0xdAC17F958D2ee523a2206206994597C13D831ec7',
        decimals: 6,
        peggedTo: 'USD'
      },
      {
        symbol: 'USDC',
        address: '0xa0b86991c6218b36c1d19d4a2e9eb0ce3606eb48',
        decimals: 6,
        peggedTo: 'USD'
      }
    ]
  },
  {
    ...sepolia,
    name: 'Ethereum Sepolia',
    shortName: 'ETH',
    compatibility: ChainCompatibility.EVM,
    supportedLocations: ['origin', 'target'],
    supportedTokens: [
      {
        symbol: 'EURK',
        address: '0x6B8Db7F19Be371fCFeE7a695b1438690518d4E13',
        decimals: 18,
        peggedTo: 'EUR'
      },
      {
        symbol: 'USDK',
        address: '0x5FF59Bf2277A1e6bA9bB8A38Ea3F9ABfd3d9345a',
        decimals: 18,
        peggedTo: 'USD'
      }
      // {
      //   symbol: 'WBTC',
      //   address: '0x5703992Cd91cAB655f2BF3EcbD4cD22e3c75832D',
      //   decimals: 8
      // }
    ]
  },
  {
    ...optimism,
    shortName: 'OPT',
    compatibility: ChainCompatibility.EVM,
    supportedLocations: ['origin', 'target'],
    supportedTokens: [
      {
        symbol: 'USDT',
        address: '0x94b008aa00579c1307b0ef2c499ad98a8ce58e58',
        decimals: 6,
        peggedTo: 'USD'
      },
      {
        symbol: 'USDC',
        address: '0x0b2C639c533813f4Aa9D7837CAf62653d097Ff85',
        decimals: 6,
        peggedTo: 'USD'
      }
    ]
  },
  {
    ...optimismSepolia,
    shortName: 'OPT',
    compatibility: ChainCompatibility.EVM,
    supportedLocations: ['origin', 'target'],
    supportedTokens: [
      {
        symbol: 'USDK',
        address: '0x2cf79df2879902a2fc06329b1760e0f2ad9a3a47',
        decimals: 18,
        peggedTo: 'USD'
      }
    ]
  },
  {
    ...polygon,
    shortName: 'POL',
    compatibility: ChainCompatibility.EVM,
    supportedLocations: ['origin', 'target'],
    supportedTokens: [
      {
        symbol: 'USDT',
        address: '0xc2132d05d31c914a87c6611c10748aeb04b58e8f',
        decimals: 6,
        peggedTo: 'USD'
      },
      {
        symbol: 'USDC',
        address: '0x3c499c542cEF5E3811e1192ce70d8cC03d5c3359',
        decimals: 6,
        peggedTo: 'USD'
      }
    ]
  },
  {
    ...polygonAmoy,
    shortName: 'POL',
    compatibility: ChainCompatibility.EVM,
    supportedLocations: ['origin', 'target'],
    supportedTokens: [
      {
        symbol: 'USDK',
        address: '0x30171cfb10ed578814a22475a190306776bc8392',
        decimals: 18,
        peggedTo: 'USD'
      }
      // {
      //   symbol: 'WBTC',
      //   address: '0x66E1537e2A62168Ca19Bf5b6e2E66b5C806b8ab1',
      //   decimals: 8
      // }
    ]
  },
  {
    id: 101,
    name: 'Solana',
    shortName: 'SOL',
    compatibility: ChainCompatibility.SELF,
    supportedLocations: ['origin', 'target'],
    supportedTokens: [
      {
        symbol: 'EURC',
        address: 'HzwqbKZw8HxMN6bF2yFZNrht3c2iXXzpKcFu7uBEDKtr',
        decimals: 6,
        peggedTo: 'EUR'
      },
      {
        symbol: 'USDT',
        address: 'Es9vMFrzaCERmJfrF4H2FYD4KCoNkY11McCe8BenwNYB',
        decimals: 6,
        peggedTo: 'USD'
      },
      {
        symbol: 'USDC',
        address: 'EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v',
        decimals: 6,
        peggedTo: 'USD'
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
    name: 'Solana Devnet',
    shortName: 'SOL',
    compatibility: ChainCompatibility.SELF,
    supportedLocations: ['origin', 'target'],
    supportedTokens: [
      {
        symbol: 'EURK',
        address: '4X7SWEPfa8e1fhSseJQBK7rNPqnniePLffCJMGvEDh9u',
        decimals: 9,
        peggedTo: 'EUR'
      },
      {
        symbol: 'USDK',
        address: '9YSFWfU9Ram6mAo2QP9zsTnA8yFkkkFGEs3kGgjtQKvp',
        decimals: 6,
        peggedTo: 'USD'
      }
    ],
    rpcUrls: {
      default: { http: ['https://api.devnet.solana.com'] }
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
    },
    testnet: true
  },
  {
    ...tron,
    shortName: 'TRX',
    compatibility: ChainCompatibility.SELF,
    supportedLocations: ['origin', 'target'],
    blockExplorers: {
      default: {
        name: 'Tronscan',
        url: 'https://tronscan.org/#',
        apiUrl: 'https://apilist.tronscanapi.com/api'
      }
    },
    supportedTokens: [
      {
        symbol: 'USDT',
        address: 'TR7NHqjeKQxGTCi8q8ZY4pL8otSzgjLj6t',
        decimals: 6,
        peggedTo: 'USD'
      }
    ]
  },
  {
    id: 3448148188,
    name: 'Tron Nile',
    shortName: 'TRX',
    compatibility: ChainCompatibility.SELF,
    supportedLocations: ['origin', 'target'],
    supportedTokens: [
      {
        symbol: 'USDK',
        address: 'TEuRmCALTUY2syY1EE6mMYnyfmNfFfMpYz',
        decimals: 18,
        peggedTo: 'USD'
      }
    ],
    nativeCurrency: {
      name: 'TRON',
      symbol: 'TRX',
      decimals: 10
    },
    rpcUrls: { default: { http: ['https://api.nileex.io/jsonrpc'] } },
    faucets: ['http://nileex.io/join/getJoinPage'],
    blockExplorers: {
      default: {
        name: 'Tronscan',
        url: 'https://nile.tronscan.org'
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
  //   supportedLocations: ['origin', 'target'],
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
  //   },
  //   testnet: true
  // }
] satisfies Chain[]
