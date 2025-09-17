import ENV from 'core/env'
import pino from 'pino'

const isDev = ENV.NODE_ENV !== 'production'
const level =
  (process.env.LOG_LEVEL as pino.LevelWithSilent) || (isDev ? 'debug' : 'info')

const transport = isDev
  ? {
      target: 'pino-pretty',
      options: {
        colorize: true,
        translateTime: 'SYS:standard',
        ignore: 'pid,hostname'
      }
    }
  : undefined

const logger = pino({
  level,
  transport,
  redact: {
    paths: [
      'req.headers.authorization',
      'headers.authorization',
      'body.password',
      'body.mnemonic',
      'body.privateKey',
      'EVM_PRIVATE_KEY',
      'SOL_PRIVATE_KEY',
      'TRX_PRIVATE_KEY'
    ],
    remove: true
  }
})

export default logger
