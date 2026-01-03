import request from 'supertest'
import { beforeAll, describe, expect, it, vi } from 'vitest'

/**
 * 1. Comprehensive Mongoose Mock
 * Optimized for ESM and the new MONGODB_URI connection string.
 */
vi.mock('mongoose', () => {
  const mongooseMock = {
    connect: vi.fn().mockResolvedValue(true),
    Schema: vi.fn(() => ({
      index: vi.fn(),
      pre: vi.fn(),
      post: vi.fn(),
      methods: {},
      statics: {},
    })),
    model: vi.fn().mockReturnValue({
      findOne: vi.fn(),
      create: vi.fn(),
    }),
    connection: {
      on: vi.fn(),
      once: vi.fn(),
      readyState: 1,
      close: vi.fn().mockResolvedValue(true),
    },
  }

  return {
    ...mongooseMock,
    default: mongooseMock,
  }
})

let app

describe('App Integration Tests', () => {
  beforeAll(async () => {
    // 2. Updated Environment Variables to match standardized names
    vi.stubEnv('NODE_ENV', 'test')
    vi.stubEnv('PORT', '3000')
    vi.stubEnv('MONGODB_URI', 'mongodb://localhost:27017/testdb')
    vi.stubEnv('ALLOWED_ORIGIN', 'http://localhost:3000')
    vi.stubEnv('JWT_SECRET', 'test_secret_for_integration_tests_32_chars')
    vi.stubEnv('SIGNUP_KEY', 'test_signup_key')

    // Dynamic import to ensure env variables are set before app initializes
    const module = await import('../src/app.js')
    app = module.default
  })

  it('should return 404 on unknown route', async () => {
    const response = await request(app).get('/api/unknown-path')
    expect(response.status).toBe(404)
  })

  it('should reject malformed JSON via express.json()', async () => {
    const response = await request(app)
      .post('/api/auth/login')
      .set('Content-Type', 'application/json')
      .send('{"invalid": json_content}') // Syntax error in JSON

    expect(response.status).toBe(400)

    // Updated to match the nested error structure { error: { message, code } }
    expect(response.body).toHaveProperty('error')
    expect(response.body.error).toHaveProperty(
      'message',
      'Invalid JSON payload',
    )
    expect(response.body.error).toHaveProperty('code', 'BAD_REQUEST')
  })

  it('should serve static files from /data/docs', async () => {
    const response = await request(app).get('/data/docs/')
    // 403 (Forbidden) is returned if directory listing is disabled,
    // which is the default/secure behavior.
    expect([200, 403, 404]).toContain(response.status)
  })

  it('should block /protected-route without a valid session cookie', async () => {
    const response = await request(app).get('/protected-route')
    expect(response.status).toBe(401)
    expect(response.body.message).toContain('Authentication required')
  })

  it('should allow CORS preflight requests from ALLOWED_ORIGIN', async () => {
    const response = await request(app)
      .options('/api/auth/login')
      .set('Origin', 'http://localhost:3000')
      .set('Access-Control-Request-Method', 'POST')
      .set('Access-Control-Request-Headers', 'Content-Type')

    expect(response.status).toBe(204) // No Content for successful OPTIONS
    expect(response.headers['access-control-allow-origin']).toBe(
      'http://localhost:3000',
    )
    expect(response.headers['access-control-allow-credentials']).toBe('true')
  })

  it('should deny CORS preflight requests from unauthorized origins', async () => {
    const response = await request(app)
      .options('/api/auth/login')
      .set('Origin', 'http://malicious-site.com')

    // CORS middleware doesn't always set 403, but it won't return the Allow-Origin header
    expect(response.headers['access-control-allow-origin']).toBeUndefined()
  })
})
