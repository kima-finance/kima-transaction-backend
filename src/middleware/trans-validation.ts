import { body } from 'express-validator'

// reusable validation for transaction details
export const createTransValidation = () => [
  body('amount')
    .isFloat({ gt: 0 })
    .withMessage('amount must be greater than 0'),
  body('fee').isFloat({ gt: 0 }).withMessage('fee must be greater than 0'),
  body('originAddress').notEmpty(),
  body('originChain').notEmpty(),
  body('originSymbol').notEmpty(),
  body('targetAddress').notEmpty(),
  body('targetChain').notEmpty(),
  body('targetSymbol').notEmpty()
]
