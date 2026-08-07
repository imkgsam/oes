import { Inject } from '@nestjs/common'
import { QueryHandler, IQueryHandler } from '@nestjs/cqrs'
import { SYMBOLS } from '../../../common/constants'
import { MACHINE_PRINCIPAL_SCOPE_LEVELS, MACHINE_PRINCIPAL_STATUSES, MACHINE_PRINCIPAL_TYPES } from '../../../common/constants/machine-principal.constants'
import { MachineWorkloadBindingRepository } from '../../../domain/repositories/machine-workload-binding.repository'
import { ServiceAccountRepository } from '../../../domain/repositories/service-account.repository'
import { ResolveMachinePrincipalForAuthQuery } from './resolve-machine-principal-for-auth.query'

export interface MachinePrincipalForAuthView {
  allowed: boolean
  machinePrincipalId: string
  principalType?: string
  machineType?: string
  scopeLevel?: string
  tenantId?: string
  orgId?: string
  principalLifecycleStatus?: string
  principalLifecycleVersion?: string
  machineWorkloadBindingId: string
  machineWorkloadBindingVersion?: bigint
  workloadSpiffeId?: string
  decisionReference: string
  reasonCode: string
}

/** Resolves safe owner facts only when an Auth-verified principal, binding, version and SPIFFE tuple matches exactly. */
@QueryHandler(ResolveMachinePrincipalForAuthQuery)
export class ResolveMachinePrincipalForAuthHandler
  implements IQueryHandler<ResolveMachinePrincipalForAuthQuery, MachinePrincipalForAuthView>
{
  constructor(
    @Inject(SYMBOLS.REPO.SERVICE_ACCOUNT)
    private readonly serviceAccountRepository: ServiceAccountRepository,
    @Inject(SYMBOLS.REPO.MACHINE_WORKLOAD_BINDING)
    private readonly bindingRepository: MachineWorkloadBindingRepository
  ) {}

  async execute(query: ResolveMachinePrincipalForAuthQuery): Promise<MachinePrincipalForAuthView> {
    const input = query.input
    const binding = await this.bindingRepository.findById(input.bindingId)
    if (!binding || binding.status !== 'ACTIVE') return denied(input, 'MACHINE_WORKLOAD_BINDING_NOT_ELIGIBLE')
    if (binding.serviceAccountId !== input.machinePrincipalId) return denied(input, 'MACHINE_WORKLOAD_BINDING_PRINCIPAL_MISMATCH')
    if (binding.version !== input.bindingVersion) return denied(input, 'MACHINE_WORKLOAD_BINDING_STALE')
    if (binding.workloadSpiffeId !== input.workloadSpiffeId) return denied(input, 'MACHINE_WORKLOAD_SPIFFE_MISMATCH')

    const principal = await this.serviceAccountRepository.findById(input.machinePrincipalId)
    if (!principal || principal.status !== MACHINE_PRINCIPAL_STATUSES.ACTIVE || !isEligibleType(principal.type)) {
      return denied(input, 'MACHINE_PRINCIPAL_NOT_ELIGIBLE')
    }
    if (
      (principal.scopeLevel === MACHINE_PRINCIPAL_SCOPE_LEVELS.SYSTEM && principal.tenantId) ||
      (principal.scopeLevel === MACHINE_PRINCIPAL_SCOPE_LEVELS.TENANT && !principal.tenantId)
    ) {
      return denied(input, 'MACHINE_PRINCIPAL_SCOPE_INVALID')
    }

    const lifecycleVersion = principal.updatedAt.toISOString()
    return {
      allowed: true,
      machinePrincipalId: principal.id,
      principalType: 'MACHINE',
      machineType: principal.type,
      scopeLevel: principal.scopeLevel,
      tenantId: principal.tenantId ?? '',
      orgId: '',
      principalLifecycleStatus: principal.status,
      principalLifecycleVersion: lifecycleVersion,
      machineWorkloadBindingId: binding.id,
      machineWorkloadBindingVersion: binding.version,
      workloadSpiffeId: binding.workloadSpiffeId,
      decisionReference: `identity-machine-binding:${principal.id}:${binding.id}:${binding.version}`,
      reasonCode: ''
    }
  }
}

/** Returns only safe selectors when Identity cannot authorize a requested owner-fact tuple. */
function denied(
  input: ResolveMachinePrincipalForAuthQuery['input'],
  reasonCode: string
): MachinePrincipalForAuthView {
  return { allowed: false, machinePrincipalId: input.machinePrincipalId, machineWorkloadBindingId: input.bindingId, decisionReference: '', reasonCode }
}

/** Narrows the Auth-only resolver to the frozen first-party machine types. */
function isEligibleType(type: string): boolean {
  return type === MACHINE_PRINCIPAL_TYPES.INTERNAL_SERVICE || type === MACHINE_PRINCIPAL_TYPES.AUTOMATION_BOT
}
