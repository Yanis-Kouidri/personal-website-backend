export function validateBody(schema) {
  return (request, response, next) => {
    const result = schema.safeParse(request.body)
    if (!result.success) {
      // Option: log erreur détaillée en dev
      if (process.env.NODE_ENV !== 'production') {
        console.warn('Validation error:', result.error.format())
      }

      return response.status(400).json({ message: 'Invalid input' })
    }

    // Remplace le body original par le body validé
    request.body = result.data
    next()
  }
}
