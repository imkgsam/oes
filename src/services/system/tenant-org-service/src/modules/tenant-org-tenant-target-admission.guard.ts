import { CanActivate, ExecutionContext, Inject, Injectable, SetMetadata } from '@nestjs/common'
import { Reflector } from '@nestjs/core'
import {
  createSystemTenantTargetMethodDeclaration,
  getAuthenticatedGrpcRequestContext,
  TENANT_TARGET_ADMISSION_METADATA_KEY,
  TENANT_TARGET_AUDIT_BINDER,
  TenantTargetAdmissionGuard,
  type TenantTargetAuditBinder
} from '@oes/common/authorization'
import { ACCESS_DENIED, ExceptionFactory } from '@oes/common/exceptions'

export const TENANT_ORG_MACHINE_TARGET_METADATA_KEY =
  'oes:tenant-org:machine-tenant-target-admission'

type TenantOrgMachineWorkload = 'auth-service' | 'public-entry-service'

type TenantOrgMachineTargetDeclaration = Readonly<{
  selectorField: 'tenantId'
  permissionCode: string
  workloads: readonly TenantOrgMachineWorkload[]
}>

/** Declares the frozen pre-session/public MACHINE exceptions on an existing Tenant Org target RPC. */
export const DeclareTenantOrgMachineTargetRpc = (input: {
  readonly permissionCode: string
  readonly workloads: readonly TenantOrgMachineWorkload[]
}) =>
  SetMetadata(
    TENANT_ORG_MACHINE_TARGET_METADATA_KEY,
    Object.freeze({
      selectorField: 'tenantId' as const,
      permissionCode: input.permissionCode,
      workloads: Object.freeze([...input.workloads])
    })
  )

/** TenantOrgTenantTargetAdmissionGuard preserves exact MACHINE reads and delegates HUMAN admission to Common. */
@Injectable()
export class TenantOrgTenantTargetAdmissionGuard implements CanActivate {
  constructor(
    private readonly reflector: Reflector,
    private readonly commonGuard: TenantTargetAdmissionGuard,
    @Inject(TENANT_TARGET_AUDIT_BINDER)
    private readonly auditBinder: TenantTargetAuditBinder
  ) {}

  /** Applies the method-owned MACHINE tuple or the canonical HUMAN tenant-target guard. */
  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToRpc().getData()
    const authenticated = getAuthenticatedGrpcRequestContext(request)
    const token = authenticated?.verifiedExecutionToken
    if (token?.principalType !== 'MACHINE') {
      return this.commonGuard.canActivate(context)
    }

    const declaration = this.reflector.getAllAndOverride<unknown>(
      TENANT_ORG_MACHINE_TARGET_METADATA_KEY,
      [context.getHandler(), context.getClass()]
    )
    const machine = requireMachineDeclaration(declaration)
    const workload = authenticated?.verifiedWorkloadIdentity
    const workloadName = readWorkloadName(workload?.spiffeId ?? '')
    if (
      token.tenantId !== undefined ||
      token.orgId !== undefined ||
      !workload ||
      token.clientId !== workload.spiffeId ||
      !machine.workloads.includes(workloadName as TenantOrgMachineWorkload)
    ) {
      throw denied('TenantOrg MACHINE tenant target authority does not match')
    }

    const targetDeclaration = createSystemTenantTargetMethodDeclaration({
      selectorField: machine.selectorField,
      gatewayWorkloadIdentity: workload.spiffeId,
      permissionCode: machine.permissionCode
    })
    const machineReflector = Object.create(this.reflector) as Reflector
    Object.defineProperty(machineReflector, 'getAllAndOverride', {
      value: ((key: unknown, targets: Function[]) =>
        key === TENANT_TARGET_ADMISSION_METADATA_KEY
          ? targetDeclaration
          : (
              this.reflector.getAllAndOverride as (
                metadataKey: unknown,
                metadataTargets: Function[]
              ) => unknown
            )(key, targets)) as Reflector['getAllAndOverride']
    })
    return new TenantTargetAdmissionGuard(machineReflector, this.auditBinder).canActivate(context)
  }
}

/** Validates immutable method metadata before it can select a MACHINE target exception. */
function requireMachineDeclaration(value: unknown): TenantOrgMachineTargetDeclaration {
  if (
    value === null ||
    typeof value !== 'object' ||
    Array.isArray(value) ||
    !Object.isFrozen(value)
  ) {
    throw denied('TenantOrg MACHINE tenant target declaration is missing')
  }
  const declaration = value as Partial<TenantOrgMachineTargetDeclaration>
  if (
    declaration.selectorField !== 'tenantId' ||
    typeof declaration.permissionCode !== 'string' ||
    !Array.isArray(declaration.workloads) ||
    !Object.isFrozen(declaration.workloads) ||
    declaration.workloads.length === 0 ||
    declaration.workloads.some(
      (workload) => workload !== 'auth-service' && workload !== 'public-entry-service'
    ) ||
    new Set(declaration.workloads).size !== declaration.workloads.length ||
    Object.keys(declaration).sort().join(',') !== 'permissionCode,selectorField,workloads'
  ) {
    throw denied('TenantOrg MACHINE tenant target declaration is invalid')
  }
  return declaration as TenantOrgMachineTargetDeclaration
}

/** Extracts the exact terminal workload name from a verified SPIFFE URI. */
function readWorkloadName(spiffeId: string): string {
  try {
    const value = new URL(spiffeId)
    return value.protocol === 'spiffe:'
      ? (value.pathname.split('/').filter(Boolean).at(-1) ?? '')
      : ''
  } catch {
    return ''
  }
}

/** Creates the stable target-admission denial used by the Common guard. */
function denied(reason: string) {
  return ExceptionFactory.application(ACCESS_DENIED, { reason })
}
