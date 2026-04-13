import { EventEmitter } from 'events'
import { RequestLoggerMiddleware } from './request-logger.middleware'

describe('RequestLoggerMiddleware', () => {
  it('should emit unified http access log fields on success', () => {
    const logger = {
      info: jest.fn(),
      warn: jest.fn(),
      error: jest.fn()
    } as any
    const middleware = new RequestLoggerMiddleware(logger)
    const response = new EventEmitter() as EventEmitter & { statusCode: number }
    response.statusCode = 200

    middleware.use(
      {
        method: 'GET',
        originalUrl: '/health',
        ip: '127.0.0.1',
        get: (name: string) => {
          if (name === 'x-request-id') return 'req-http-1'
          if (name === 'user-agent') return 'jest'
          return undefined
        }
      } as any,
      response as any,
      jest.fn()
    )

    response.emit('finish')

    expect(logger.info).toHaveBeenCalledWith(
      'HTTP request completed',
      expect.objectContaining({
        module: 'http',
        operation: 'request.complete',
        requestId: 'req-http-1',
        details: expect.objectContaining({
          protocol: 'http',
          method: 'GET',
          path: '/health',
          statusCode: 200
        })
      })
    )
  })

  it('should use warn level for 4xx and error for 5xx', () => {
    const logger = {
      info: jest.fn(),
      warn: jest.fn(),
      error: jest.fn()
    } as any
    const middleware = new RequestLoggerMiddleware(logger)
    const next = jest.fn()

    const warnRes = new EventEmitter() as EventEmitter & { statusCode: number }
    warnRes.statusCode = 403
    middleware.use(
      {
        method: 'GET',
        originalUrl: '/forbidden',
        ip: '127.0.0.1',
        get: () => undefined
      } as any,
      warnRes as any,
      next
    )
    warnRes.emit('finish')

    const errorRes = new EventEmitter() as EventEmitter & { statusCode: number }
    errorRes.statusCode = 500
    middleware.use(
      {
        method: 'POST',
        originalUrl: '/boom',
        ip: '127.0.0.1',
        get: () => undefined
      } as any,
      errorRes as any,
      next
    )
    errorRes.emit('finish')

    expect(logger.warn).toHaveBeenCalled()
    expect(logger.error).toHaveBeenCalled()
  })
})
