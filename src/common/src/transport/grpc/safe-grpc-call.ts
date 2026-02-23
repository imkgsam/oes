/**
 * @file gRPC 安全调用工具
 * @module transport/grpc
 *
 * 封装 gRPC 调用的通用逻辑：超时控制、异常分类处理。
 * - 业务异常（下游 RpcException）：直接透传
 * - 基础设施异常（timeout / unavailable 等）：包装为本服务的 InfrastructureException
 */

import { Observable, firstValueFrom, timeout, TimeoutError } from 'rxjs'
import { RpcException } from '@nestjs/microservices'
import { status as GrpcStatus } from '@grpc/grpc-js'
import { ExceptionFactory } from '../../core/exceptions'
import { INTERNAL_SERVICE_UNAVAILABLE } from '../../core/exceptions/exception-enums/infrastructure-exception.enum'

/** 默认超时时间（毫秒） */
const DEFAULT_TIMEOUT_MS = 5000

/** 被视为基础设施异常的 gRPC 状态码 */
const INFRA_STATUS_CODES = new Set<number>([
  GrpcStatus.UNAVAILABLE,
  GrpcStatus.DEADLINE_EXCEEDED,
  GrpcStatus.RESOURCE_EXHAUSTED,
  GrpcStatus.ABORTED,
  GrpcStatus.INTERNAL
])

export interface SafeGrpcCallOptions {
  /** 超时时间（毫秒），默认 5000 */
  timeoutMs?: number
  /** 调用方服务名，用于日志上下文 */
  caller?: string
  /** 被调用的方法名，用于日志上下文 */
  method?: string
}

/**
 * 安全执行 gRPC 调用。
 *
 * 处理策略：
 * 1. 超时 → 包装为 InfrastructureException（DEADLINE_EXCEEDED）
 * 2. 下游业务异常（RpcException）→ 直接透传，由上层 filter 处理
 * 3. 基础设施异常（UNAVAILABLE 等）→ 包装为 InfrastructureException
 * 4. 未知异常 → 包装为 InfrastructureException
 *
 * @example
 * ```typescript
 * const result = await safeGrpcCall(
 *   this.permissionSvc.checkPermission({ accountId, permissionCode }),
 *   { timeoutMs: 3000, caller: 'auth-service', method: 'checkPermission' }
 * )
 * ```
 */
export async function safeGrpcCall<T>(
  call$: Observable<T>,
  options?: SafeGrpcCallOptions
): Promise<T> {
  const timeoutMs = options?.timeoutMs ?? DEFAULT_TIMEOUT_MS

  try {
    return await firstValueFrom(call$.pipe(timeout(timeoutMs)))
  } catch (error) {
    throw classifyAndWrap(error, options)
  }
}

/**
 * 异常分类与包装。
 *
 * - RpcException 且非基础设施状态码 → 业务异常，透传
 * - RpcException 且基础设施状态码 → 包装为 infra 异常
 * - TimeoutError → 包装为 infra 异常（超时）
 * - 其他 → 包装为 infra 异常（未知）
 */
function classifyAndWrap(error: unknown, options?: SafeGrpcCallOptions): Error {
  const context = buildContext(options)

  // rxjs 超时
  if (error instanceof TimeoutError) {
    return ExceptionFactory.infrastructure(INTERNAL_SERVICE_UNAVAILABLE, {
      ...context,
      reason: 'TIMEOUT',
      message: `gRPC 调用超时（${options?.timeoutMs ?? DEFAULT_TIMEOUT_MS}ms）`
    })
  }

  // 下游返回的 RpcException
  if (error instanceof RpcException) {
    const rpcError = error.getError() as any
    const grpcCode: number = rpcError?.code ?? GrpcStatus.UNKNOWN

    // 基础设施级别的 gRPC 状态码 → 包装为本服务 infra 异常
    if (INFRA_STATUS_CODES.has(grpcCode)) {
      return ExceptionFactory.infrastructure(INTERNAL_SERVICE_UNAVAILABLE, {
        ...context,
        reason: GrpcStatus[grpcCode] ?? 'UNKNOWN',
        originalMessage: rpcError?.message,
        originalDetails: rpcError?.details
      })
    }

    // 业务异常 → 直接透传
    return error
  }

  // gRPC 原生错误（非 NestJS 包装），通常是连接级别的错误
  if (isGrpcNativeError(error)) {
    const grpcCode = (error as any).code
    return ExceptionFactory.infrastructure(INTERNAL_SERVICE_UNAVAILABLE, {
      ...context,
      reason: GrpcStatus[grpcCode] ?? 'UNKNOWN',
      originalMessage: (error as Error).message
    })
  }

  // 未知异常
  return ExceptionFactory.infrastructure(INTERNAL_SERVICE_UNAVAILABLE, {
    ...context,
    reason: 'UNKNOWN',
    originalMessage: (error as Error)?.message,
    stack: (error as Error)?.stack
  })
}

/** 构建日志上下文 */
function buildContext(options?: SafeGrpcCallOptions): Record<string, string | undefined> {
  return {
    caller: options?.caller,
    method: options?.method
  }
}

/** 判断是否为 gRPC 原生错误（带有数字 code 字段） */
function isGrpcNativeError(error: unknown): boolean {
  return (
    error instanceof Error &&
    typeof (error as any).code === 'number' &&
    (error as any).code >= 0 &&
    (error as any).code <= 16
  )
}
