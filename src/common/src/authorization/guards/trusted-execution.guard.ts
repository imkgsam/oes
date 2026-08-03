import { CanActivate, ExecutionContext, Injectable } from '@nestjs/common'
import { Metadata } from '@grpc/grpc-js'
import { Reflector } from '@nestjs/core'
import { ACCESS_DENIED, ExceptionFactory } from '../../core/exceptions'
import {
  AUTHORIZATION_METADATA_KEY,
  REQUEST_ID_METADATA_KEY,
  TRACEPARENT_METADATA_KEY
} from '../constants'
import {
  RPC_AUTHORIZATION_MODE_METADATA_KEY,
  type RpcAuthorizationModeDeclaration
} from '../trusted-execution/declarations'
import {
  ExecutionTokenVerifier,
  type VerifiedExecutionToken
} from '../trusted-execution/execution-token-verifier'
import { createTrustedExecutionContext } from '../trusted-execution/trusted-execution-context'
import { TrustedExecutionContextStore } from '../trusted-execution/trusted-execution-context-store'
import { getGrpcAuthorizationBearer } from '../utils'
import type { GrpcWorkloadIdentityProvider } from '../../transport/grpc/grpc-workload-identity.provider'

/** Enforces exactly one declared trusted-execution mode from mTLS-bound bearer authority without legacy fallback. */
@Injectable()
export class TrustedExecutionGuard implements CanActivate {
  constructor(
    private readonly reflector: Reflector,
    private readonly verifier: ExecutionTokenVerifier,
    private readonly workloadIdentityProvider: GrpcWorkloadIdentityProvider,
    private readonly contextStore: TrustedExecutionContextStore,
    private readonly targetAudience: string
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const declaration = this.readSingleDeclaration(context)
    const rpcContext = context.switchToRpc()
    const metadata = rpcContext.getContext<Metadata>()
    const rpcData = rpcContext.getData()
    const token = getGrpcAuthorizationBearer(metadata, AUTHORIZATION_METADATA_KEY)
    if (!token) throw denied('trusted execution token is missing')
    const workloadIdentity = await this.workloadIdentityProvider.getVerifiedWorkloadIdentity(
      context.getArgByIndex(2)
    )
    const verifiedToken = await this.verifier.verify({
      token,
      targetAudience: this.targetAudience,
      workloadIdentity
    })
    assertModeAuthorization(declaration, verifiedToken)
    this.contextStore.attach(rpcData, toTrustedExecutionContext(verifiedToken, metadata))
    return true
  }

  /** Rejects an undeclared or ambiguously declared RPC before any token verification can authorize it. */
  private readSingleDeclaration(context: ExecutionContext): RpcAuthorizationModeDeclaration {
    const declarations = this.reflector
      .getAll<RpcAuthorizationModeDeclaration>(RPC_AUTHORIZATION_MODE_METADATA_KEY as never, [
        context.getHandler(),
        context.getClass()
      ])
      .filter(
        (declaration): declaration is RpcAuthorizationModeDeclaration => declaration !== undefined
      )
    if (declarations.length !== 1) {
      throw denied('trusted execution RPC must declare exactly one authorization mode')
    }
    return declarations[0]
  }
}

/** Applies the frozen mode-specific authorization rule after Common has verified transport and token binding. */
function assertModeAuthorization(
  declaration: RpcAuthorizationModeDeclaration,
  token: VerifiedExecutionToken
): void {
  if (declaration.mode === 'SELF_SERVICE') {
    if (token.principalType !== 'HUMAN' && token.principalType !== 'DELEGATED') {
      throw denied('SELF_SERVICE execution requires a HUMAN or DELEGATED principal')
    }
    if (token.principalType === 'DELEGATED' && !declaration.allowDelegated) {
      throw denied('SELF_SERVICE execution does not allow delegation')
    }
    return
  }
  const granted = new Set(token.permissionCodes)
  if ('all' in declaration.permissions) {
    const missing = declaration.permissions.all.filter((code) => !granted.has(code))
    if (missing.length > 0)
      throw denied('trusted execution token is missing required permission codes', missing)
    return
  }
  if (!declaration.permissions.any.some((code) => granted.has(code))) {
    throw denied(
      'trusted execution token is missing any accepted permission code',
      declaration.permissions.any
    )
  }
}

/** Builds the downstream root solely from verified claims and required correlation metadata. */
function toTrustedExecutionContext(token: VerifiedExecutionToken, metadata: Metadata) {
  const base = {
    subject: token.subject,
    principalType: token.principalType,
    ...(token.tenantId === undefined ? {} : { tenantId: token.tenantId }),
    ...(token.orgId === undefined ? {} : { orgId: token.orgId }),
    ...(token.sessionId === undefined ? {} : { sessionId: token.sessionId }),
    ...(token.authzVersion === undefined ? {} : { authzVersion: token.authzVersion }),
    requestId: metadataValue(metadata, REQUEST_ID_METADATA_KEY, 'request id'),
    traceparent: metadataValue(metadata, TRACEPARENT_METADATA_KEY, 'traceparent')
  } as const
  if (token.principalType !== 'DELEGATED') return createTrustedExecutionContext(base)
  if (typeof token.delegationId !== 'string' || token.delegationId.length === 0) {
    throw denied('DELEGATED execution token is missing delegation id')
  }
  return createTrustedExecutionContext({
    ...base,
    actor: actorSubject(token.actor),
    delegationId: token.delegationId
  })
}

/** Reads one exact string correlation value without collapsing malformed metadata into authority. */
function metadataValue(metadata: Metadata, key: string, label: string): string {
  const values = metadata.get(key)
  if (values.length !== 1 || typeof values[0] !== 'string') {
    throw denied(`trusted execution ${label} metadata is required`)
  }
  return values[0]
}

/** Extracts the frozen delegated actor subject from the verified structured act claim only. */
function actorSubject(actor: unknown): string {
  if (typeof actor === 'string' && actor.length > 0) return actor
  if (
    actor !== null &&
    typeof actor === 'object' &&
    typeof (actor as Record<string, unknown>).sub === 'string' &&
    (actor as Record<string, unknown>).sub !== ''
  ) {
    return (actor as Record<string, string>).sub
  }
  throw denied('DELEGATED execution token actor is invalid')
}

/** Produces the same structured access-denied error for every fail-closed authorization outcome. */
function denied(reason: string, permissionCodes?: readonly string[]) {
  return ExceptionFactory.application(ACCESS_DENIED, {
    reason,
    ...(permissionCodes === undefined ? {} : { permissionCodes })
  })
}
