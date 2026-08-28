import { of } from 'rxjs'
import { SUCCESS } from '@oes/common/constants'
import { getTraceId } from '@oes/common/tracing'
import { resolveHttpResponseTraceId, ResponseTransformInterceptor } from './response.interceptor'

const ACTIVE_TRACE_ID = '0123456789abcdef0123456789abcdef'

jest.mock('@oes/common/tracing', () => ({
  getTraceId: jest.fn(() => '0123456789abcdef0123456789abcdef')
}))

describe('ResponseTransformInterceptor', () => {
  beforeEach(() => {
    jest.mocked(getTraceId).mockReturnValue(ACTIVE_TRACE_ID)
  })

  it('应包装成功响应并补充 meta', async () => {
    const interceptor = new ResponseTransformInterceptor()
    const request = {
      header: jest
        .fn()
        .mockImplementation((name: string) => (name === 'x-request-id' ? 'req-123' : undefined))
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
        traceId: ACTIVE_TRACE_ID,
        requestId: 'req-123'
      }
    })
    expect(result.meta?.timestamp).toEqual(expect.any(String))
  })

  it('应保留业务对象中的 code 字段而不是把它误当成成功响应码', async () => {
    const interceptor = new ResponseTransformInterceptor()
    const request = {
      header: jest
        .fn()
        .mockImplementation((name: string) => (name === 'x-request-id' ? 'req-456' : undefined))
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
        traceId: ACTIVE_TRACE_ID,
        requestId: 'req-456'
      }
    })
  })

  it('uses the normalized W3C request trace when no active span remains', async () => {
    jest.mocked(getTraceId).mockReturnValue('unknown')
    const interceptor = new ResponseTransformInterceptor()
    const request = {
      headers: {
        traceparent: '00-4bf92f3577b34da6a3ce929d0e0e4736-00f067aa0ba902b7-01'
      }
    }
    const context = {
      switchToHttp: () => ({ getRequest: () => request })
    } as any
    const next = { handle: () => of({ status: 'SUCCESS' }) } as any

    const result = await new Promise<any>((resolve, reject) => {
      interceptor.intercept(context, next).subscribe({ next: resolve, error: reject })
    })

    expect(result.meta.traceId).toBe('4bf92f3577b34da6a3ce929d0e0e4736')
  })

  it.each([
    'malformed',
    '00-00000000000000000000000000000000-00f067aa0ba902b7-01',
    '00-4bf92f3577b34da6a3ce929d0e0e4736-0000000000000000-01'
  ])('does not derive a response trace id from invalid request input %s', (traceparent) => {
    expect(resolveHttpResponseTraceId('unknown', { headers: { traceparent } })).toBe('unknown')
  })
})
