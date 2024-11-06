import supertest, { Response } from 'supertest'
import { testAgent } from '../config'
import { TransactionDetails } from '../../types/transaction-details'
import TestAgent from 'supertest/lib/agent'

/**
 * Get the cookie from the response
 *
 * @param {Response} res
 * @returns {string}
 */
export const getCookieFromRes = (res: Response) => {
  return res.headers['set-cookie'][0]
}

/**
 * Parse the cookie to retrieve the auth token
 *
 * @param {string} cookie
 * @returns {string}
 */
export const getTokenFromCookie = (cookie: string): string => {
  const cookieParts = cookie.split(';')
  const token = cookieParts[0].split('=')[1]
  return token
}

/**
 * Get the auth token from the request cookie
 *
 * @param {Response} res
 * @returns {string}
 */
export const getTokenFromReqCookie = (res: Response): string => {
  const cookie = getCookieFromRes(res)
  return getTokenFromCookie(cookie)
}

export const generateTransDetails = (data?: Partial<TransactionDetails>) => {
  return {
    amount: 100,
    fee: 0.5,
    originAddress: '0xDD4c48C0B24039969fC16D1cdF626eaB821d3384',
    originChain: 'ETH',
    originSymbol: 'USDK',
    targetAddress: '0x001474b877f98f41701397a65d4d313ab180c7b2',
    targetChain: 'POL',
    targetSymbol: 'USDK',
    ...data
  }
}

export interface TestAuthOutput {
  cookie: string
  payload: TransactionDetails
  testAgent: TestAgent
  token: string
}

/**
 * Authenticate then return the cookie
 *
 * @async
 * @param {TransactionDetails} payload
 * @returns {Promise<TestAuthOutput>}
 */
export const useTestAuth = async (
  data?: Partial<TransactionDetails>
): Promise<TestAuthOutput> => {
  const payload = generateTransDetails(data)
  const res = await testAgent
    .post('/auth')
    .send(payload)
    .expect('set-cookie', /authToken/)

  expect(res.status).toEqual(200)
  expect(res.text).toEqual('ok')

  const cookie = getCookieFromRes(res)
  const token = getTokenFromCookie(cookie)

  return {
    cookie,
    payload,
    testAgent,
    token
  }
}
