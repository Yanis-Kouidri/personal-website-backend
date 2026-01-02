export default function jsonErrorHandler(error, _request, response, next) {
  if (error instanceof SyntaxError && error.status === 400 && 'body' in error) {
    console.error('Malformed JSON:', error.message)
    return response.status(400).json({ message: 'Invalid JSON' })
  }
  next(error)
}
