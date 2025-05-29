import * as Sentry from '@sentry/node'
import { isProd } from './constants'
import { ENV } from './env-validate'

if (isProd && ENV.SENTRY_DSN) {
  console.info(`Calling Sentry init with sample rate ${ENV.SENTRY_SAMPLE_RATE}`)
  Sentry.init({
    dsn: ENV.SENTRY_DSN,
    environment: ENV.NODE_ENV,
    
    // this should match the version in package.json
    // please update it when a new version is released
    // so Sentry can track bugs based on the version
    release: '1.3.2',

    // set this to true to troubleshoot Sentry issues, you'll see verbose logs
    debug: false,

    // error reporting rate: 1.0 means 100% of errors are sent to Sentry
    sampleRate: ENV.SENTRY_SAMPLE_RATE,

    // Setting this option to true will send default PII data to Sentry.
    // For example, automatic IP address collection on events
    sendDefaultPii: false,

    // explicity remove user data from event to avoid sending PII
    beforeSend(event) {
      delete event.user
      return event
    }
  })
} else {
  console.info('Sentry init disabled')
}
