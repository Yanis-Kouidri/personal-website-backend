import process from 'node:process'

/**
 * Middleware to validate the request body against a Zod schema.
 * It strips unknown fields (if configured in schema) and ensures type safety.
 * * @param {import('zod').ZodSchema} schema - The validation schema.
 */
export const validateBody = (schema) => {
  return (request, response, next) => {
    const result = schema.safeParse(request.body)

    if (!result.success) {
      // Log detailed errors in non-production environments for easier debugging
      if (process.env.NODE_ENV !== 'production') {
        console.warn(
          '[Validation Error]:',
          JSON.stringify(result.error.format(), null, 2),
        )
      }

      /**
       * In a public API, it's helpful to provide which fields failed
       * without leaking internal system details.
       */
      return response.status(400).json({
        status: 'error',
        message: 'Validation failed',
        errors: result.error.flatten().fieldErrors, // Returns structured field-specific errors
      })
    }

    /**
     * Security: Overwrite request.body with the parsed and cleaned data.
     * This prevents 'Mass Assignment' vulnerabilities by stripping
     * any fields not defined in the schema.
     */
    request.body = result.data

    return next()
  }
}
