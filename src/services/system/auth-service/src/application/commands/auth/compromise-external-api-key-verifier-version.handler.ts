import { CommandHandler, ICommandHandler } from '@nestjs/cqrs'
import { ExternalApiKeyVerifierCompromiseService } from '../../services/external-api-key-verifier-compromise.service'
import { CompromiseExternalApiKeyVerifierVersionCommand } from './compromise-external-api-key-verifier-version.command'

@CommandHandler(CompromiseExternalApiKeyVerifierVersionCommand)
// Completes one provider-confirmed compromised verifier incident through the Auth-owned atomic revoke workflow.
export class CompromiseExternalApiKeyVerifierVersionHandler
  implements
    ICommandHandler<
      CompromiseExternalApiKeyVerifierVersionCommand,
      Awaited<ReturnType<ExternalApiKeyVerifierCompromiseService['compromise']>>
    >
{
  constructor(
    private readonly service: ExternalApiKeyVerifierCompromiseService
  ) {}

  async execute(
    command: CompromiseExternalApiKeyVerifierVersionCommand
  ): Promise<Awaited<ReturnType<ExternalApiKeyVerifierCompromiseService['compromise']>>> {
    return this.service.compromise({
      verifierKeyVersion: command.verifierKeyVersion,
      incidentReference: command.incidentReference,
      occurredAt: new Date(command.occurredAtUnixSeconds * 1_000),
      workloadSubject: command.workloadSubject,
      workloadClientId: command.workloadClientId,
      requestId: command.requestId,
      traceId: command.traceId
    })
  }
}
