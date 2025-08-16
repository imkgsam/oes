import {
  Injectable,
  NestInterceptor,
  ExecutionContext,
  CallHandler,
  Logger
} from '@nestjs/common'
import { Observable } from 'rxjs'
import { map } from 'rxjs/operators'
import {
  CallTrace,
  RpcControllerResult,
  RpcModuleWarnings,
  RpcRequest,
  RpcResponse,
  RpcResponseMeta
} from '../interfaces/rpc.interface'
import { CBError } from '../interfaces/rpc.interface'
import { SUCCESS } from '../constants/res-codes/system.errors'
import { v4 as uuidv4 } from 'uuid'
import { buildGlobalErrorCode } from '../helpers/exception.helper'
import { EXCEPTION_TYPE_PREFIX } from '../constants/res-codes/module.codes'
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
export class RpcResponseInterceptor implements NestInterceptor {
  private readonly logger = new Logger(RpcResponseInterceptor.name)

  constructor(
    private readonly moduleName: string = process.env.MODULE_NAME || 'UNKNOWN'
  ) {}

  intercept(context: ExecutionContext, next: CallHandler): Observable<any> {
    const rpcContext = context.switchToRpc()
    const data: RpcRequest<any> = rpcContext.getData()
    const traceId = data?.meta?.traceId || 'unknown' // 从请求中获取traceId
    const parentSpanId = data?.meta?.spanId || 'root' // 从请求中获取父spanId
    const startTime = Date.now() // 本操作的运行起始时间
    const currentSpanId = uuidv4() // 本操作的spanId

    return next.handle().pipe(
      map((response) => {
        /**
         * response 返回的是固定的 rpccontrollerResult 结构
         * 包含的fields 有
         * data ： 返回的数据，如果是出现强依赖的错误，那么就会使用exception 抛出， 如果是弱依赖，那么默认都是返回data
         * warnings 本服务所出现的弱依赖的错误
         * error: 本服务所出现的强依赖错误
         * downstreammeta 下游服务所返回的元数据
         */

        //1. 合并下游warnings 以及 下游 calltrace
        const mergedWarnings: RpcModuleWarnings = {}
        const downstreamCalltraces: CallTrace[] = []
        response.downstreamMeta.map((resMeta) => {
          if (resMeta.warnings) {
            Object.entries(resMeta.warnings).forEach(
              ([moduleName, warnings]) => {
                if (!mergedWarnings[moduleName]) {
                  mergedWarnings[moduleName] = []
                }
                mergedWarnings[moduleName].push(...(warnings as CBError[]))
              }
            )
          }
          if (resMeta.callTrace) {
            downstreamCalltraces.push(...resMeta.callTrace)
          }
        })
        // 2. 合并本服务的warnings
        if (response.warnings) {
          response.warnings.forEach((error) => {
            if (!mergedWarnings[this.moduleName]) {
              mergedWarnings[this.moduleName] = []
            }
            mergedWarnings[this.moduleName].push(error)
          })
        }
        //2. 计算 durationMs
        const endTime = Date.now()
        const durationMs = endTime - startTime
        //3. 合并 calltrace
        const currentCallTrace: CallTrace = {
          traceId,
          module: this.moduleName,
          spanId: currentSpanId,
          parentSpanId,
          startTime: new Date(startTime).toISOString(),
          endTime: new Date(endTime).toISOString()
        }

        const newMeta: RpcResponseMeta = {
          traceId,
          spanId: currentSpanId,
          parentSpanId,
          module: this.moduleName,
          timestamp: new Date(endTime).toISOString(),
          durationMs,
          callTrace: [currentCallTrace, ...downstreamCalltraces],
          warnings: mergedWarnings
        }

        // 包装成标准响应格式
        return this.wrapResponse(response, newMeta)
      })
    )
  }

  /**
   * 将响应包装成标准格式
   */
  private wrapResponse(
    response: RpcControllerResult,
    meta: RpcResponseMeta
  ): RpcResponse {
    const rt: RpcResponse = {
      code: SUCCESS.subCode,
      message: SUCCESS.message,
      messageKey: SUCCESS.messageKey,
      meta
    }
    if (response.error) {
      rt.code = buildGlobalErrorCode(
        EXCEPTION_TYPE_PREFIX.BUSINESS,
        this.moduleName,
        response.error.subCode
      )
      rt.message = response?.error.message
      rt.messageKey = response?.error?.messageKey
    } else {
      rt.code = SUCCESS.subCode
      rt.message = SUCCESS.message
      rt.messageKey = SUCCESS.messageKey
      rt.data = response?.data
    }
    return rt
  }
}
