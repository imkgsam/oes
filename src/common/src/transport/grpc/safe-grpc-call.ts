// File: src/common/src/transport/grpc/safe-grpc-call.ts

/**
 * @file gRPC 安全调用工具
 * @module transport/grpc
 *
 * 封装 gRPC 调用的通用逻辑：超时控制与技术层异常分类。
 * - 标准下游业务异常（RpcExceptionPayload）直接透传
 * - 基础设施异常（timeout / unavailable 等）包装为本服务的 InfrastructureException
 * - 非标准 RpcException 与原生 gRPC 错误统一视为 infra 异常
 */

import { status as GrpcStatus } from '@grpc/grpc-js'
import { RpcException } from '@nestjs/microservices'
import { Observable, TimeoutError, firstValueFrom, timeout } from 'rxjs'
import { ExceptionFactory } from '../../core/exceptions'
import { INTERNAL_SERVICE_UNAVAILABLE } from '../../core/exceptions/exception-enums/infrastructure-exception.enum'
import { RpcExceptionPayload } from '../../core/exceptions/exception.interface'

const DEFAULT_TIMEOUT_MS = 5000

const INFRA_STATUS_CODES = new Set<number>([
  GrpcStatus.UNAVAILABLE,
  GrpcStatus.DEADLINE_EXCEEDED,
  GrpcStatus.ABORTED,
  GrpcStatus.INTERNAL
])

export interface SafeGrpcCallOptions {
  timeoutMs?: number
  caller?: string
  method?: string
}

/**
 * 安全执行 gRPC 调用。
 *
 * 处理策略：
 * 1. 超时 → 包装为 InfrastructureException
 * 2. 标准下游业务异常（RpcExceptionPayload）→ 直接透传
 * 3. 下游基础设施异常（UNAVAILABLE 等）→ 包装为 InfrastructureException
 * 4. 非标准 RpcException、原生 gRPC error、未知异常 → 包装为 InfrastructureException
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

function classifyAndWrap(error: unknown, options?: SafeGrpcCallOptions): Error {
  const context = buildContext(options)

  if (error instanceof TimeoutError) {
    return wrapInfrastructureError(context, 'TIMEOUT', {
      message: `gRPC 调用超时（${options?.timeoutMs ?? DEFAULT_TIMEOUT_MS}ms）`
    })
  }

  if (error instanceof RpcException) {
    const payload = error.getError()

    if (!isRpcExceptionPayload(payload)) {
      return wrapInfrastructureError(context, 'NON_STANDARD_RPC_EXCEPTION', {
        originalMessage: getErrorMessage(payload),
        originalDetails: getErrorDetails(payload)
      })
    }

    if (isInfrastructureRpcPayload(payload)) {
      return wrapInfrastructureError(context, grpcStatusName(payload.grpcStatus), {
        originalMessage: payload.message,
        originalDetails: payload.details
      })
    }

    return error
  }

  if (isGrpcNativeError(error)) {
    const payload = parseGrpcNativePayload(error)

    if (payload) {
      if (isInfrastructureRpcPayload(payload)) {
        return wrapInfrastructureError(context, grpcStatusName(payload.grpcStatus), {
          originalMessage: payload.message,
          originalDetails: payload.details
        })
      }

      return new RpcException(payload)
    }

    return wrapInfrastructureError(context, grpcStatusName(error.code), {
      originalMessage: error.message,
      originalDetails: error.details
    })
  }

  return wrapInfrastructureError(context, 'UNKNOWN', {
    originalMessage: getErrorMessage(error),
    stack: getErrorStack(error)
  })
}

function buildContext(options?: SafeGrpcCallOptions): Record<string, string | undefined> {
  return {
    caller: options?.caller,
    method: options?.method
  }
}

function wrapInfrastructureError(
  context: Record<string, string | undefined>,
  reason: string,
  details?: Record<string, unknown>
): Error {
  return ExceptionFactory.infrastructure(INTERNAL_SERVICE_UNAVAILABLE, {
    ...context,
    reason,
    ...details
  })
}

function isInfrastructureGrpcStatus(code: number): boolean {
  return INFRA_STATUS_CODES.has(code)
}

// Classifies standardized OES payloads by semantic error code first, not by broad gRPC status.
function isInfrastructureRpcPayload(payload: RpcExceptionPayload): boolean {
  return payload.code.startsWith('INFRA_') || isInfrastructureGrpcStatus(payload.grpcStatus)
}

function isRpcExceptionPayload(value: unknown): value is RpcExceptionPayload {
  if (typeof value !== 'object' || value === null) {
    return false
  }

  const candidate = value as Partial<RpcExceptionPayload>
  return (
    typeof candidate.grpcStatus === 'number' &&
    typeof candidate.code === 'string' &&
    typeof candidate.message === 'string'
  )
}

// Restores an OES RpcExceptionPayload from the JSON details emitted by GrpcExceptionFilter.
function parseGrpcNativePayload(
  error: Error & { code: number; details?: unknown }
): RpcExceptionPayload | null {
  const details = error.details

  if (typeof details !== 'string') {
    return null
  }

  try {
    const parsed = JSON.parse(details)
    if (isRpcExceptionPayload(parsed)) {
      return parsed
    }
  } catch {
    return null
  }

  return null
}

/**
 * 判断是否为 gRPC 原生错误（非 NestJS RpcException）。
 *
 * 常见形态近似：
 * `{ message: '14 UNAVAILABLE: No connection established', code: 14, details: 'No connection established' }`
 */
function isGrpcNativeError(error: unknown): error is Error & { code: number; details?: unknown } {
  if (!(error instanceof Error)) {
    return false
  }

  const candidate = error as Error & { code?: unknown; details?: unknown }
  return typeof candidate.code === 'number' && candidate.code >= 0 && candidate.code <= 16
}

function grpcStatusName(code: number): string {
  return GrpcStatus[code] ?? 'UNKNOWN'
}

function getErrorMessage(error: unknown): string | undefined {
  if (error instanceof Error) {
    return error.message
  }

  if (typeof error === 'object' && error !== null) {
    const candidate = error as { message?: unknown }
    if (typeof candidate.message === 'string') {
      return candidate.message
    }
  }

  return undefined
}

function getErrorDetails(error: unknown): unknown {
  if (typeof error !== 'object' || error === null) {
    return undefined
  }

  const candidate = error as { details?: unknown }
  return candidate.details
}

function getErrorStack(error: unknown): string | undefined {
  if (error instanceof Error) {
    return error.stack
  }

  return undefined
}
