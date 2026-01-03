import process from 'node:process'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import validateEnvironmentVariables from '../../src/utils/validate-environment-variables'

describe('validateEnvironmentVariables', () => {
  const originalEnv = { ...process.env }

  // Updated list matching the new implementation
  const requiredEnvironmentVariables = [
    'NODE_ENV',
    'PORT',
    'MONGODB_URI',
    'ALLOWED_ORIGIN',
    'SIGNUP_KEY',
    'JWT_SECRET',
  ]

  beforeEach(() => {
    vi.resetModules()
    process.env = { ...originalEnv }

    // Spy on console and process.exit
    vi.spyOn(console, 'info').mockImplementation(() => {})
    vi.spyOn(console, 'error').mockImplementation(() => {})
    vi.spyOn(process, 'exit').mockImplementation(() => {
      throw new Error('process.exit called') // Prevent actual exit during tests
    })
  })

  afterEach(() => {
    process.env = originalEnv
    vi.restoreAllMocks()
  })

  it('should log success if all required variables are present', () => {
    // Fill all required variables
    for (const key of requiredEnvironmentVariables) {
      process.env[key] = 'test-value'
    }

    validateEnvironmentVariables()

    expect(console.info).toHaveBeenCalledWith(
      '✅ All required environment variables are correctly defined.',
    )
    expect(process.exit).not.toHaveBeenCalled()
  })

  it('should exit and log error if a variable is missing', () => {
    // We leave process.env empty or missing at least one key
    delete process.env.JWT_SECRET

    // We catch the error thrown by our mock to simulate exit
    expect(() => validateEnvironmentVariables()).toThrow('process.exit called')

    expect(console.error).toHaveBeenCalledWith(
      '❌ [CRITICAL] Missing environment variables:',
    )
    expect(process.exit).toHaveBeenCalledWith(1)
  })
})
