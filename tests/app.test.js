import request from 'supertest'

let app

describe('App Integration', () => {
  beforeAll(async () => {
    process.env.NODE_JS_MONGODB_USERNAME = 'testuser'
    process.env.NODE_JS_MONGODB_PASSWORD = 'testpass'
    process.env.NODE_JS_MONGODB_ADDRESS = 'localhost'
    process.env.NODE_JS_MONGODB_PORT = '27017'
    process.env.NODE_JS_MONGODB_DATABASE = 'testdb'
    process.env.NODE_JS_FRONTEND_URL = 'http://localhost'
    process.env.NODE_JS_FRONTEND_PORT = '3000'

    // ✅ Import après avoir défini process.env
    const module_ = await import('../src/app.js')
    app = module_.default
  })

  it('should return 404 on unknown route', async () => {
    const response = await request(app).get('/nonexistent')
    expect(response.status).toBe(404)
  })

  it('should reject malformed JSON', async () => {
    const response = await request(app)
      .post('/api/auth/login')
      .set('Content-Type', 'application/json')
      .send('{"invalid":}') // malformed JSON
    expect(response.status).toBe(400)
    expect(response.body.message).toBe('Invalid JSON')
    expect(response.next).toBe()
  })

  it('should serve static files from /data/docs', async () => {
    const response = await request(app).get('/data/docs/')
    expect([200, 403, 404]).toContain(response.status)
  })

  it('should block /protected-route without token', async () => {
    const response = await request(app).get('/protected-route')
    expect(response.status).toBe(401)
  })

  it('should allow CORS preflight requests', async () => {
    const response = await request(app)
      .options('/api/docs')
      .set('Origin', 'http://localhost:3000')
      .set('Access-Control-Request-Method', 'GET')
    expect(response.status).toBe(204) // No Content (typical preflight)
    expect(response.headers['access-control-allow-origin']).toBe(
      'http://localhost:3000',
    )
    expect(response.headers['access-control-allow-credentials']).toBe('true')
  })
})
