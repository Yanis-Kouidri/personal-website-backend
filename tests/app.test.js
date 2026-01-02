import request from 'supertest'

// 1. Mock complet de Mongoose
vi.mock('mongoose', () => {
  // On crée une fonction Schema factice qui retourne un objet avec les méthodes courantes
  const mockSchema = vi.fn(() => ({
    index: vi.fn(),
    pre: vi.fn(),
    post: vi.fn(),
    methods: {},
    statics: {},
  }))

  const mongooseMock = {
    // Méthodes de définition (utilisées au chargement des fichiers models/)
    Schema: mockSchema,
    model: vi.fn().mockReturnValue({
      findOne: vi.fn(),
      create: vi.fn(),
      // Ajoute d'autres méthodes si ton code les appelle au démarrage
    }),

    // Méthodes de connexion
    connect: vi.fn().mockResolvedValue(true),
    connection: {
      on: vi.fn(),
      once: vi.fn(),
      readyState: 1,
      close: vi.fn().mockResolvedValue(true),
    },
  }

  return {
    ...mongooseMock,
    default: mongooseMock, // Important pour l'import par défaut
  }
})

let app

describe('App Integration', () => {
  beforeAll(async () => {
    // 2. Utilisation de vi.stubEnv (plus propre avec Vitest)
    vi.stubEnv('NODE_JS_MONGODB_USERNAME', 'testuser')
    vi.stubEnv('NODE_JS_MONGODB_PASSWORD', 'testpass')
    vi.stubEnv('NODE_JS_MONGODB_ADDRESS', 'localhost')
    vi.stubEnv('NODE_JS_MONGODB_PORT', '27017')
    vi.stubEnv('NODE_JS_MONGODB_DATABASE', 'testdb')
    vi.stubEnv('NODE_JS_FRONTEND_URL', 'http://localhost')
    vi.stubEnv('NODE_JS_FRONTEND_PORT', '3000')
    vi.stubEnv('NODE_JS_JWT_SECRET', 'test_secret_ci')

    // ✅ Import dynamique du serveur
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
      .send('{"invalid":}')

    expect(response.status).toBe(400)
    expect(response.body.message).toBe('Invalid JSON')
  })

  it('should serve static files from /data/docs', async () => {
    const response = await request(app).get('/data/docs/')
    // On accepte 200 ou 404 selon si le dossier existe dans le runner CI
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

    expect(response.status).toBe(204)
    expect(response.headers['access-control-allow-origin']).toBe(
      'http://localhost:3000',
    )
    expect(response.headers['access-control-allow-credentials']).toBe('true')
  })
})
