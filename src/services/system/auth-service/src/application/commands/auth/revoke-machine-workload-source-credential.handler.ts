import { CommandHandler, ICommandHandler } from '@nestjs/cqrs'
import { MachineWorkloadSourceCredentialService } from '../../services/machine-workload-source-credential.service'
import { RevokeMachineWorkloadSourceCredentialCommand } from './revoke-machine-workload-source-credential.command'
/** Delegates idempotent source credential revocation to Auth's lifecycle service. */
@CommandHandler(RevokeMachineWorkloadSourceCredentialCommand)
export class RevokeMachineWorkloadSourceCredentialHandler implements ICommandHandler<RevokeMachineWorkloadSourceCredentialCommand> { constructor(private readonly service: MachineWorkloadSourceCredentialService) {} async execute(command: RevokeMachineWorkloadSourceCredentialCommand) { return this.service.revoke(command.input) } }
