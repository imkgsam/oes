import { Observable, isObservable, firstValueFrom } from 'rxjs'
import { GLOBAL_RUNTIME_ERRORS } from '../constants/res-codes/runtime.errors'
import { createRuntimeException } from './exception.factory'
import { isRpcError, toRpcException } from './exception.helper'

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
 * @param options 配置选项
 * @returns 调用结果
 */
export async function safeRpcCall<T>(
  rpcCall: Promise<T> | Observable<T>,
  options?: {
    /** 是否启用调试日志 */
    enableDebugLog?: boolean
    /** 自定义错误上下文 */
    context?: Record<string, any>
    /** 自定义错误消息 */
    errorMessage?: string
  },
): Promise<T> {
  const { enableDebugLog = false, context, errorMessage } = options || {}

  if (enableDebugLog) {
    console.log('[safeRpcCall] Executing RPC call...')
  }

  try {
    const result = isObservable(rpcCall)
      ? await firstValueFrom(rpcCall)
      : await rpcCall
    return result
  } catch (exception) {
    if (enableDebugLog) {
      console.error(
        `[safeRpcCall] Error occurred: type: ${typeof exception} \n`,
        exception,
      )
    }

    // 安全地提取错误对象
    const errorObject = extractErrorObject(exception)

    if (isRpcError(errorObject)) {
      const { error, context: rpcContext } = errorObject
      if (enableDebugLog) {
        console.error('[safeRpcCall] Caught RpcError:', error)
      }
      throw toRpcException(error, { ...rpcContext, ...context })
    } else {
      if (enableDebugLog) {
        console.error(
          '[safeRpcCall] Caught INVALID_RPC_STRUCTURE error, throwing RuntimeException',
          exception,
        )
      }

      const finalContext = {
        originalError: errorObject,
        ...context,
      }

      throw createRuntimeException(
        GLOBAL_RUNTIME_ERRORS.INVALID_RPC_STRUCTURE,
        finalContext,
      )
    }
  }
}

/**
 * 带重试的 RPC 调用包装器
 *
 * @param rpcCall RPC 调用
 * @param options 配置选项
 * @returns 调用结果
 */
export async function safeRpcCallWithRetry<T>(
  rpcCall: Promise<T> | Observable<T>,
  options?: {
    /** 最大重试次数 */
    maxRetries?: number
    /** 重试延迟（毫秒） */
    retryDelay?: number
    /** 是否启用调试日志 */
    enableDebugLog?: boolean
    /** 自定义错误上下文 */
    context?: Record<string, any>
    /** 自定义错误消息 */
    errorMessage?: string
    /** 重试条件函数 */
    shouldRetry?: (error: unknown) => boolean
  },
): Promise<T> {
  const {
    maxRetries = 3,
    retryDelay = 1000,
    enableDebugLog = false,
    context,
    errorMessage,
    shouldRetry = (error: unknown) => {
      // 默认只对网络错误和超时进行重试
      const errorObj = extractErrorObject(error)
      return (
        (errorObj as { code?: string })?.code === 'ECONNRESET' ||
        (errorObj as { code?: string })?.code === 'ETIMEDOUT' ||
        (errorObj as { message?: string })?.message?.includes('timeout')
      )
    },
  } = options || {}

  let lastError: unknown

  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    try {
      if (enableDebugLog && attempt > 0) {
        console.log(
          `[safeRpcCallWithRetry] Retry attempt ${attempt}/${maxRetries}`,
        )
      }

      return await safeRpcCall(rpcCall, {
        enableDebugLog,
        context,
        errorMessage,
      })
    } catch (error) {
      lastError = error

      if (attempt === maxRetries || !shouldRetry(error)) {
        throw error
      }

      if (enableDebugLog) {
        console.log(`[safeRpcCallWithRetry] Retrying in ${retryDelay}ms...`)
      }

      await new Promise((resolve) => setTimeout(resolve, retryDelay))
    }
  }

  throw lastError
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
