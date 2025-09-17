import 'dotenv/config'
import { z } from 'zod'
import { ChainEnv } from './types/chain-env'
import { jsonStringToObject } from '@shared/types/utils'
import { filterConfigSchema } from '@features/chains/types/chain'

const envSchema = z.object({
  COMPLIANCE_URL: z.string().url().optional(),
  DEPASIFY_API_KEY: z.string().optional(),
  DOMAIN: z.string({ required_error: 'DOMAIN ENV var is required' }),
  KIMA_BACKEND_MNEMONIC: z
    .string({ required_error: 'KIMA_BACKEND_MNEMONIC ENV var is required' })
    .min(1),
  KIMA_BACKEND_FEE_URL: z
    .string({ required_error: 'KIMA_BACKEND_FEE_URL ENV var is required' })
    .url(),
  KIMA_BACKEND_NODE_PROVIDER: z
    .string({
      required_error: 'KIMA_BACKEND_NODE_PROVIDER ENV var is required'
    })
    .url(),
  KIMA_BACKEND_NODE_PROVIDER_QUERY: z
    .string({
      required_error: 'KIMA_BACKEND_NODE_PROVIDER_QUERY ENV var is required'
    })
    .url(),
  KIMA_ENVIRONMENT: z.nativeEnum(ChainEnv, {
    required_error: 'KIMA_ENVIRONMENT ENV var is required'
  }),
  KIMA_EXPLORER: z
    .string({ required_error: 'KIMA_EXPLORER ENV var is required' })
    .url(),
  KIMA_CHAIN_FILTER: jsonStringToObject.pipe(filterConfigSchema).optional(),
  NODE_ENV: z
    .enum(['development', 'test', 'production'])
    .default('development')
    .optional(),
  PORT: z.coerce.number().default(3000),
  PAYMENT_PARTNER_ID: z.string().optional(),
  LOG_LEVEL: z
    .enum(['fatal', 'error', 'warn', 'info', 'debug', 'trace', 'silent'])
    .optional()
})

export type Environment = z.infer<typeof envSchema>

export const ENV = envSchema.parse(process.env)
export default ENV
