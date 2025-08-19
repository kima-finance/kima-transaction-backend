import { ENV } from "../env-validate"
import { ChainsService } from "./chains.service"

export const chainsService = new ChainsService(
  ENV.KIMA_ENVIRONMENT,
  ENV.KIMA_CHAIN_FILTER
)