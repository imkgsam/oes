import {
  applyDecorators,
  CanActivate,
  ExecutionContext,
  Injectable,
  SetMetadata
} from '@nestjs/common'
import { ConfigService } from '@nestjs/config'
import { Reflector } from '@nestjs/core'
import {
  AuthorizeBusinessRpc,
  createSystemTenantTargetMethodDeclaration,
  createTenantTargetMethodDeclaration,
  getAuthenticatedGrpcRequestContext,
  TENANT_TARGET_ADMISSION_METADATA_KEY,
  TenantTargetAdmissionGuard,
  type TenantTargetAuditBinder
} from '@oes/common/authorization'
import { ACCESS_DENIED, ExceptionFactory } from '@oes/common/exceptions'
import {
  readTenantOrgTargetAuditCorrelation,
  TenantOrgTenantTargetAuditBinder,
  type TenantOrgTargetAuditStage,
  type TenantOrgTargetDenialReason
} from '../infrastructure/audit/tenant-target-admission-audit.binder'

export const TENANT_ORG_TARGET_METHOD_METADATA_KEY =
  'oes:tenant-org:tenant-target-method-declaration'

export type TenantOrgTargetWorkloadConfigKey =
  | 'TENANT_ORG_GATEWAY_SPIFFE_ID'
  | 'TENANT_ORG_AUTH_SPIFFE_ID'
  | 'TENANT_ORG_PUBLIC_ENTRY_SPIFFE_ID'

type TenantOrgTenantOnlyTargetDeclaration = Readonly<{
  kind: 'TENANT_ORG_TENANT_SYSTEM_DENY'
  methodReference: string
  selectorField: 'tenantId'
  tenantAuthority: 'TOKEN_TENANT_EQUALITY'
  systemAuthority: 'DENY'
  permissionCode: string
}>

type TenantOrgSystemTargetDeclaration = Readonly<{
  kind: 'TENANT_ORG_SYSTEM_TARGET'
  methodReference: string
  selectorField: 'tenantId'
  tenantAuthority: 'TOKEN_TENANT_EQUALITY'
  systemAuthority: 'DEDICATED'
  gatewayWorkloadConfigKey: 'TENANT_ORG_GATEWAY_SPIFFE_ID'
  machineWorkloadConfigKeys: readonly Exclude<
    TenantOrgTargetWorkloadConfigKey,
    'TENANT_ORG_GATEWAY_SPIFFE_ID'
  >[]
  permissionCode: string
  range: 'ALL'
}>

type TenantOrgTargetMethodDeclaration =
  | TenantOrgTenantOnlyTargetDeclaration
  | TenantOrgSystemTargetDeclaration

const WORKLOAD_CONFIG = Object.freeze({
  TENANT_ORG_GATEWAY_SPIFFE_ID: 'api-gateway',
  TENANT_ORG_AUTH_SPIFFE_ID: 'auth-service',
  TENANT_ORG_PUBLIC_ENTRY_SPIFFE_ID: 'public-entry-service'
} satisfies Readonly<Record<TenantOrgTargetWorkloadConfigKey, string>>)

/** Declares one Tenant Org selector method and its exact runtime workload configuration slots. */
export function DeclareTenantOrgTargetRpc(input: {
  readonly methodReference: string
  readonly permissionCode: string
  readonly systemAuthority: 'DEDICATED' | 'DENY'
  readonly machineWorkloadConfigKeys?: readonly Exclude<
    TenantOrgTargetWorkloadConfigKey,
    'TENANT_ORG_GATEWAY_SPIFFE_ID'
  >[]
}) {
  const declaration: TenantOrgTargetMethodDeclaration =
    input.systemAuthority === 'DEDICATED'
      ? Object.freeze({
          kind: 'TENANT_ORG_SYSTEM_TARGET',
          methodReference: input.methodReference,
          selectorField: 'tenantId',
          tenantAuthority: 'TOKEN_TENANT_EQUALITY',
          systemAuthority: 'DEDICATED',
          gatewayWorkloadConfigKey: 'TENANT_ORG_GATEWAY_SPIFFE_ID',
          machineWorkloadConfigKeys: Object.freeze([...(input.machineWorkloadConfigKeys ?? [])]),
          permissionCode: input.permissionCode,
          range: 'ALL'
        })
      : Object.freeze({
          kind: 'TENANT_ORG_TENANT_SYSTEM_DENY',
          methodReference: input.methodReference,
          selectorField: 'tenantId',
          tenantAuthority: 'TOKEN_TENANT_EQUALITY',
          systemAuthority: 'DENY',
          permissionCode: input.permissionCode
        })
  return applyDecorators(
    AuthorizeBusinessRpc({ all: [input.permissionCode] }),
    SetMetadata(TENANT_ORG_TARGET_METHOD_METADATA_KEY, declaration)
  )
}

/** Resolves exact full SPIFFE identities after ConfigModule has loaded deployment configuration. */
@Injectable()
export class TenantOrgTargetWorkloadRegistry {
  private readonly identities: Readonly<Record<TenantOrgTargetWorkloadConfigKey, string>>

  constructor(config: ConfigService) {
    const environment = config.get<string>('NODE_ENV') ?? 'development'
    this.identities = Object.freeze(
      Object.fromEntries(
        Object.entries(WORKLOAD_CONFIG).map(([key, workload]) => [
          key,
          resolveWorkloadIdentity(
            config,
            key as TenantOrgTargetWorkloadConfigKey,
            workload,
            environment
          )
        ])
      ) as Record<TenantOrgTargetWorkloadConfigKey, string>
    )
  }

  /** Returns the exact immutable identity bound to one declaration-owned configuration slot. */
  get(key: TenantOrgTargetWorkloadConfigKey): string {
    return this.identities[key]
  }
}

/** TenantOrgTenantTargetAdmissionGuard translates local declarations into exact Common admission. */
@Injectable()
export class TenantOrgTenantTargetAdmissionGuard implements CanActivate {
  constructor(
    private readonly reflector: Reflector,
    private readonly workloads: TenantOrgTargetWorkloadRegistry,
    private readonly auditBinder: TenantOrgTenantTargetAuditBinder
  ) {}

  /** Admits one selector through Common and records both success and applicable denial results. */
  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToRpc().getData()
    const authenticated = getAuthenticatedGrpcRequestContext(request)
    const rawDeclaration = this.reflector.getAllAndOverride<unknown>(
      TENANT_ORG_TARGET_METHOD_METADATA_KEY,
      [context.getHandler(), context.getClass()]
    )
    const methodReference = readMethodReference(rawDeclaration)

    try {
      const declaration = requireTargetMethodDeclaration(rawDeclaration)
      const commonDeclaration = this.toCommonDeclaration(declaration, authenticated)
      const reflector = overrideTargetDeclaration(this.reflector, commonDeclaration)
      const binder: TenantTargetAuditBinder = {
        bind: (input) => this.auditBinder.bindAdmitted(declaration.methodReference, input)
      }
      return await new TenantTargetAdmissionGuard(reflector, binder).canActivate(context)
    } catch (error) {
      const audit = classifyTargetDenial(error)
      const correlation = readTenantOrgTargetAuditCorrelation(context, authenticated)
      const bound = this.auditBinder.bindDenied({
        methodReference,
        ...correlation,
        stage: audit.stage,
        stableReason: audit.stableReason
      })
      if (bound !== true) throw denied('TenantOrg target denial audit binding failed')
      throw error
    }
  }

  /** Resolves a local declaration to the exact immutable shape enforced by Common. */
  private toCommonDeclaration(
    declaration: TenantOrgTargetMethodDeclaration,
    authenticated: ReturnType<typeof getAuthenticatedGrpcRequestContext>
  ) {
    if (declaration.systemAuthority === 'DENY') {
      return createTenantTargetMethodDeclaration({ selectorField: declaration.selectorField })
    }

    const token = authenticated?.verifiedExecutionToken
    const workload = authenticated?.verifiedWorkloadIdentity
    let workloadKey: TenantOrgTargetWorkloadConfigKey = declaration.gatewayWorkloadConfigKey
    if (token?.principalType === 'MACHINE') {
      if (token.tenantId !== undefined || token.orgId !== undefined || !workload) {
        throw denied('TenantOrg MACHINE tenant target authority does not match')
      }
      const exactKey = declaration.machineWorkloadConfigKeys.find(
        (key) => this.workloads.get(key) === workload.spiffeId
      )
      if (exactKey === undefined) {
        throw denied('TenantOrg MACHINE tenant target authority does not match')
      }
      workloadKey = exactKey
    }

    return createSystemTenantTargetMethodDeclaration({
      selectorField: declaration.selectorField,
      gatewayWorkloadIdentity: this.workloads.get(workloadKey),
      permissionCode: declaration.permissionCode
    })
  }
}

/** Returns the target method reference for trusted-denial auditing without accepting arbitrary metadata. */
export function getTenantOrgTargetMethodReference(
  reflector: Reflector,
  context: ExecutionContext
): string | undefined {
  const declaration = reflector.getAllAndOverride<unknown>(TENANT_ORG_TARGET_METHOD_METADATA_KEY, [
    context.getHandler(),
    context.getClass()
  ])
  const reference = readMethodReference(declaration)
  return reference === 'tenant-org-service/unknown-target-method' ? undefined : reference
}

/** Validates the complete immutable Tenant Org method declaration before resolving config. */
function requireTargetMethodDeclaration(value: unknown): TenantOrgTargetMethodDeclaration {
  if (!isFrozenRecord(value)) throw denied('TenantOrg target method declaration is invalid')
  const commonValid =
    isMethodReference(value.methodReference) &&
    value.selectorField === 'tenantId' &&
    value.tenantAuthority === 'TOKEN_TENANT_EQUALITY' &&
    isPermissionCode(value.permissionCode)
  if (
    commonValid &&
    value.kind === 'TENANT_ORG_TENANT_SYSTEM_DENY' &&
    value.systemAuthority === 'DENY' &&
    hasExactKeys(value, [
      'kind',
      'methodReference',
      'permissionCode',
      'selectorField',
      'systemAuthority',
      'tenantAuthority'
    ])
  ) {
    return value as TenantOrgTenantOnlyTargetDeclaration
  }
  if (
    commonValid &&
    value.kind === 'TENANT_ORG_SYSTEM_TARGET' &&
    value.systemAuthority === 'DEDICATED' &&
    value.gatewayWorkloadConfigKey === 'TENANT_ORG_GATEWAY_SPIFFE_ID' &&
    value.range === 'ALL' &&
    isMachineWorkloadKeys(value.machineWorkloadConfigKeys) &&
    hasExactKeys(value, [
      'gatewayWorkloadConfigKey',
      'kind',
      'machineWorkloadConfigKeys',
      'methodReference',
      'permissionCode',
      'range',
      'selectorField',
      'systemAuthority',
      'tenantAuthority'
    ])
  ) {
    return value as TenantOrgSystemTargetDeclaration
  }
  throw denied('TenantOrg target method declaration is invalid')
}

/** Creates a Reflector view that exposes only the exact runtime Common target declaration. */
function overrideTargetDeclaration(reflector: Reflector, declaration: unknown): Reflector {
  const exact = Object.create(reflector) as Reflector
  Object.defineProperty(exact, 'getAllAndOverride', {
    value: ((key: unknown, targets: Function[]) =>
      key === TENANT_TARGET_ADMISSION_METADATA_KEY
        ? declaration
        : (
            reflector.getAllAndOverride as (
              metadataKey: unknown,
              metadataTargets: Function[]
            ) => unknown
          )(key, targets)) as Reflector['getAllAndOverride']
  })
  return exact
}

/** Resolves and validates one deployment identity only after configuration initialization. */
function resolveWorkloadIdentity(
  config: ConfigService,
  key: TenantOrgTargetWorkloadConfigKey,
  workload: string,
  environment: string
): string {
  const configured = config.get<string>(key)
  if (configured !== undefined) {
    if (isExactWorkloadSpiffeId(configured, workload)) return configured
    throw new Error(`TenantOrg ${workload} SPIFFE identity is invalid`)
  }
  if (environment !== 'production') {
    return `spiffe://local.oes.internal/ns/oes/sa/${workload}`
  }
  throw new Error(`TenantOrg ${workload} SPIFFE identity is required`)
}

/** Validates a full non-wildcard SPIFFE identity for one exact workload role. */
function isExactWorkloadSpiffeId(value: string, workload: string): boolean {
  if (value.length === 0 || value.length > 512 || value.trim() !== value || /\s|\*/.test(value)) {
    return false
  }
  try {
    const parsed = new URL(value)
    return (
      parsed.protocol === 'spiffe:' &&
      parsed.hostname.length > 0 &&
      parsed.username === '' &&
      parsed.password === '' &&
      parsed.port === '' &&
      parsed.search === '' &&
      parsed.hash === '' &&
      parsed.pathname.split('/').filter(Boolean).at(-1) === workload
    )
  } catch {
    return false
  }
}

/** Classifies internal denial text into a stable credential-free audit stage and reason. */
function classifyTargetDenial(error: unknown): {
  readonly stage: TenantOrgTargetAuditStage
  readonly stableReason: TenantOrgTargetDenialReason
} {
  const reason = readInternalReason(error)
  if (reason.includes('audit binding')) {
    return { stage: 'TARGET_AUDIT_BINDING', stableReason: 'AUDIT_BINDING_FAILED' }
  }
  if (reason.includes('does not equal')) {
    return { stage: 'TARGET_SELECTOR_ADMISSION', stableReason: 'SELECTOR_SCOPE_MISMATCH' }
  }
  if (reason.includes('selector')) {
    return { stage: 'TARGET_SELECTOR_ADMISSION', stableReason: 'SELECTOR_INVALID' }
  }
  if (reason.includes('declaration')) {
    return { stage: 'TARGET_METHOD_AUTHORITY', stableReason: 'METHOD_DECLARATION_INVALID' }
  }
  if (reason.includes('authority') || reason.includes('authorization')) {
    return { stage: 'TARGET_METHOD_AUTHORITY', stableReason: 'WORKLOAD_OR_CODE_MISMATCH' }
  }
  return { stage: 'TARGET_SELECTOR_ADMISSION', stableReason: 'TARGET_ADMISSION_DENIED' }
}

/** Reads only the local stable denial explanation and never serializes the exception. */
function readInternalReason(error: unknown): string {
  if (error === null || typeof error !== 'object') return ''
  const details = (error as { readonly additionalDetails?: unknown }).additionalDetails
  if (details === null || typeof details !== 'object') return ''
  const reason = (details as { readonly reason?: unknown }).reason
  return typeof reason === 'string' ? reason : ''
}

/** Reads a valid method reference or returns the fixed audit-safe unknown marker. */
function readMethodReference(value: unknown): string {
  if (value !== null && typeof value === 'object' && !Array.isArray(value)) {
    const reference = (value as { readonly methodReference?: unknown }).methodReference
    if (isMethodReference(reference)) return reference
  }
  return 'tenant-org-service/unknown-target-method'
}

/** Checks the canonical target method reference syntax. */
function isMethodReference(value: unknown): value is string {
  return (
    typeof value === 'string' &&
    /^tenant-org-service\/[A-Za-z][A-Za-z0-9]*Service\/[A-Z][A-Za-z0-9]*$/.test(value)
  )
}

/** Checks one existing canonical Permission Code. */
function isPermissionCode(value: unknown): value is string {
  return typeof value === 'string' && /^[a-z][a-z0-9]*(?:[._:-][a-z0-9]+)+$/.test(value)
}

/** Checks the frozen exact MACHINE workload config-key list. */
function isMachineWorkloadKeys(value: unknown): boolean {
  return (
    Array.isArray(value) &&
    Object.isFrozen(value) &&
    value.every(
      (key) => key === 'TENANT_ORG_AUTH_SPIFFE_ID' || key === 'TENANT_ORG_PUBLIC_ENTRY_SPIFFE_ID'
    ) &&
    new Set(value).size === value.length
  )
}

/** Checks an immutable plain declaration record. */
function isFrozenRecord(value: unknown): value is Record<string, unknown> {
  return (
    value !== null &&
    typeof value === 'object' &&
    !Array.isArray(value) &&
    Object.isFrozen(value) &&
    Object.getPrototypeOf(value) === Object.prototype
  )
}

/** Checks exact declaration keys without permitting authority-extending metadata. */
function hasExactKeys(value: Record<string, unknown>, expected: readonly string[]): boolean {
  const actual = Object.keys(value).sort()
  const canonical = [...expected].sort()
  return (
    actual.length === canonical.length && actual.every((key, index) => key === canonical[index])
  )
}

/** Creates the stable target-admission denial used by the Common guard. */
function denied(reason: string) {
  return ExceptionFactory.application(ACCESS_DENIED, { reason })
}
