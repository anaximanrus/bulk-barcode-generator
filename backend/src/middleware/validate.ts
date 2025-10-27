import type { Request, Response, NextFunction } from 'express'
import type { ZodSchema } from 'zod'

/**
 * Validate request body against Zod schema
 */
export const validateRequest = (schema: ZodSchema) => {
  return (req: Request, res: Response, next: NextFunction) => {
    try {
      const result = schema.safeParse(req.body)

      if (!result.success) {
        const errors = result.error.issues.map((issue) => ({
          path: issue.path.join('.'),
          message: issue.message,
        }))

        return res.status(400).json({
          success: false,
          error: 'Validation failed',
          details: errors,
        })
      }

      // Attach validated data to request
      req.body = result.data
      next()
    } catch (error) {
      console.error('Validation error:', error)
      return res.status(500).json({
        success: false,
        error: 'Internal server error during validation',
      })
    }
  }
}
