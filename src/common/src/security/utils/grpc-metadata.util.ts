import { Metadata } from '@grpc/grpc-js'
import { AuthenticatedGrpcRequestContext, OperatorContextPayload } from '../types'
import { RPC_OPERATOR_CONTEXT_KEY } from '../constants'

export function getGrpcMetadataValue(metadata: Metadata | undefined, key: string): string | undefined {
  if (!metadata) {
    return undefined
  }

  const values = metadata.get(key)
  const firstValue = values[0]

  if (typeof firstValue === 'string') {
    return firstValue
  }

  if (Buffer.isBuffer(firstValue)) {
    return firstValue.toString('utf8')
  }

  return undefined
}

export function attachOperatorContext(
  rpcData: unknown,
  payload: OperatorContextPayload
): AuthenticatedGrpcRequestContext | undefined {
  if (!rpcData || typeof rpcData !== 'object') {
    return undefined
  }

  const target = rpcData as Record<string, unknown>
  const existing = (target[RPC_OPERATOR_CONTEXT_KEY] as AuthenticatedGrpcRequestContext | undefined) ?? {}
  const next = {
    ...existing,
    operatorContext: payload
  }

  target[RPC_OPERATOR_CONTEXT_KEY] = next
  return next
}

export function attachInternalService(
  rpcData: unknown,
  serviceName: string
): AuthenticatedGrpcRequestContext | undefined {
  if (!rpcData || typeof rpcData !== 'object') {
    return undefined
  }

  const target = rpcData as Record<string, unknown>
  const existing = (target[RPC_OPERATOR_CONTEXT_KEY] as AuthenticatedGrpcRequestContext | undefined) ?? {}
  const next = {
    ...existing,
    internalService: {
      serviceName
    }
  }

  target[RPC_OPERATOR_CONTEXT_KEY] = next
  return next
}

export function getAuthenticatedGrpcRequestContext(
  rpcData: unknown
): AuthenticatedGrpcRequestContext | undefined {
  if (!rpcData || typeof rpcData !== 'object') {
    return undefined
  }

  return (rpcData as Record<string, unknown>)[
    RPC_OPERATOR_CONTEXT_KEY
  ] as AuthenticatedGrpcRequestContext | undefined
}
