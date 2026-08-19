import { Metadata } from '@grpc/grpc-js'
import { AuthenticatedGrpcRequestContext, OperatorContextPayload } from '../types'
import { RPC_OPERATOR_CONTEXT_KEY } from '../constants'
import type {
  VerifiedExecutionToken,
  VerifiedWorkloadIdentity
} from '../trusted-execution'

const VERIFIED_EXECUTION_REQUESTS = new WeakSet<object>()

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

export function getGrpcAuthorizationBearer(
  metadata: Metadata | undefined,
  key = 'authorization'
): string | undefined {
  const raw = getGrpcMetadataValue(metadata, key)
  const match = raw?.match(/^Bearer ([A-Za-z0-9_-]+\.[A-Za-z0-9_-]+\.[A-Za-z0-9_-]+)$/)
  return match?.[1]
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

export function attachVerifiedExecution(
  rpcData: unknown,
  input: {
    verifiedExecutionToken: VerifiedExecutionToken
    verifiedWorkloadIdentity: VerifiedWorkloadIdentity
  }
): AuthenticatedGrpcRequestContext | undefined {
  if (!rpcData || typeof rpcData !== 'object') {
    return undefined
  }

  const target = rpcData as Record<string, unknown>
  const existing = (target[RPC_OPERATOR_CONTEXT_KEY] as AuthenticatedGrpcRequestContext | undefined) ?? {}
  const next = {
    ...existing,
    verifiedExecutionToken: input.verifiedExecutionToken,
    verifiedWorkloadIdentity: input.verifiedWorkloadIdentity
  }

  target[RPC_OPERATOR_CONTEXT_KEY] = next
  VERIFIED_EXECUTION_REQUESTS.add(target)
  return next
}

/** Returns verified execution evidence only for request objects stamped by the trusted guard path. */
export function getVerifiedExecutionEvidence(rpcData: unknown):
  | Readonly<{
      verifiedExecutionToken: VerifiedExecutionToken
      verifiedWorkloadIdentity: VerifiedWorkloadIdentity
    }>
  | undefined {
  if (!rpcData || typeof rpcData !== 'object' || !VERIFIED_EXECUTION_REQUESTS.has(rpcData)) {
    return undefined
  }
  const context = getAuthenticatedGrpcRequestContext(rpcData)
  if (!context?.verifiedExecutionToken || !context.verifiedWorkloadIdentity) {
    return undefined
  }
  return Object.freeze({
    verifiedExecutionToken: context.verifiedExecutionToken,
    verifiedWorkloadIdentity: context.verifiedWorkloadIdentity
  })
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
