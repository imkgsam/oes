import { normalizePublicReadFailure } from '../../../types/public-read-error'

describe('Storefront public read failures', () => {
  it.each([
    [{ statusCode: 400 }, 400],
    [{ response: { status: 400 } }, 400],
    [{ statusCode: 404 }, 404],
    [{ response: { status: 404 } }, 404],
    [{ statusCode: 500 }, 503],
    [new Error('connect ECONNREFUSED'), 503]
  ])('normalizes public read failure %p to %s', (failure, expectedStatus) => {
    expect(normalizePublicReadFailure(failure).statusCode).toBe(expectedStatus)
  })
})
