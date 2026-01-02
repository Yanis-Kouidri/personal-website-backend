import { jwtVerify } from 'jose'
import { TOKEN_COOKIE_NAME } from '../controllers/authentication.js'

async function authentication(request, response, next) {
  const token = request.cookies[TOKEN_COOKIE_NAME]

  if (!token) {
    return response
      .status(401)
      .json({ message: 'You must be log-in to access this page' })
  }

  try {
    // On encode le secret ici pour être sûr d'avoir la valeur à jour de process.env
    const secret = new TextEncoder().encode(process.env.NODE_JS_JWT_SECRET)
    const { payload } = await jwtVerify(token, secret)

    request.tokenData = payload
    next()
  } catch (error) {
    // Si on arrive ici, request.tokenData n'est pas défini, d'où ton erreur de test
    return response.status(401).json({
      message: 'Invalid or expired token',
      error: error.code,
    })
  }
}

export default authentication
