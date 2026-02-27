import { CommandHandler, ICommandHandler } from '@nestjs/cqrs'
import { Inject } from '@nestjs/common'
import { DeletePolicyCommand } from './delete-policy.command'
import { PolicyRepository } from 'src/domain/repositories/policy.repository'
import { SYMBOLS } from 'src/common/constants/symbols'
import { ExceptionFactory } from '@oes/common/core/exceptions/exception.factory'
import { POLICY_NOT_FOUND } from 'src/common/constants/exception-enums/permission-service.errors'

@CommandHandler(DeletePolicyCommand)
export class DeletePolicyHandler implements ICommandHandler<DeletePolicyCommand> {
  constructor(
    @Inject(SYMBOLS.REPO.POLICY)
    private readonly policyRepo: PolicyRepository
  ) {}

  async execute(command: DeletePolicyCommand): Promise<void> {
    const existing = await this.policyRepo.findById(command.id)
    if (!existing) throw ExceptionFactory.domain(POLICY_NOT_FOUND)

    await this.policyRepo.delete(command.id)
  }
}
