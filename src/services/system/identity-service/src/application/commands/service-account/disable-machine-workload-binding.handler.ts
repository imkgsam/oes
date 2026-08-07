import { Inject } from '@nestjs/common'
import { CommandHandler, ICommandHandler } from '@nestjs/cqrs'
import { SYMBOLS } from '../../../common/constants'
import { MachineWorkloadBindingRepository } from '../../../domain/repositories/machine-workload-binding.repository'
import { DisableMachineWorkloadBindingCommand } from './disable-machine-workload-binding.command'

/** Applies an exact-version irreversible binding disable through Identity's transactional repository boundary. */
@CommandHandler(DisableMachineWorkloadBindingCommand)
export class DisableMachineWorkloadBindingHandler implements ICommandHandler<DisableMachineWorkloadBindingCommand> {
  constructor(
    @Inject(SYMBOLS.REPO.MACHINE_WORKLOAD_BINDING)
    private readonly bindingRepository: MachineWorkloadBindingRepository
  ) {}

  async execute(command: DisableMachineWorkloadBindingCommand) {
    return this.bindingRepository.disable({
      bindingId: command.input.bindingId,
      expectedVersion: command.input.expectedVersion,
      reasonCode: command.input.reasonCode,
      operatorId: command.input.operatorId
    })
  }
}
