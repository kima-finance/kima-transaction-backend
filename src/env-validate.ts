import 'dotenv/config'
import { z } from 'zod'
import { ChainEnv } from './types/chain-env'
import { jsonStringToObject } from './types/utils'
import { filterConfigSchema } from './types/chain'

const envSchema = z.object({
  // (Optional) Enables address compliance checks for blacklisted addresses
  // transactions containing an addresses with risk score above "low" will be rejected
  COMPLIANCE_URL: z.string().url().optional(),

  // (Optional) Fiat, KYC
  // Related endpoints will return 403 when not set
  DEPASIFY_API_KEY: z.string().optional(),

  // CORS whitelist urls
  DOMAIN: z.string({ required_error: 'DOMAIN ENV var is required' }),

  // Wallet used for Kima transactions
  KIMA_BACKEND_MNEMONIC: z
    .string({
      required_error: 'KIMA_BACKEND_MNEMONIC ENV var is required'
    })
    .min(1),

  // Kima Fee Calculation Service url
  KIMA_BACKEND_FEE_URL: z
    .string({
      required_error: 'KIMA_BACKEND_FEE_URL ENV var is required'
    })
    .url(),

  // Kima RPC url for Kima transactions
  KIMA_BACKEND_NODE_PROVIDER: z
    .string({
      required_error: 'KIMA_BACKEND_NODE_PROVIDER ENV var is required'
    })
    .url(),

  // Kima API url
  KIMA_BACKEND_NODE_PROVIDER_QUERY: z
    .string({
      required_error: 'KIMA_BACKEND_NODE_PROVIDER_QUERY ENV var is required'
    })
    .url(),

  // mainnet, testnet: determines which chains are returned
  // also used by the frontend by calling /chains/env
  KIMA_ENVIRONMENT: z.nativeEnum(ChainEnv, {
    required_error: 'KIMA_ENVIRONMENT ENV var is required'
  }),

  // Kima Explorer url
  // used by the frontend by calling /chains/env
  KIMA_EXPLORER: z
    .string({
      required_error: 'KIMA_EXPLORER ENV var is required'
    })
    .url(),

  // Chain filtering (Optional)
  // Determines which chains are returned by the /chains endpoints
  // Effects chain validation and fee calculation
  KIMA_CHAIN_FILTER: jsonStringToObject.pipe(filterConfigSchema).optional(),

  // Node environment
  NODE_ENV: z
    .enum(['development', 'test', 'production'])
    .default('development')
    .optional(),

  // Port the server will listen on
  PORT: z.coerce.number().default(3000),

  // Required for credit card transactions only
  PAYMENT_PARTNER_ID: z.string().optional()
})

export type Environment = z.infer<typeof envSchema>

export const ENV = envSchema.parse(process.env)
