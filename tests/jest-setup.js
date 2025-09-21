// Mock console.error to suppress logs during Jest tests
jest.spyOn(console, 'error').mockImplementation(() => {})
jest.spyOn(console, 'log').mockImplementation(() => {})
jest.spyOn(console, 'warn').mockImplementation(() => {})
