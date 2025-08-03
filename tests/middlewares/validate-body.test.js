import { validateBody } from '../../src/middlewares/validate-body'

const mockSafeParse = jest.fn()
const mockSchema = {
  safeParse: mockSafeParse,
}

describe('validateBody middleware', () => {
  let request, response, next

  beforeEach(() => {
    request = {
      body: {},
    }

    response = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn(),
    }

    next = jest.fn()
  })

  it('should call next() if validation succeeds', () => {
    const validatedData = { key: 'value' }
    mockSafeParse.mockReturnValue({ success: true, data: validatedData })

    const middleware = validateBody(mockSchema)
    middleware(request, response, next)

    expect(request.body).toEqual(validatedData)
    expect(next).toHaveBeenCalled()
    expect(response.status).not.toHaveBeenCalled()
    expect(response.json).not.toHaveBeenCalled()
  })

  it('should return 400 if validation fails', () => {
    mockSafeParse.mockReturnValue({
      success: false,
      error: { format: jest.fn() },
    })

    const middleware = validateBody(mockSchema)
    middleware(request, response, next)

    expect(response.status).toHaveBeenCalledWith(400)
    expect(response.json).toHaveBeenCalledWith({ message: 'Invalid input' })
    expect(next).not.toHaveBeenCalled()
  })

  it('should log validation error in development environment', () => {
    const originalEnvironment = process.env.NODE_ENV
    process.env.NODE_ENV = 'development'

    const errorFormatMock = jest.fn().mockReturnValue('formatted error') // Mock pour retourner une valeur définie
    mockSafeParse.mockReturnValue({
      success: false,
      error: { format: errorFormatMock },
    })

    const consoleWarnMock = jest
      .spyOn(console, 'warn')
      .mockImplementation(() => {})

    const middleware = validateBody(mockSchema)
    middleware(request, response, next)

    expect(errorFormatMock).toHaveBeenCalled()
    expect(consoleWarnMock).toHaveBeenCalledWith(
      'Validation error:',
      'formatted error'
    )

    // Restaurer l'environnement original
    process.env.NODE_ENV = originalEnvironment
    consoleWarnMock.mockRestore()
  })

  it('should not log validation error in production environment', () => {
    const originalEnvironment = process.env.NODE_ENV
    process.env.NODE_ENV = 'production'

    const errorFormatMock = jest.fn().mockReturnValue('formatted error') // Mock pour retourner une valeur définie
    mockSafeParse.mockReturnValue({
      success: false,
      error: { format: errorFormatMock },
    })

    const consoleWarnMock = jest
      .spyOn(console, 'warn')
      .mockImplementation(() => {})

    const middleware = validateBody(mockSchema)
    middleware(request, response, next)

    expect(errorFormatMock).not.toHaveBeenCalled()
    expect(consoleWarnMock).not.toHaveBeenCalled()

    // Restaurer l'environnement original
    process.env.NODE_ENV = originalEnvironment
    consoleWarnMock.mockRestore()
  })
})
