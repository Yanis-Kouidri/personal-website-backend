import process from 'node:process'

/**
 * Validates that all required environment variables are present.
 * If any are missing, the process exits immediately to prevent
 * unstable application states.
 */
function validateEnvironmentVariables() {
  const requiredEnvironmentVariables = [
    'NODE_ENV',
    'PORT',
    'MONGODB_URI',
    'ALLOWED_ORIGIN',
    'SIGNUP_KEY',
    'JWT_SECRET',
  ]

  const missingEnvironmentVariables = requiredEnvironmentVariables.filter(
    (variable) => !process.env[variable],
  )

  if (missingEnvironmentVariables.length > 0) {
    console.error('❌ [CRITICAL] Missing environment variables:')
    console.error(`Please define: ${missingEnvironmentVariables.join(', ')}`)
    console.error(
      'The application cannot start without these configurations. Exiting...',
    )

    // Stop the process with failure code
    process.exit(1)
  }

  console.info('✅ All required environment variables are correctly defined.')
}

export default validateEnvironmentVariables
