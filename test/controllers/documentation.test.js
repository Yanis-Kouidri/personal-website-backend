import { getAllDocumentation } from '../../src/controllers/documentation'

describe('authentication middleware', () => {
  let request, response

  beforeEach(() => {
    response = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn(),
    }
  })

  it('should return a json file', () => {
    getAllDocumentation(request, response)

    expect(response.status).not.toHaveBeenCalled() // Because express automaticly set 200 by default so it can't be test here because it mocked
    expect(response.json).toHaveBeenCalled()
  })
})
