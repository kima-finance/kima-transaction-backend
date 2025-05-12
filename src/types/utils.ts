import { z } from "zod"

export const jsonStringToObject = z.string().transform((val, ctx) => {
    try {
      const parsed = JSON.parse(val)
      return parsed
    } catch (e) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: 'Invalid JSON string'
      })
      return z.NEVER
    }
  })
