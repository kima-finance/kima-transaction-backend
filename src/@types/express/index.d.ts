import 'pino-http'

declare module 'http' {
  interface IncomingMessage {
    log: import('pino').Logger
  }
}
export {}
