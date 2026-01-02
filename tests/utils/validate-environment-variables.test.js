// tests/validateEnvironmentVariables.test.js
import validateEnvironmentVariables from '../../src/utils/validate-environment-variables'

describe('validateEnvironmentVariables', () => {
  const originalEnvironment = process.env
  const requiredEnvironmentVariables = [
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

  beforeEach(() => {
    vi.resetModules() // reset dotenv config if used
    process.env = { ...originalEnvironment } // clone env
    vi.spyOn(console, 'log').mockImplementation(() => {})
    vi.spyOn(console, 'error').mockImplementation(() => {})
  })

  afterEach(() => {
    process.env = originalEnvironment
    vi.restoreAllMocks()
  })

  it('should log success if all env variables are present', () => {
    for (const key of requiredEnvironmentVariables) {
      process.env[key] = 'test'
    }

    validateEnvironmentVariables()

    expect(console.log).toHaveBeenCalledWith(
      'All required environment variables are defined.',
    )
    expect(console.error).not.toHaveBeenCalled()
  })
})
