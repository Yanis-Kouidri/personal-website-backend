import dotenv from 'dotenv'

function validateEnv() {
  // Load environment variables from the .env file
  dotenv.config()

  const requiredEnvVars = [
    'NODE_JS_MONGODB_USERNAME',
    'NODE_JS_MONGODB_PASSWORD',
    'NODE_JS_MONGODB_ADDRESS',
    'NODE_JS_MONGODB_PORT',
    'NODE_JS_MONGODB_DATABASE',
    'NODE_JS_FRONTEND_URL',
    'NODE_JS_FRONTEND_PORT',
    'NODE_ENV',
    'NODE_JS_PORT',
    'NODE_JS_SIGN_UP_KEY',
    'NODE_JS_JWT_SECRET',
  ]

  const missingEnvVars = requiredEnvVars.filter(
    (envVar) => !process.env[envVar]
  )

  if (missingEnvVars.length > 0) {
    console.error(
      `WARN: The following environment variables are missing or not defined: ${missingEnvVars.join(', ')}`
    )
  } else {
    console.log('All required environment variables are defined.')
  }
}

export default validateEnv
