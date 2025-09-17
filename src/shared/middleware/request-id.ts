import { randomUUID } from 'node:crypto'
import type { NextFunction, Request, Response } from 'express'
import { runWithRequestContext } from '../../lib/request-context'

const HEADER = 'x-request-id'

const requestId = (req: Request, res: Response, next: NextFunction) => {
  const existing =
    (req.headers[HEADER] as string | undefined) ||
    res.getHeader(HEADER)?.toString()
  const id = existing || randomUUID()
  res.setHeader(HEADER, id)

  runWithRequestContext(id, () => next())
}

export default requestId
