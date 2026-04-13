import {
  getAuthenticatedGrpcRequestContext,
  OperatorContextPayload
} from '@oes/common/authorization'
import { OperatorScope, resolveOperatorScope } from '../../application/authorization'

// Resolves the optional operator scope from the authenticated gRPC request context.
export function getOptionalOperatorScope(rpcData: unknown): OperatorScope | undefined {
  const operatorContext =
    getAuthenticatedGrpcRequestContext(rpcData)?.operatorContext as
      | OperatorContextPayload
      | undefined

  return resolveOperatorScope(operatorContext)
}
