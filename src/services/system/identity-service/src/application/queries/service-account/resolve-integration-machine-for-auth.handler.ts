import { Inject } from '@nestjs/common'
import { IQueryHandler, QueryHandler } from '@nestjs/cqrs'
import { SYMBOLS } from '../../../common/constants'
import {
  MACHINE_PRINCIPAL_SCOPE_LEVELS,
  MACHINE_PRINCIPAL_STATUSES,
  MACHINE_PRINCIPAL_TYPES
} from '../../../common/constants/machine-principal.constants'
import { ServiceAccountRepository } from '../../../domain/repositories/service-account.repository'
import { ResolveIntegrationMachineForAuthQuery } from './resolve-integration-machine-for-auth.query'

export interface IntegrationMachineForAuthView {
  eligible: boolean
  integrationMachineId: string
  tenantId: string
  scopeLevel: string
  machineType: string
  lifecycleStatus: string
  lifecycleVersion: string
  decisionReference: string
  reasonCode: string
}

/** Resolves only Identity-owned tenant Integration Machine lifecycle facts for Auth's credential exchange. */
@QueryHandler(ResolveIntegrationMachineForAuthQuery)
export class ResolveIntegrationMachineForAuthHandler
  implements IQueryHandler<ResolveIntegrationMachineForAuthQuery, IntegrationMachineForAuthView>
{
  constructor(
    @Inject(SYMBOLS.REPO.SERVICE_ACCOUNT)
    private readonly serviceAccountRepository: ServiceAccountRepository
  ) {}

  async execute(query: ResolveIntegrationMachineForAuthQuery): Promise<IntegrationMachineForAuthView> {
    const machine = await this.serviceAccountRepository.findById(query.integrationMachineId)
    if (!machine) return denied(query.integrationMachineId, 'INTEGRATION_MACHINE_NOT_FOUND')
    if (machine.scopeLevel !== MACHINE_PRINCIPAL_SCOPE_LEVELS.TENANT || !machine.tenantId) {
      return denied(machine.id, 'INTEGRATION_MACHINE_SCOPE_INVALID')
    }
    if (machine.type !== MACHINE_PRINCIPAL_TYPES.EXTERNAL_INTEGRATION) {
      return denied(machine.id, 'INTEGRATION_MACHINE_TYPE_INVALID')
    }
    if (machine.status !== MACHINE_PRINCIPAL_STATUSES.ACTIVE) {
      return denied(machine.id, 'INTEGRATION_MACHINE_INACTIVE')
    }

    const lifecycleVersion = machine.updatedAt.toISOString()
    return {
      eligible: true,
      integrationMachineId: machine.id,
      tenantId: machine.tenantId,
      scopeLevel: machine.scopeLevel,
      machineType: machine.type,
      lifecycleStatus: machine.status,
      lifecycleVersion,
      decisionReference: `identity-machine:${machine.id}:${lifecycleVersion}`,
      reasonCode: ''
    }
  }
}

/** Produces a non-enumerating denied owner-fact result without fabricating tenant or lifecycle facts. */
function denied(integrationMachineId: string, reasonCode: string): IntegrationMachineForAuthView {
  return {
    eligible: false,
    integrationMachineId,
    tenantId: '',
    scopeLevel: '',
    machineType: '',
    lifecycleStatus: '',
    lifecycleVersion: '',
    decisionReference: '',
    reasonCode
  }
}
