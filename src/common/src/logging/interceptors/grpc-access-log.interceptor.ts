import { CallHandler, ExecutionContext, Injectable, NestInterceptor } from '@nestjs/common'
import { Observable } from 'rxjs'
import { tap } from 'rxjs/operators'
import { AppLogger } from '../app-logger.service'
import { getAuthenticatedGrpcRequestContext, getGrpcMetadataValue } from '../../authorization/utils'
import {
  INTERNAL_SERVICE_NAME_METADATA_KEY,
  REQUEST_ID_METADATA_KEY,
  TRACE_ID_METADATA_KEY
} from '../../authorization/constants'

/**
 * GrpcAccessLogInterceptor records a unified access log entry for every inbound gRPC request.
 */
@Injectable()
export class GrpcAccessLogInterceptor implements NestInterceptor {
  constructor(private readonly logger: AppLogger) {}

  intercept(context: ExecutionContext, next: CallHandler): Observable<unknown> {
    if (context.getType<'rpc' | 'http' | 'ws'>() !== 'rpc') {
      return next.handle()
    }

    const startedAt = Date.now()
    const rpcContext = context.switchToRpc()
    const rpcData = rpcContext.getData()
    const metadata = rpcContext.getContext()
    const authenticatedContext = getAuthenticatedGrpcRequestContext(rpcData)
    const operatorContext = authenticatedContext?.operatorContext
    const module = this.logger.getServiceName()
    const operation = this.getMethodName(context.getArgByIndex(2))
    const requestId =
      operatorContext?.request_id ?? getGrpcMetadataValue(metadata, REQUEST_ID_METADATA_KEY)
    const traceId =
      operatorContext?.trace_id ?? getGrpcMetadataValue(metadata, TRACE_ID_METADATA_KEY)
    const internalServiceName =
      authenticatedContext?.internalService?.serviceName ??
      getGrpcMetadataValue(metadata, INTERNAL_SERVICE_NAME_METADATA_KEY)

    return next.handle().pipe(
      tap({
        next: () => {
          this.logger.info('gRPC request completed', {
            module,
            operation,
            requestId,
            traceId,
            tenantId: operatorContext?.tenant_id,
            orgId: operatorContext?.org_id,
            operatorId: operatorContext?.operator_id,
            details: {
              transport: 'grpc',
              result: 'SUCCEEDED',
              durationMs: Date.now() - startedAt,
              internalServiceName
            }
          })
        },
        error: (error) => {
          this.logger.warn('gRPC request failed', {
            module,
            operation,
            requestId,
            traceId,
            tenantId: operatorContext?.tenant_id,
            orgId: operatorContext?.org_id,
            operatorId: operatorContext?.operator_id,
            errorCode: this.extractErrorCode(error),
            details: {
              transport: 'grpc',
              result: 'FAILED',
              durationMs: Date.now() - startedAt,
              internalServiceName
            }
          })
        }
      })
    )
  }

  private getMethodName(call: unknown): string {
    const candidate = call as
      | { call?: { handler?: { path?: string }; path?: string; method?: string }; handler?: { path?: string }; path?: string; method?: string }
      | undefined

    const values = [
      candidate?.call?.handler?.path,
      candidate?.handler?.path,
      candidate?.call?.path,
      candidate?.path,
      candidate?.call?.method,
      candidate?.method
    ]

    return values.find((value) => typeof value === 'string' && value.trim().length > 0) ?? 'unknown-method'
  }

  private extractErrorCode(error: unknown): string | undefined {
    if (!error || typeof error !== 'object') {
      return undefined
    }

    const candidate = error as { code?: unknown; details?: { code?: unknown } }
    if (typeof candidate.code === 'string') {
      return candidate.code
    }

    if (typeof candidate.details?.code === 'string') {
      return candidate.details.code
    }

    return undefined
  }
}
