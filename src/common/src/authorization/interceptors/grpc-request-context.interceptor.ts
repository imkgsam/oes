import { CallHandler, ExecutionContext, Injectable, NestInterceptor } from '@nestjs/common'
import { Observable } from 'rxjs'
import {
  INTERNAL_SERVICE_NAME_METADATA_KEY,
  REQUEST_ID_METADATA_KEY,
  TRACE_ID_METADATA_KEY
} from '../constants'
import { GrpcAuthenticatedRequestContext } from '../types'
import { getAuthenticatedGrpcRequestContext, getGrpcMetadataValue } from '../utils'
import { GrpcRequestContextStore } from '../services/grpc-request-context.store'
import { inboundExecutionTokenCredentialScope } from '../trusted-execution/inbound-execution-token-credential.scope'

@Injectable()
export class GrpcRequestContextInterceptor implements NestInterceptor {
  constructor(private readonly requestContextStore: GrpcRequestContextStore) {}

  intercept(context: ExecutionContext, next: CallHandler): Observable<unknown> {
    if (context.getType<'rpc' | 'http' | 'ws'>() !== 'rpc') {
      return next.handle()
    }

    const rpcContext = context.switchToRpc()
    const rpcData = rpcContext.getData()
    const metadata = rpcContext.getContext()
    const authenticatedContext = getAuthenticatedGrpcRequestContext(rpcData)

    const requestContext: GrpcAuthenticatedRequestContext = {
      internalServiceName:
        authenticatedContext?.internalService?.serviceName ??
        getGrpcMetadataValue(metadata, INTERNAL_SERVICE_NAME_METADATA_KEY),
      operatorContext: authenticatedContext?.operatorContext,
      verifiedExecutionToken: authenticatedContext?.verifiedExecutionToken,
      verifiedWorkloadIdentity: authenticatedContext?.verifiedWorkloadIdentity,
      requestId: getGrpcMetadataValue(metadata, REQUEST_ID_METADATA_KEY),
      traceId: getGrpcMetadataValue(metadata, TRACE_ID_METADATA_KEY)
    }

    return new Observable((subscriber) =>
      inboundExecutionTokenCredentialScope.runPrepared(rpcData, () =>
        this.requestContextStore.run(requestContext, () => {
          const subscription = next.handle().subscribe({
            next: (value) => subscriber.next(value),
            error: (error) => {
              inboundExecutionTokenCredentialScope.clearCurrent()
              subscriber.error(error)
            },
            complete: () => {
              inboundExecutionTokenCredentialScope.clearCurrent()
              subscriber.complete()
            }
          })
          return () => {
            subscription.unsubscribe()
            inboundExecutionTokenCredentialScope.clearCurrent()
          }
        })
      )
    )
  }
}
