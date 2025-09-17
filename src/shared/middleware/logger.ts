import pinoHttp from 'pino-http'
import type { IncomingMessage, ServerResponse } from 'http'
import { randomUUID } from 'node:crypto'
import logger from '../../lib/logger'

const httpLogger = pinoHttp({
  logger,
  autoLogging: {
    // don’t log health checks or swagger UI
    ignore: (req: IncomingMessage) => {
      const url = req.url || ''
      return url === '/health' || url.startsWith('/docs')
    }
  },
  genReqId: (_req: IncomingMessage, res: ServerResponse) => {
    const hdr = res.getHeader('x-request-id')
    const fromRes = Array.isArray(hdr) ? hdr[0] : hdr
    return fromRes ? String(fromRes) : randomUUID()
  },
  customLogLevel: (_req, res, err) => {
    if (err || res.statusCode >= 500) return 'error'
    if (res.statusCode >= 400) return 'warn'
    return 'info'
  },
  serializers: {
    req: (req) => ({ method: req.method, url: req.url }),
    res: (res) => ({ statusCode: res.statusCode })
  }
})

export default httpLogger
