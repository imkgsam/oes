import { Observable, isObservable, firstValueFrom } from 'rxjs'
import { GLOBAL_RUNTIME_ERRORS } from '../constants/res-codes/runtime.errors'
import { createRuntimeException } from '../exceptions/exception.factory'
import { isRpcError, toRpcException } from './exception.helper'
import { RpcRequest, RpcRequestMeta, RpcResponse } from '../interfaces/rpc.interface'
import { ClientProxy } from '@nestjs/microservices'
import { v4 as uuidv4 } from 'uuid'
import { getTraceId } from '../modules/trace/trace-context'
import { envConfig } from './env.helper'

/**
 * 安全的 RPC 调用包装器
 *
 * 功能：
 * - 统一处理 Observable 和 Promise
 * - 自动类型推断
 * - 标准化错误处理
 * - 可选的日志记录
 *
 * @param rpcCall RPC 调用（Observable 或 Promise）
 * @returns 调用结果
 */
export async function safeRpcCall<T>(rpcCall: Promise<T> | Observable<T>): Promise<T> {
  try {
    const result = isObservable(rpcCall) ? await firstValueFrom(rpcCall) : await rpcCall
    return result
  } catch (exception) {
    exceptionHandler(exception)
  }
}

export async function safeRpcCall2<I, O>(
  client: ClientProxy,
  pattern: string,
  inputData?: I,
  requestMeta?: Partial<RpcRequestMeta>
): Promise<RpcResponse<O>> {
  try {
    const rpcRequest: RpcRequest<I> = {
      data: inputData,
      meta: {
        traceId: requestMeta?.traceId || getTraceId() || uuidv4(),
        spanId: uuidv4(), // 服务端自动生成spanId
        timestamp: new Date().toISOString(), // 服务端自动生成 请求timestamp
        caller: requestMeta?.caller || process.env.MODULE_NAME || 'UNKNOWN_MODULE',
        // 只在开发/测试环境中传递 pattern 信息
        ...(envConfig.showRpcPattern && { pattern })
      }
    }
    const response = await firstValueFrom(
      client.send<RpcResponse<O>, RpcRequest<I>>(pattern, rpcRequest)
    )
    return response
  } catch (exception) {
    exceptionHandler(exception)
  }
}

/**
 * 安全地提取错误对象
 * @param exception 异常对象
 * @returns 错误对象
 */
function extractErrorObject(exception: unknown): unknown {
  if (exception && typeof exception === 'object') {
    const obj = exception as Record<string, unknown>
    const getError = obj.getError
    if (typeof getError === 'function') {
      return getError()
    }
    return obj.error ?? exception
  }
  return exception
}

function exceptionHandler(exception: unknown): void {
  // 安全地提取错误对象
  const errorObject = extractErrorObject(exception)
  if (isRpcError(errorObject)) {
    const { error, context: rpcContext } = errorObject
    throw toRpcException(error, { ...rpcContext })
  } else {
    const finalContext = {
      originalError: errorObject
    }
    throw createRuntimeException(GLOBAL_RUNTIME_ERRORS.INVALID_RPC_STRUCTURE, finalContext)
  }
}
