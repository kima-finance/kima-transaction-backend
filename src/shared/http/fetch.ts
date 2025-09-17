import getLogger from '@lib/request-context'

type FetchMethod = 'GET' | 'POST'
type JSONValue = unknown

export type FetchError = { status: number; error: unknown }

const DEFAULT_TIMEOUT_MS = 15000
const RETRIES = 1

const parseBody = async <T>(res: Response): Promise<T | string> => {
  const text = await res.text()
  try {
    return JSON.parse(text) as T
  } catch {
    return text
  }
}

const withTimeout = (timeoutMs: number) => {
  const controller = new AbortController()
  const id = setTimeout(() => controller.abort(), timeoutMs)
  return { signal: controller.signal, clear: () => clearTimeout(id) }
}

const doRequest = async <T>(
  url: string,
  init: RequestInit,
  timeoutMs = DEFAULT_TIMEOUT_MS,
  retries = RETRIES
): Promise<T> => {
  const logger = getLogger()
  let attempt = 0
  // eslint-disable-next-line no-constant-condition
  while (true) {
    const t = withTimeout(timeoutMs)
    try {
      const res = await fetch(url, { ...init, signal: t.signal })
      const data = await parseBody<T>(res)
      if (!res.ok) {
        const err: FetchError = {
          status: res.status,
          error: data || res.statusText
        }
        logger.error({ url, status: res.status, body: data }, 'http error')
        throw err
      }
      return data as T
    } catch (err) {
      t.clear()
      attempt += 1
      const isAbort = err instanceof DOMException && err.name === 'AbortError'
      const isFetchErr = (err as FetchError)?.status !== undefined
      const canRetry = attempt <= retries && (isAbort || isFetchErr)

      getLogger().error({ url, attempt, err }, 'http request failed')
      if (!canRetry) throw err
    }
  }
}

const buildHeaders = (token?: string, extras?: Record<string, string>) => ({
  'Content-Type': 'application/json',
  ...(token ? { Authorization: `${token}` } : {}),
  ...(extras ?? {})
})

const get = <T = JSONValue>(
  url: string,
  token?: string,
  headers?: Record<string, string>
) => doRequest<T>(url, { method: 'GET', headers: buildHeaders(token, headers) })

const post = <T = JSONValue>(
  url: string,
  body: unknown,
  token?: string,
  headers?: Record<string, string>
) =>
  doRequest<T>(url, {
    method: 'POST',
    headers: buildHeaders(token, {
      Accept: 'application/json',
      ...(headers ?? {})
    }),
    body: JSON.stringify(body)
  })

export const fetchWrapper = { get, post }
export default fetchWrapper
