import { CanActivate, ExecutionContext, Inject, Injectable } from '@nestjs/common'
import {
  INTERNAL_SERVICE_AUTHENTICATOR,
  OPERATOR_CONTEXT_METADATA_KEY,
  OPERATOR_CONTEXT_VERIFIER,
  REQUEST_ID_METADATA_KEY,
  TRACE_ID_METADATA_KEY,
  attachInternalService,
  attachOperatorContext,
  getGrpcMetadataValue,
  InternalServiceAuthenticator,
  OperatorContextVerifier
} from '@oes/common/authorization'
import { ExceptionFactory } from '@oes/common/exceptions'
import {
  ITEM_MASTER_INVALID_ARGUMENT,
  ITEM_MASTER_PERMISSION_DENIED,
  ITEM_MASTER_UNAUTHENTICATED
} from '../../common/errors/item-master.errors'

/** ItemMasterRpcContextGuard enforces the frozen item-master internal, operator, and trace context contract. */
@Injectable()
export class ItemMasterRpcContextGuard implements CanActivate {
  constructor(
    @Inject(INTERNAL_SERVICE_AUTHENTICATOR)
    private readonly internalServiceAuthenticator: InternalServiceAuthenticator,
    @Inject(OPERATOR_CONTEXT_VERIFIER)
    private readonly operatorContextVerifier: OperatorContextVerifier
  ) {}

  canActivate(context: ExecutionContext): boolean {
    const rpcContext = context.switchToRpc()
    const metadata = rpcContext.getContext()
    const rpcData = rpcContext.getData()

    const internalServiceResult = this.internalServiceAuthenticator.authenticate(metadata)
    if (!internalServiceResult.authenticated || !internalServiceResult.principal) {
      const definition = isPermissionDeniedReason(internalServiceResult.reason)
        ? ITEM_MASTER_PERMISSION_DENIED
        : ITEM_MASTER_UNAUTHENTICATED
      throw ExceptionFactory.application(definition, {
        reason: internalServiceResult.reason
      })
    }

    const rawOperatorContext = getGrpcMetadataValue(metadata, OPERATOR_CONTEXT_METADATA_KEY)
    if (!rawOperatorContext) {
      throw ExceptionFactory.application(ITEM_MASTER_UNAUTHENTICATED, {
        reason: 'operator context is missing'
      })
    }

    const operatorContextResult = this.operatorContextVerifier.verify(rawOperatorContext)
    if (!operatorContextResult.valid || !operatorContextResult.payload) {
      throw ExceptionFactory.application(ITEM_MASTER_UNAUTHENTICATED, {
        reason: operatorContextResult.reason
      })
    }

    const traceId = getGrpcMetadataValue(metadata, TRACE_ID_METADATA_KEY)
    if (!traceId || traceId.trim().length === 0) {
      throw ExceptionFactory.application(ITEM_MASTER_INVALID_ARGUMENT, {
        reason: 'trace context is required'
      })
    }

    const requestId = getGrpcMetadataValue(metadata, REQUEST_ID_METADATA_KEY)
    if (!requestId || requestId.trim().length === 0) {
      throw ExceptionFactory.application(ITEM_MASTER_INVALID_ARGUMENT, {
        reason: 'request metadata is required'
      })
    }

    attachInternalService(rpcData, internalServiceResult.principal.serviceName)
    attachOperatorContext(rpcData, operatorContextResult.payload)
    return true
  }
}

/** isPermissionDeniedReason distinguishes trusted-but-forbidden service contexts from missing authentication context. */
function isPermissionDeniedReason(reason?: string): boolean {
  if (!reason) {
    return false
  }

  const normalized = reason.toLowerCase()
  return normalized.includes('allow') || normalized.includes('trust')
}
