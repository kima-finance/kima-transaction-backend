import { Request } from 'express'
import { TransactionDetails } from './types/transaction-details'

interface SubmitTransRequest extends Request {
  body: TransactionDetails
}

/**
 * Custom transaction validation
 * Put any validation specific to your app here.
 *   i.e. In a payment scenario checking if the target address is your
 *   app's payment address.
 *
 * Basic param validation will ensure all the expected params exist
 * before calling this function.
 *
 * Return an error message or the empty string
 *
 * @param {SubmitTransRequest} req
 * @returns {Promise<string>} Returns an error message or the empty string
 */
export const customTransValidation = async (
  req: SubmitTransRequest
): Promise<string> => {
  // Example: check if the target address is your app's payment address
  // const { targetAddress } = req.body
  // if (targetAddress !== process.env.PAYMENT_ADDRESS as string) {
  //   return 'invalid target address'
  // }

  // TODO: add any custom validation for transaction details here
  return ''
}
