import { AsyncLocalStorage } from 'async_hooks'
import logger from './logger'

type Store = { requestId: string }

const als = new AsyncLocalStorage<Store>()

export const runWithRequestContext = (requestId: string, fn: () => void) => {
  als.run({ requestId }, fn)
}

export const getRequestId = (): string | undefined => als.getStore()?.requestId

export const getLogger = () => {
  const requestId = getRequestId()
  return requestId ? logger.child({ requestId }) : logger
}

export default getLogger
