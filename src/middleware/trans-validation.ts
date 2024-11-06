import { body } from 'express-validator'

export const createTransValidation = () => [
  body('amount')
    .isFloat({ gt: 0 })
    .withMessage('amount must be greater than 0'),
  body('fee').isFloat({ gt: 0 }).withMessage('fee must be greater than 0'),
  body('originAddress').isString().notEmpty(),
  body('originChain').isString().notEmpty(),
  body('originSymbol').isString().notEmpty(),
  body('targetAddress').isString().notEmpty(),
  body('targetChain').isString().notEmpty(),
  body('targetSymbol').isString().notEmpty()
]
