export class AppError extends Error {
  code?: string
  status?: number
  cause?: unknown

  constructor(
    message: string,
    opts: { code?: string; status?: number; cause?: unknown } = {}
  ) {
    super(message)
    this.name = 'AppError'
    this.code = opts.code
    this.status = opts.status
    this.cause = opts.cause
  }
}

export class HttpError extends AppError {
  constructor(
    status: number,
    message: string,
    opts?: { code?: string; cause?: unknown }
  ) {
    super(message, { ...opts, status })
    this.name = 'HttpError'
  }
}

export function errorToObject(err: unknown) {
  if (err instanceof Error) {
    const anyErr = err as any
    return {
      name: err.name,
      message: err.message,
      stack: err.stack,
      code: anyErr?.code,
      status: anyErr?.status,
      cause: anyErr?.cause
    }
  }
  return { error: err }
}
