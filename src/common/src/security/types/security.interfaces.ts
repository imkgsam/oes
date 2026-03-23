import { Metadata } from '@grpc/grpc-js'
import {
  InternalServiceAuthenticationResult,
  InternalServicePrincipal
} from './internal-service-auth.types'
import { OperatorContextPayload, UnsignedOperatorContextPayload } from './operator-context-payload'

export interface InternalServiceAuthenticator {
  authenticate(metadata?: Metadata): InternalServiceAuthenticationResult
}

export interface OperatorContextSigner {
  sign(payload: UnsignedOperatorContextPayload): string
}

export interface OperatorContextVerificationResult {
  valid: boolean
  payload?: OperatorContextPayload
  reason?: string
}

export interface OperatorContextVerifier {
  verify(rawPayload: string): OperatorContextVerificationResult
}

export interface OperatorPermissionResolver {
  resolvePermissions(operatorContext: OperatorContextPayload): Promise<string[]>
}

export interface AuthenticatedGrpcRequestContext {
  internalService?: InternalServicePrincipal
  operatorContext?: OperatorContextPayload
}
