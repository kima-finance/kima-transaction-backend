import ENV from 'core/env'
import ChainsService from './chains.service'

const chainsService = new ChainsService(
  ENV.KIMA_ENVIRONMENT,
  ENV.KIMA_CHAIN_FILTER
)

export default chainsService
export { chainsService }
