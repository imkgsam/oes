import { Injectable, NestInterceptor, ExecutionContext, CallHandler } from '@nestjs/common'
import { Observable } from 'rxjs'
import { map } from 'rxjs/operators'
import { Request } from 'express'
import { HttpResponse } from '@oes/common/interfaces/http.interface'
import { SUCCESS } from '@oes/common/constants/res-codes/system.errors'
import { getSpanId, getTraceId } from '@oes/common/modules/trace/trace-context'

/**
 * HTTP 响应拦截器 - 统一返回响应结构
 * 支持 RpcResponse、HttpResponse 和原始数据的智能转换
 */
@Injectable()
export class ResponseTransformInterceptor implements NestInterceptor<any, HttpResponse> {
  intercept(context: ExecutionContext, next: CallHandler): Observable<HttpResponse> {
    const ctx = context.switchToHttp()
    const request: Request = ctx.getRequest()

    const traceId = getTraceId()
    const spanId = getSpanId()

    return next.handle().pipe(
      map((data: any): HttpResponse => {
        // 智能数据提取：支持 RpcResponse、HttpResponse 和原始数据
        const businessData = this.extractBusinessData(data)
        return {
          code: this.getCode(data),
          message: this.getMessage(data),
          messageKey: this.getMessageKey(data),
          data: businessData,
          meta: {
            traceId,
            spanId: spanId || 'unknown',
            timestamp: new Date().toISOString(),
            path: request.originalUrl,
            parentSpanId: 'root',
            module: 'api-gateway',
            callTrace: this.getCallTrace(data),
            warnings: this.getWarnings(data)
          }
        }
      })
    )
  }

  /**
   * 提取业务数据
   */
  private extractBusinessData(data: any): any {
    return data?.data !== undefined ? data.data : data
  }

  /**
   * 获取响应码
   */
  private getCode(data: any): string {
    return data?.code || SUCCESS.subCode
  }

  /**
   * 获取响应消息
   */
  private getMessage(data: any): string {
    return data?.message || SUCCESS.message
  }

  /**
   * 获取消息键
   */
  private getMessageKey(data: any): string {
    return data?.messageKey || SUCCESS.messageKey
  }

  /**
   * 获取调用轨迹
   */
  private getCallTrace(data: any): any[] {
    return data?.meta?.callTrace || []
  }

  /**
   * 获取警告信息
   */
  private getWarnings(data: any): Record<string, any> {
    return data?.meta?.warnings || {}
  }
}
