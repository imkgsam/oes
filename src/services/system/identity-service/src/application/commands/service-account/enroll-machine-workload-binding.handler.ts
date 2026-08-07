import { Inject } from '@nestjs/common'
import { CommandHandler, ICommandHandler } from '@nestjs/cqrs'
import { SYMBOLS } from '../../../common/constants'
import { MACHINE_PRINCIPAL_STATUSES, MACHINE_PRINCIPAL_TYPES } from '../../../common/constants/machine-principal.constants'
import { MachineWorkloadBindingEntity } from '../../../domain/entities/machine-workload-binding.entity'
import { MachineWorkloadBindingRepository } from '../../../domain/repositories/machine-workload-binding.repository'
import { ServiceAccountRepository } from '../../../domain/repositories/service-account.repository'
import { EnrollMachineWorkloadBindingCommand } from './enroll-machine-workload-binding.command'

/** Creates an idempotent exact SPIFFE binding only for an active first-party internal Machine Principal. */
@CommandHandler(EnrollMachineWorkloadBindingCommand)
export class EnrollMachineWorkloadBindingHandler
  implements ICommandHandler<EnrollMachineWorkloadBindingCommand, MachineWorkloadBindingEntity>
{
  constructor(
    @Inject(SYMBOLS.REPO.SERVICE_ACCOUNT)
    private readonly serviceAccountRepository: ServiceAccountRepository,
    @Inject(SYMBOLS.REPO.MACHINE_WORKLOAD_BINDING)
    private readonly bindingRepository: MachineWorkloadBindingRepository
  ) {}

  async execute(command: EnrollMachineWorkloadBindingCommand): Promise<MachineWorkloadBindingEntity> {
    const existing = await this.bindingRepository.findActiveByPrincipalAndSpiffe(
      command.input.machinePrincipalId,
      command.input.workloadSpiffeId
    )
    if (existing) return existing

    const principal = await this.serviceAccountRepository.findById(command.input.machinePrincipalId)
    if (
      !principal ||
      principal.status !== MACHINE_PRINCIPAL_STATUSES.ACTIVE ||
      !isEligibleFirstPartyMachineType(principal.type)
    ) {
      throw new Error('MACHINE_PRINCIPAL_NOT_ELIGIBLE')
    }

    return this.bindingRepository.create({
      serviceAccountId: principal.id,
      workloadSpiffeId: command.input.workloadSpiffeId,
      operatorId: command.input.operatorId,
      idempotencyKey: command.input.idempotencyKey
    })
  }
}

/** Narrows the enrollment surface to the two frozen first-party root machine types. */
function isEligibleFirstPartyMachineType(type: string): boolean {
  return type === MACHINE_PRINCIPAL_TYPES.INTERNAL_SERVICE || type === MACHINE_PRINCIPAL_TYPES.AUTOMATION_BOT
}
