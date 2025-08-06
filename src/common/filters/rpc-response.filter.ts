import {
  Injectable,
  NestInterceptor,
  ExecutionContext,
  CallHandler,
  Logger,
} from '@nestjs/common'
import { Observable } from 'rxjs'
import { map } from 'rxjs/operators'
import { RpcResponse, RpcResponseMeta } from '../interfaces/rpc.interface'
import { getTraceId } from '../modules/trace/trace-context'
import { RawError, RawException } from '../interfaces/exceptions.interface'
import { SUCCESS } from '../constants/res-codes/system.errors'

/**
 * RPC 响应包装过滤器
 *
 * 功能：
 * - 将 RPC 调用的返回值包装成统一的响应结构
 * - 自动添加追踪信息
 * - 处理成功响应的标准化
 * - 处理错误响应的标准化
 *
 * 使用场景：
 * - 微服务间的 RPC 调用
 * - 统一响应格式
 * - 追踪和监控
 * - 错误处理标准化
 */
@Injectable()
export class RpcResponseFilter implements NestInterceptor {
  private readonly logger = new Logger(RpcResponseFilter.name)

  constructor(
    private readonly moduleName: string = process.env.MODULE_NAME || 'UNKNOWN',
  ) {}

  intercept(context: ExecutionContext, next: CallHandler): Observable<any> {
    const rpcContext = context.switchToRpc()
    const data = rpcContext.getData()
    const traceId = getTraceId() || data?.traceId || 'unknown'

    return next.handle().pipe(
      map((response) => {
        // 如果响应已经是标准格式，直接返回
        if (this.isStandardResponse(response)) {
          return response
        }

        // 检查是否为错误响应
        if (this.isErrorResponse(response)) {
          return this.wrapErrorResponse(response, traceId)
        }

        // 包装成标准响应格式
        return this.wrapResponse(response, traceId)
      }),
    )
  }

  /**
   * 检查响应是否已经是标准格式
   */
  private isStandardResponse(response: any): response is RpcResponse<any> {
    return (
      response &&
      typeof response === 'object' &&
      'code' in response &&
      'message' in response &&
      'messageKey' in response &&
      'data' in response &&
      'meta' in response
    )
  }

  /**
   * 检查是否为错误响应
   */
  private isErrorResponse(response: any): boolean {
    // 检查是否为 RawError
    if (response && typeof response === 'object') {
      // 检查是否包含错误相关字段
      const hasErrorFields =
        'code' in response && 'message' in response && 'messageKey' in response

      // 检查是否为 RawError (不包含 httpStatus)
      const isRawError = hasErrorFields && !('httpStatus' in response)

      return isRawError
    }
    return false
  }

  /**
   * 包装错误响应
   */
  private wrapErrorResponse(error: any, traceId: string): RpcResponse<any> {
    const meta: RpcResponseMeta = {
      traceId,
      timestamp: new Date().toISOString(),
      callStack: [this.moduleName],
      module: this.moduleName,
    }

    // 处理 RawError
    if (this.isRawError(error)) {
      return {
        code: error.code,
        message: error.message,
        messageKey: error.messageKey,
        data: null,
        meta,
      }
    }

    // 处理未知错误
    return {
      code: '9999',
      message: 'Unknown error occurred',
      messageKey: 'common.unknown_error',
      data: null,
      meta,
    }
  }

  /**
   * 检查是否为 RawError
   */
  private isRawError(error: any): error is RawError {
    return (
      error &&
      typeof error === 'object' &&
      'code' in error &&
      'message' in error &&
      'messageKey' in error &&
      !('httpStatus' in error)
    )
  }

  /**
   * 将响应包装成标准格式
   */
  private wrapResponse(data: any, traceId: string): RpcResponse<any> {
    const meta: RpcResponseMeta = {
      traceId,
      timestamp: new Date().toISOString(),
      callStack: [this.moduleName],
      module: this.moduleName,
    }

    // 如果数据包含 spanId，添加到 meta 中
    if (data && typeof data === 'object' && 'spanId' in data) {
      meta.spanId = data.spanId
    }

    // 如果数据包含警告信息，添加到 meta 中
    if (
      data &&
      typeof data === 'object' &&
      'warnings' in data &&
      Array.isArray(data.warnings)
    ) {
      meta.warnings = data.warnings
    }

    return {
      code: SUCCESS.subCode,
      message: SUCCESS.message,
      messageKey: SUCCESS.messageKey,
      data,
      meta,
    }
  }
}
