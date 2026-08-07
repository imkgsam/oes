import { CommandHandler, ICommandHandler } from '@nestjs/cqrs'
import { MachineWorkloadSourceCredentialService } from '../../services/machine-workload-source-credential.service'
import { IssueMachineWorkloadSourceCredentialCommand } from './issue-machine-workload-source-credential.command'
/** Delegates MACHINE source issuance to the Auth application service rather than controller DTO trust. */
@CommandHandler(IssueMachineWorkloadSourceCredentialCommand)
export class IssueMachineWorkloadSourceCredentialHandler implements ICommandHandler<IssueMachineWorkloadSourceCredentialCommand> { constructor(private readonly service: MachineWorkloadSourceCredentialService) {} async execute(command: IssueMachineWorkloadSourceCredentialCommand) { return this.service.issue(command.input) } }
