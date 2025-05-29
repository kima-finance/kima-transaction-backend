import os from 'os'
import * as Sentry from '@sentry/node'
// import { getCreatorAddress } from '@kimafinance/kima-transaction-api'
import { isProd } from './constants'
import { ENV } from './env-validate'

export const getStaticSentryConfig = () => {
  return {
    dsn: ENV.SENTRY_DSN,
    environment: ENV.NODE_ENV,

    // set this to true to troubleshoot Sentry config issues, you'll see verbose logs
    debug: false,

    // error reporting rate: 1.0 means 100% of errors are sent to Sentry
    sampleRate: ENV.SENTRY_SAMPLE_RATE,

    // Setting this option to true will send default PII data to Sentry.
    // For example, automatic IP address collection on events
    sendDefaultPii: false
  }
}

if (isProd && ENV.SENTRY_DSN) {
  console.info(`Calling Sentry init with sample rate ${ENV.SENTRY_SAMPLE_RATE}`)
  Sentry.init({
    ...getStaticSentryConfig(),

    // this should match the version in package.json
    // please update it when a new version is released
    // so Sentry can track bugs based on the version
    release: '1.3.2',

    beforeSend(event) {
      const host = os.hostname()
      if (['localhost', '127.0.0.1', '::1', 'internal'].includes(host)) {
        console.warn('Sentry:beforeSend: dropping event from local host', event)
        return null
      }

      // explicity remove user data from event to avoid sending PII
      delete event.user

      // add info to help identify events from legit sources
      event.tags = {
        ...event.tags,
        // TODO: adding creator would be nice but it makes this async
        // creator: await getCreatorAddress(),
        source: 'kima-transaction-backend',
        host
      }
      return event
    }
  })
} else {
  console.info('Sentry init disabled')
}
