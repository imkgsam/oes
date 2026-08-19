import {
  applyDecorators,
  CanActivate,
  ExecutionContext,
  Inject,
  Injectable,
  SetMetadata
} from '@nestjs/common'
import { Reflector } from '@nestjs/core'
import { ACCESS_DENIED, ExceptionFactory } from '../../core/exceptions'
import {
  admitTenantTargetSelector,
  AuthorizeBusinessRpc,
  createSystemTenantTargetMethodDeclaration,
  createTenantTargetMethodDeclaration,
  TenantTargetAdmissionDecision,
  type RpcAuthorizationModeDeclaration,
  type TenantTargetAdmissionDeclaration
} from '../trusted-execution'
import { getAuthenticatedGrpcRequestContext } from '../utils'
import { getTrustedExecutionAdmissionEvidence } from './trusted-execution-admission-evidence'

/** Stores target-owned tenant admission declarations separately from Gateway and general RPC metadata. */
export const TENANT_TARGET_ADMISSION_METADATA_KEY = 'oes:trusted-execution:tenant-target-admission'

/** Identifies the target-owned audit binding required before selector admission can reach application code. */
export const TENANT_TARGET_AUDIT_BINDER = Symbol('TenantTargetAuditBinder')

const ADMITTED_TENANT_TARGET = Symbol('OesAdmittedTenantTarget')

/** Supplies exact correlation and an already-authorized target decision to target-owned audit code. */
export type TenantTargetAuditBinding = Readonly<{
  decision: TenantTargetAdmissionDecision
  requestId: string
  traceId: string
}>

/** Binds one target admission decision to the target service audit trail. */
export interface TenantTargetAuditBinder {
  bind(input: TenantTargetAuditBinding): boolean | Promise<boolean>
}

/** Declares an ordinary TENANT target method whose SYSTEM behavior is explicitly denied. */
export const DeclareTenantTargetRpc = (input: { readonly selectorField: string }) =>
  SetMetadata(TENANT_TARGET_ADMISSION_METADATA_KEY, createTenantTargetMethodDeclaration(input))

/** Declares a dedicated SYSTEM tenant-target method with an exact Gateway, Code, and ALL tuple. */
export const DeclareSystemTenantTargetRpc = (input: {
  readonly selectorField: string
  readonly gatewayWorkloadIdentity: string
  readonly permissionCode: string
}) =>
  applyDecorators(
    AuthorizeBusinessRpc({ all: [input.permissionCode] }),
    SetMetadata(
      TENANT_TARGET_ADMISSION_METADATA_KEY,
      createSystemTenantTargetMethodDeclaration(input)
    )
  )

/** Enforces target-owned selector admission after TrustedExecutionGuard and before handler access. */
@Injectable()
export class TenantTargetAdmissionGuard implements CanActivate {
  constructor(
    private readonly reflector: Reflector,
    @Inject(TENANT_TARGET_AUDIT_BINDER)
    private readonly auditBinder: TenantTargetAuditBinder
  ) {}

  /** Authorizes one exact selector and publishes it only after the target audit binding succeeds. */
  async canActivate(context: ExecutionContext): Promise<boolean> {
    if (context.getType() !== 'rpc') {
      throw denied('tenant target admission requires an RPC context')
    }
    const declaration = this.reflector.getAllAndOverride<unknown>(
      TENANT_TARGET_ADMISSION_METADATA_KEY,
      [context.getHandler(), context.getClass()]
    )
    const selectorField = readDeclaredSelectorField(declaration)
    const rpc = context.switchToRpc()
    const data = requireRequestRecord(rpc.getData())
    if (readOwnDescriptor(data, ADMITTED_TENANT_TARGET) !== undefined) {
      throw denied('tenant target admission carrier provenance is ambiguous')
    }
    const selector = readOwnSelector(data, selectorField)
    let execution: ReturnType<typeof getTrustedExecutionAdmissionEvidence>
    try {
      const publicContext = getAuthenticatedGrpcRequestContext(data)
      execution = getTrustedExecutionAdmissionEvidence(data, {
        handler: context.getHandler(),
        currentToken: publicContext?.verifiedExecutionToken,
        currentWorkload: publicContext?.verifiedWorkloadIdentity
      })
    } catch {
      throw denied('verified tenant target execution context is invalid')
    }
    if (execution === undefined) {
      throw denied('verified tenant target execution context is missing')
    }
    if (
      execution.authorizationDeclaration.mode !== 'BUSINESS' ||
      !matchesSystemTargetAuthorization(declaration, execution.authorizationDeclaration)
    ) {
      throw denied('tenant target RPC authorization declaration does not match')
    }
    const requestId = requireCorrelation(execution.requestId, 'request id')
    const traceId = requireCorrelation(execution.traceId, 'trace id')
    if (!this.auditBinder || typeof this.auditBinder.bind !== 'function') {
      throw denied('tenant target audit binding is missing')
    }

    const decision = await admitTenantTargetSelector({
      verifiedExecutionToken: execution.verifiedExecutionToken,
      verifiedWorkloadIdentity: execution.verifiedWorkloadIdentity,
      declaration: declaration as TenantTargetAdmissionDeclaration,
      selector,
      bindAudit: (authorized) =>
        this.auditBinder.bind(Object.freeze({ decision: authorized, requestId, traceId }))
    })
    attachAdmittedTenantTarget(data, decision)
    return true
  }
}

/** Binds dedicated SYSTEM targeting to the same singleton BUSINESS Code admitted by TrustedExecutionGuard. */
function matchesSystemTargetAuthorization(
  targetDeclaration: unknown,
  rpcDeclaration: RpcAuthorizationModeDeclaration
): boolean {
  if (
    targetDeclaration === null ||
    typeof targetDeclaration !== 'object' ||
    Array.isArray(targetDeclaration)
  ) {
    return false
  }
  const kind = readOwnDescriptor(targetDeclaration as Record<PropertyKey, unknown>, 'kind')
  if (kind === undefined || !('value' in kind)) {
    return false
  }
  if (kind.value !== 'SYSTEM_TARGET') {
    return true
  }
  const code = readOwnDescriptor(
    targetDeclaration as Record<PropertyKey, unknown>,
    'permissionCode'
  )
  if (code === undefined || !('value' in code) || typeof code.value !== 'string') {
    return false
  }
  if (rpcDeclaration.mode !== 'BUSINESS') {
    return false
  }
  const permissions = rpcDeclaration.permissions
  const codes = 'all' in permissions ? permissions.all : permissions.any
  return 'all' in permissions && codes.length === 1 && codes[0] === code.value
}

/** Returns the private admitted target for target-service application code without reparsing the request. */
export function requireAdmittedTenantTarget(rpcData: unknown): TenantTargetAdmissionDecision {
  const data = requireRequestRecord(rpcData)
  const descriptor = readOwnDescriptor(data, ADMITTED_TENANT_TARGET)
  if (
    descriptor === undefined ||
    !('value' in descriptor) ||
    descriptor.enumerable ||
    descriptor.writable ||
    descriptor.configurable ||
    !Object.isFrozen(descriptor.value)
  ) {
    throw denied('admitted tenant target is missing')
  }
  return descriptor.value as TenantTargetAdmissionDecision
}

/** Extracts one immutable declaration-owned selector field without invoking metadata accessors. */
function readDeclaredSelectorField(declaration: unknown): string {
  if (
    declaration === null ||
    typeof declaration !== 'object' ||
    Array.isArray(declaration) ||
    !Object.isFrozen(declaration)
  ) {
    throw denied('tenant target method declaration is missing or invalid')
  }
  const descriptor = readOwnDescriptor(declaration as Record<PropertyKey, unknown>, 'selectorField')
  if (
    descriptor === undefined ||
    !('value' in descriptor) ||
    typeof descriptor.value !== 'string'
  ) {
    throw denied('tenant target method declaration is missing or invalid')
  }
  return descriptor.value
}

/** Reads only the exact top-level business selector data property owned by the target request. */
function readOwnSelector(data: Record<PropertyKey, unknown>, selectorField: string): unknown {
  const aliases = selectorFieldAliases(selectorField)
  const present = aliases.filter((field) => readOwnDescriptor(data, field) !== undefined)
  if (present.length !== 1 || present[0] !== selectorField) {
    throw denied('tenant target selector provenance is missing or ambiguous')
  }
  const descriptor = readOwnDescriptor(data, selectorField)
  if (descriptor === undefined || !('value' in descriptor) || !descriptor.enumerable) {
    throw denied('tenant target selector provenance is missing or ambiguous')
  }
  return descriptor.value
}

/** Enumerates only direct camel/snake spellings to reject duplicate selector serialization. */
function selectorFieldAliases(selectorField: string): readonly string[] {
  const snake = selectorField.replace(/[A-Z]/g, (letter) => `_${letter.toLowerCase()}`)
  const camel = selectorField.replace(/_([a-zA-Z0-9])/g, (_, letter: string) =>
    letter.toUpperCase()
  )
  return [...new Set([selectorField, snake, camel])]
}

/** Attaches the admitted decision as a non-enumerable immutable request-private carrier. */
function attachAdmittedTenantTarget(
  data: Record<PropertyKey, unknown>,
  decision: TenantTargetAdmissionDecision
): void {
  try {
    Object.defineProperty(data, ADMITTED_TENANT_TARGET, {
      value: decision,
      enumerable: false,
      writable: false,
      configurable: false
    })
  } catch {
    throw denied('tenant target admission carrier binding failed')
  }
}

/** Requires a mutable request record without accepting arrays or primitive selector carriers. */
function requireRequestRecord(value: unknown): Record<PropertyKey, unknown> {
  if (value === null || typeof value !== 'object' || Array.isArray(value)) {
    throw denied('tenant target business request is missing or invalid')
  }
  return value as Record<PropertyKey, unknown>
}

/** Requires exact trusted correlation before the audit decision is bound. */
function requireCorrelation(value: unknown, label: string): string {
  if (typeof value !== 'string' || value.length === 0 || value.trim() !== value) {
    throw denied(`tenant target admission ${label} is missing or invalid`)
  }
  return value
}

/** Reads an own descriptor without allowing a Proxy trap to escape the stable denial boundary. */
function readOwnDescriptor(
  value: Record<PropertyKey, unknown>,
  property: PropertyKey
): PropertyDescriptor | undefined {
  try {
    return Object.getOwnPropertyDescriptor(value, property)
  } catch {
    throw denied('tenant target admission provenance is invalid')
  }
}

/** Creates the repository's stable 403 denial without exposing selector or credential material. */
function denied(reason: string) {
  return ExceptionFactory.application(ACCESS_DENIED, { reason })
}
