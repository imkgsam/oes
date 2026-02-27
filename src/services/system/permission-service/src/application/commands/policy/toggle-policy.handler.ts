import { CommandHandler, ICommandHandler } from '@nestjs/cqrs'
import { Inject } from '@nestjs/common'
import { TogglePolicyCommand } from './toggle-policy.command'
import { PolicyRepository } from 'src/domain/repositories/policy.repository'
import { Policy } from 'src/domain/aggregates/policy.aggregate'
import { SYMBOLS } from 'src/common/constants/symbols'
import { ExceptionFactory } from '@oes/common/core/exceptions/exception.factory'
import { POLICY_NOT_FOUND } from 'src/common/constants/exception-enums/permission-service.errors'

@CommandHandler(TogglePolicyCommand)
export class TogglePolicyHandler implements ICommandHandler<TogglePolicyCommand> {
  constructor(
    @Inject(SYMBOLS.REPO.POLICY)
    private readonly policyRepo: PolicyRepository
  ) {}

  async execute(command: TogglePolicyCommand): Promise<Policy> {
    const policy = await this.policyRepo.findById(command.id)
    if (!policy) throw ExceptionFactory.domain(POLICY_NOT_FOUND)

    command.isEnabled ? policy.enable() : policy.disable()

    return this.policyRepo.save(policy)
  }
}
