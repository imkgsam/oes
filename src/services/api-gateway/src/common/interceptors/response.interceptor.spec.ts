import { of } from 'rxjs'
import { SUCCESS } from '@oes/common/constants'
import { ResponseTransformInterceptor } from './response.interceptor'

jest.mock('@oes/common/tracing', () => ({
  getTraceId: jest.fn(() => 'trace-123')
}))

describe('ResponseTransformInterceptor', () => {
  it('应包装成功响应并补充 meta', async () => {
    const interceptor = new ResponseTransformInterceptor()
    const request = {
      header: jest.fn().mockImplementation((name: string) =>
        name === 'x-request-id' ? 'req-123' : undefined
      )
    }
    const context = {
      switchToHttp: () => ({
        getRequest: () => request
      })
    } as any
    const next = {
      handle: () =>
        of({
          data: {
            status: 'SUCCESS'
          }
        })
    } as any

    const result = await new Promise<any>((resolve, reject) => {
      interceptor.intercept(context, next).subscribe({
        next: resolve,
        error: reject
      })
    })

    expect(result).toMatchObject({
      code: SUCCESS.subCode,
      message: SUCCESS.message,
      messageKey: SUCCESS.messageKey,
      data: {
        status: 'SUCCESS'
      },
      meta: {
        traceId: 'trace-123',
        requestId: 'req-123'
      }
    })
    expect(result.meta?.timestamp).toEqual(expect.any(String))
  })

  it('应保留业务对象中的 code 字段而不是把它误当成成功响应码', async () => {
    const interceptor = new ResponseTransformInterceptor()
    const request = {
      header: jest.fn().mockImplementation((name: string) =>
        name === 'x-request-id' ? 'req-456' : undefined
      )
    }
    const context = {
      switchToHttp: () => ({
        getRequest: () => request
      })
    } as any
    const next = {
      handle: () =>
        of({
          id: 'permission-1',
          code: 'permission.audit.list',
          module: 'PERMISSION_SERVICE',
          description: 'List permission audit records'
        })
    } as any

    const result = await new Promise<any>((resolve, reject) => {
      interceptor.intercept(context, next).subscribe({
        next: resolve,
        error: reject
      })
    })

    expect(result).toMatchObject({
      code: SUCCESS.subCode,
      message: SUCCESS.message,
      messageKey: SUCCESS.messageKey,
      data: {
        id: 'permission-1',
        code: 'permission.audit.list',
        module: 'PERMISSION_SERVICE',
        description: 'List permission audit records'
      },
      meta: {
        traceId: 'trace-123',
        requestId: 'req-456'
      }
    })
  })
})
