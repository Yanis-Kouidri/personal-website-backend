export const validateBody = (schema) => {
  return (request, response, next) => {
    const result = schema.safeParse(request.body)
    if (!result.success) {
      // Option: log detailed error in dev
      if (process.env.NODE_ENV !== 'production') {
        console.warn('Validation error:', result.error.format())
      }

      return response.status(400).json({ message: 'Invalid input' })
    }

    // Replace the original body with the validated body
    request.body = result.data
    next()
  }
}
