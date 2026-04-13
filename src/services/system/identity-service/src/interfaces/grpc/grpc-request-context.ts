import { ExceptionFactory } from '@oes/common/exceptions'
import {
  getAuthenticatedGrpcRequestContext,
  OperatorContextPayload,
  OPERATOR_CONTEXT_MISSING
} from '@oes/common/authorization'
import { resolveOperatorScope, OperatorScope } from '../../application/authorization'

export function getRequiredOperatorId(rpcData: unknown): string {
  const operatorId = getAuthenticatedGrpcRequestContext(rpcData)?.operatorContext?.operator_id?.trim()

  if (!operatorId) {
    throw ExceptionFactory.application(OPERATOR_CONTEXT_MISSING)
  }

  return operatorId
}

export function getOptionalOperatorScope(rpcData: unknown): OperatorScope | undefined {
  const operatorContext =
    getAuthenticatedGrpcRequestContext(rpcData)?.operatorContext as
      | OperatorContextPayload
      | undefined

  return resolveOperatorScope(operatorContext)
}
