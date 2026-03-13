import { CommandHandler, ICommandHandler } from '@nestjs/cqrs'
import { Inject } from '@nestjs/common'
import { DeletePolicyCommand } from './delete-policy.command'
import { PolicyRepository } from '../../../domain/repositories/policy.repository'
import { SYMBOLS } from '../../../common/constants/symbols'
import { ExceptionFactory } from '@oes/common/exceptions'
import { POLICY_NOT_FOUND } from '../../../common/constants/exception-enums/permission-service.errors'

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
