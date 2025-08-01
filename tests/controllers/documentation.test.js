import fs from 'node:fs'

import { getAllDocumentation } from '../../src/controllers/documentation'

//jest.mock('node:fs')

describe('test getAllDocumentation controller', () => {
  let mockRequest, mockResponse

  beforeEach(() => {
    mockResponse = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn().mockReturnThis(),
    }
  })

  it('should return a json file', () => {
    //fs.existsSync.mockResolvedValue(true)

    getAllDocumentation(mockRequest, mockResponse)

    expect(mockResponse.status).not.toHaveBeenCalled() // Because express automaticly set 200 by default so it can't be test here because it mocked
    expect(mockResponse.json).toHaveBeenCalledOnce()
  })
})
