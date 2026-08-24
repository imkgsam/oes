import { Metadata } from '@grpc/grpc-js'
import { ConfigService } from '@nestjs/config'
import { Reflector } from '@nestjs/core'
import {
  RPC_AUTHORIZATION_MODE_METADATA_KEY,
  type VerifiedExecutionToken,
  type VerifiedWorkloadIdentity
} from '@oes/common/authorization'
import {
  TENANT_ORG_AUDIENCE,
  TenantOrgFoundationTrustedExecutionGuard
} from '../../src/modules/tenant-org-trusted-execution.module'
import {
  TenantOrgTargetWorkloadRegistry,
  TenantOrgTenantTargetAdmissionGuard
} from '../../src/modules/tenant-org-tenant-target-admission.guard'
import type { TenantOrgTenantTargetAuditBinder } from '../../src/infrastructure/audit/tenant-target-admission-audit.binder'

const THUMBPRINT = 'A'.repeat(43)
export const TEST_TENANT_ORG_GATEWAY_SPIFFE_ID = 'spiffe://local.oes.internal/ns/oes/sa/api-gateway'
export const TEST_TENANT_ORG_AUTH_SPIFFE_ID = 'spiffe://local.oes.internal/ns/oes/sa/auth-service'
export const TEST_TENANT_ORG_PUBLIC_ENTRY_SPIFFE_ID =
  'spiffe://local.oes.internal/ns/oes/sa/public-entry-service'

export type TenantOrgTargetAuditFixture = Pick<
  TenantOrgTenantTargetAuditBinder,
  'bindAdmitted' | 'bindDenied'
>

export interface TenantTargetAdmissionFixtureOptions {
  readonly subjectScope?: 'TENANT' | 'SYSTEM'
  readonly principalType?: 'HUMAN' | 'MACHINE'
  readonly subjectTenantId?: string
  readonly permissionCodes?: readonly string[]
  readonly workloadIdentity?: string
  readonly binder?: TenantOrgTargetAuditFixture
}

/** admitTenantTargetRequest executes Tenant Org's real trusted and target guards for one handler fixture. */
export async function admitTenantTargetRequest<T extends object>(
  controller: Function,
  method: string,
  request: T,
  options: TenantTargetAdmissionFixtureOptions = {}
): Promise<{ readonly binder: TenantOrgTargetAuditFixture; readonly request: T }> {
  const handler = (controller.prototype as Record<string, unknown>)[method] as Function
  const reflector = new Reflector()
  const metadata = new Metadata()
  metadata.set('authorization', 'Bearer e30.e30.e30')
  metadata.set('x-request-id', 'request-tenant-target-1')
  metadata.set('x-trace-id', 'trace-tenant-target-1')
  metadata.set('traceparent', '00-0123456789abcdef0123456789abcdef-0123456789abcdef-01')
  const workloadIdentity = options.workloadIdentity ?? TEST_TENANT_ORG_GATEWAY_SPIFFE_ID
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
  const binder = options.binder ?? defaultAuditBinder()
  const trustedGuard = new TenantOrgFoundationTrustedExecutionGuard(
    reflector,
    { verify: async () => token } as never,
    { getVerifiedWorkloadIdentity: async () => workload } as never,
    binder as never
  )
  const workloads = new TenantOrgTargetWorkloadRegistry(
    new ConfigService({
      TENANT_ORG_GATEWAY_SPIFFE_ID: TEST_TENANT_ORG_GATEWAY_SPIFFE_ID,
      TENANT_ORG_AUTH_SPIFFE_ID: TEST_TENANT_ORG_AUTH_SPIFFE_ID,
      TENANT_ORG_PUBLIC_ENTRY_SPIFFE_ID: TEST_TENANT_ORG_PUBLIC_ENTRY_SPIFFE_ID
    })
  )
  const targetGuard = new TenantOrgTenantTargetAdmissionGuard(
    reflector,
    workloads,
    binder as TenantOrgTenantTargetAuditBinder
  )

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
    clientId: TEST_TENANT_ORG_GATEWAY_SPIFFE_ID,
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

/** Creates an audit sink double that accepts admitted and denied decision records. */
function defaultAuditBinder(): TenantOrgTargetAuditFixture {
  return {
    bindAdmitted: jest.fn(() => true),
    bindDenied: jest.fn(() => true)
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
