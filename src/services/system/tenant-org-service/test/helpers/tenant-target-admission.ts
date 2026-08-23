import { Metadata } from '@grpc/grpc-js'
import { Reflector } from '@nestjs/core'
import {
  RPC_AUTHORIZATION_MODE_METADATA_KEY,
  TenantTargetAdmissionGuard,
  type TenantTargetAuditBinder,
  type VerifiedExecutionToken,
  type VerifiedWorkloadIdentity
} from '@oes/common/authorization'
import {
  TENANT_ORG_AUDIENCE,
  TENANT_ORG_GATEWAY_SPIFFE_ID,
  TenantOrgFoundationTrustedExecutionGuard
} from '../../src/modules/tenant-org-trusted-execution.module'
import { TenantOrgTenantTargetAdmissionGuard } from '../../src/modules/tenant-org-tenant-target-admission.guard'

const THUMBPRINT = 'A'.repeat(43)

export interface TenantTargetAdmissionFixtureOptions {
  readonly subjectScope?: 'TENANT' | 'SYSTEM'
  readonly principalType?: 'HUMAN' | 'MACHINE'
  readonly subjectTenantId?: string
  readonly permissionCodes?: readonly string[]
  readonly workloadIdentity?: string
  readonly binder?: TenantTargetAuditBinder
}

/** admitTenantTargetRequest executes Tenant Org's real trusted and target guards for one handler fixture. */
export async function admitTenantTargetRequest<T extends object>(
  controller: Function,
  method: string,
  request: T,
  options: TenantTargetAdmissionFixtureOptions = {}
): Promise<{ readonly binder: TenantTargetAuditBinder; readonly request: T }> {
  const handler = (controller.prototype as Record<string, unknown>)[method] as Function
  const reflector = new Reflector()
  const metadata = new Metadata()
  metadata.set('authorization', 'Bearer e30.e30.e30')
  metadata.set('x-request-id', 'request-tenant-target-1')
  metadata.set('x-trace-id', 'trace-tenant-target-1')
  metadata.set('traceparent', '00-0123456789abcdef0123456789abcdef-0123456789abcdef-01')
  const workloadIdentity = options.workloadIdentity ?? TENANT_ORG_GATEWAY_SPIFFE_ID
  const token = verifiedToken({
    principalType: options.principalType ?? 'HUMAN',
    clientId: workloadIdentity,
    permissionCodes: [...(options.permissionCodes ?? permissionCodesFor(reflector, handler))],
    tenantId: options.subjectTenantId ?? readTenantId(request)
  })
  if (options.subjectScope === 'SYSTEM') {
    delete (token as { tenantId?: string }).tenantId
  }
  if (options.principalType === 'MACHINE') {
    delete (token as { sessionId?: string }).sessionId
    delete (token as { sessionTerminal?: string }).sessionTerminal
  }
  const workload: VerifiedWorkloadIdentity = {
    spiffeId: workloadIdentity,
    certificateThumbprint: THUMBPRINT
  }
  const context = {
    getType: () => 'rpc',
    getHandler: () => handler,
    getClass: () => controller,
    getArgByIndex: () => ({}),
    switchToRpc: () => ({ getContext: () => metadata, getData: () => request })
  }
  const trustedGuard = new TenantOrgFoundationTrustedExecutionGuard(
    reflector,
    { verify: async () => token } as never,
    { getVerifiedWorkloadIdentity: async () => workload } as never
  )
  const binder = options.binder ?? { bind: jest.fn(async () => true) }
  const commonGuard = new TenantTargetAdmissionGuard(reflector, binder)
  const targetGuard = new TenantOrgTenantTargetAdmissionGuard(reflector, commonGuard, binder)

  await trustedGuard.canActivate(context as never)
  await targetGuard.canActivate(context as never)
  return { binder, request }
}

/** Builds one verified direct-Gateway HUMAN execution projection for Tenant Org tests. */
function verifiedToken(overrides: Partial<VerifiedExecutionToken>): VerifiedExecutionToken {
  return {
    issuer: 'https://auth.local.oes',
    audience: TENANT_ORG_AUDIENCE,
    subject: 'account:operator-1',
    principalType: 'HUMAN',
    clientId: TENANT_ORG_GATEWAY_SPIFFE_ID,
    tenantId: 'tenant-1',
    permissionCodes: [],
    tokenId: 'token-tenant-target-1',
    issuedAt: 100,
    notBefore: 100,
    expiresAt: 200,
    certificateThumbprint: THUMBPRINT,
    sessionId: 'session-1',
    sessionTerminal: 'WEB',
    ...overrides
  }
}

/** Reads the handler's exact singleton BUSINESS Code declaration. */
function permissionCodesFor(reflector: Reflector, handler: Function): readonly string[] {
  const declaration = reflector.get<
    | { readonly mode: 'BUSINESS'; readonly permissions: { readonly all: readonly string[] } }
    | undefined
  >(RPC_AUTHORIZATION_MODE_METADATA_KEY, handler)
  return declaration?.permissions.all ?? []
}

/** Reads the canonical camelCase selector supplied by generated Tenant Org requests. */
function readTenantId(request: object): string {
  return String((request as { readonly tenantId?: unknown }).tenantId ?? '')
}
