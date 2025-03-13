import app from './app'
import { ENV } from './env-validate'

const port = ENV.PORT || 3001

// shim for bigint
// eslint-disable-next-line @typescript-eslint/no-unsafe-member-access, @typescript-eslint/no-explicit-any
;(BigInt.prototype as any).toJSON = function () {
  // eslint-disable-next-line @typescript-eslint/no-unsafe-return, @typescript-eslint/no-unsafe-member-access, @typescript-eslint/no-unsafe-call
  return this.toString()
}

const server = app.listen(port, () => {
  console.log(`⚡️[server]: Server is running at http://localhost:${port}`)
})

process.on('uncaughtException', function (err) {
  console.log('Caught exception by catch all: ' + err)
})

// // graceful shutdown
// const onShutdown = () => {
//   console.log('Shutting down')
//   server.close(() => {
//     console.log('Server closed. Exiting process')
//     process.exit(0)
//   })
// }

// process.on('SIGTERM', onShutdown)
// process.on('SIGINT', onShutdown)