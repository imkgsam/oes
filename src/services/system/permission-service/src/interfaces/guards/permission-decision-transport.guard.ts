import { CanActivate, ExecutionContext, Inject, Injectable } from '@nestjs/common'
import { Metadata } from '@grpc/grpc-js'
import { Reflector } from '@nestjs/core'
import {
  ExecutionTokenVerifier,
  getGrpcAuthorizationBearer,
  getGrpcMetadataValue
} from '@oes/common/authorization'
import { GrpcWorkloadIdentityProvider } from '@oes/common/transport'
import { PermissionDecisionCallerContext } from '../../application/authorization/permission-decision-caller-context'
import {
  PERMISSION_DECISION_TRANSPORT_METADATA_KEY,
  PermissionDecisionTransportDeclaration
} from '../decorators/permission-decision-transport.decorator'

const CALLER_CONTEXT = Symbol('PermissionDecisionCallerContext')
const TRACEPARENT_PATTERN = /^00-([0-9a-f]{32})-[0-9a-f]{16}-[0-9a-f]{2}$/i
export const PERMISSION_AUTH_SERVICE_SPIFFE_ID = Symbol('PermissionAuthServiceSpiffeId')
export const PERMISSION_DECISION_TARGET_AUDIENCE = Symbol('PermissionDecisionTargetAudience')

/** Enforces exact Auth mTLS identity plus the method-specific token policy without legacy fallback. */
@Injectable()
export class PermissionDecisionTransportGuard implements CanActivate {
  constructor(
    private readonly reflector: Reflector,
    private readonly verifier: ExecutionTokenVerifier,
    private readonly workloadIdentityProvider: GrpcWorkloadIdentityProvider,
    @Inject(PERMISSION_AUTH_SERVICE_SPIFFE_ID)
    private readonly expectedAuthSpiffeId: string,
    @Inject(PERMISSION_DECISION_TARGET_AUDIENCE)
    private readonly targetAudience: string
  ) {
    if (
      !expectedAuthSpiffeId.startsWith('spiffe://') ||
      expectedAuthSpiffeId.includes('*') ||
      targetAudience !== 'urn:oes:service:permission-service'
    ) {
      throw new Error('Permission decision transport configuration is invalid')
    }
  }

  /** Validates one declared decision method and attaches only verified safe caller claims. */
  async canActivate(context: ExecutionContext): Promise<boolean> {
    const declaration = this.reflector.getAllAndOverride<PermissionDecisionTransportDeclaration>(
      PERMISSION_DECISION_TRANSPORT_METADATA_KEY,
      [context.getHandler(), context.getClass()]
    )
    if (!declaration) throw new Error('Permission decision transport declaration is required')

    const request = context.switchToRpc().getData<unknown>()
    const metadata = context.switchToRpc().getContext<Metadata>()
    const call = context.getArgByIndex(2)
    const workload = await this.workloadIdentityProvider.getVerifiedWorkloadIdentity(call)
    if (workload.spiffeId !== this.expectedAuthSpiffeId) {
      throw new Error('Permission decision caller workload is not the exact Auth identity')
    }

    const correlation = readCorrelation(metadata)
    if (declaration.mode === 'BOOTSTRAP') {
      if (getGrpcMetadataValue(metadata, 'authorization') !== undefined) {
        throw new Error('Permission workload bootstrap is mTLS-only')
      }
      attachPermissionDecisionCallerContext(request, {
        directWorkloadSpiffeId: workload.spiffeId,
        certificateThumbprint: workload.certificateThumbprint,
        ...correlation
      })
      return true
    }

    const token = getGrpcAuthorizationBearer(metadata)
    if (!token) throw new Error('Permission decision ExecutionToken is required')
    const verified = await this.verifier.verify({
      token,
      targetAudience: this.targetAudience,
      workloadIdentity: workload
    })
    if (
      verified.permissionCodes.length !== 1 ||
      verified.permissionCodes[0] !== declaration.permissionCode
    ) {
      throw new Error(
        'Permission decision ExecutionToken must contain the exact Permission decision Code'
      )
    }

    attachPermissionDecisionCallerContext(request, {
      directWorkloadSpiffeId: workload.spiffeId,
      certificateThumbprint: workload.certificateThumbprint,
      ...correlation,
      verifiedExecutionToken: {
        subject: verified.subject,
        principalType: verified.principalType,
        tenantId: verified.tenantId,
        orgId: verified.orgId,
        sessionId: verified.sessionId,
        delegationId: verified.delegationId,
        authzVersion: verified.authzVersion
      }
    })
    return true
  }
}

/** Reads the transport-verified decision caller context attached by the guard. */
export function getPermissionDecisionCallerContext(
  request: unknown
): PermissionDecisionCallerContext {
  if (!request || typeof request !== 'object') {
    throw new Error('Permission decision caller context is required')
  }
  const caller = (request as Record<PropertyKey, unknown>)[CALLER_CONTEXT]
  if (!caller) throw new Error('Permission decision caller context is required')
  return caller as PermissionDecisionCallerContext
}

/** Attaches safe verified caller claims as non-enumerable interface-only request context. */
function attachPermissionDecisionCallerContext(
  request: unknown,
  caller: PermissionDecisionCallerContext
): void {
  if (!request || typeof request !== 'object') {
    throw new Error('Permission decision request object is required')
  }
  Object.defineProperty(request, CALLER_CONTEXT, {
    value: Object.freeze(caller),
    configurable: false,
    enumerable: false,
    writable: false
  })
}

/** Extracts bounded request/trace correlation without treating metadata as authorization. */
function readCorrelation(metadata: Metadata | undefined): { requestId?: string; traceId?: string } {
  const requestId = getGrpcMetadataValue(metadata, 'x-request-id')
  const traceparent = getGrpcMetadataValue(metadata, 'traceparent')
  const traceId = traceparent
    ? TRACEPARENT_PATTERN.exec(traceparent)?.[1]?.toLowerCase()
    : undefined
  return {
    ...(requestId ? { requestId } : {}),
    ...(traceId ? { traceId } : {})
  }
}
