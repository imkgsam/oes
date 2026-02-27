import { CommandHandler, ICommandHandler } from '@nestjs/cqrs'
import { Inject } from '@nestjs/common'
import { CreatePolicyCommand } from './create-policy.command'
import { PolicyRepository } from 'src/domain/repositories/policy.repository'
import { Policy } from 'src/domain/aggregates/policy.aggregate'
import { PolicyConditionVO } from 'src/domain/vo/policy-condition.value-object'
import { SYMBOLS } from 'src/common/constants/symbols'

@CommandHandler(CreatePolicyCommand)
export class CreatePolicyHandler implements ICommandHandler<CreatePolicyCommand> {
  constructor(
    @Inject(SYMBOLS.REPO.POLICY)
    private readonly policyRepo: PolicyRepository
  ) {}

  async execute(command: CreatePolicyCommand): Promise<Policy> {
    const conditions = (command.conditions ?? []).map(
      (c) =>
        new PolicyConditionVO(
          crypto.randomUUID(),
          c.attributeSource,
          c.attributeKey,
          c.operator,
          c.value
        )
    )

    const policy = new Policy(
      crypto.randomUUID(),
      command.name,
      command.effect,
      command.priority ?? 0,
      command.subjectType,
      command.subjectId ?? null,
      command.permissionCode ?? null,
      command.resourceType ?? null,
      command.tenantId ?? null,
      true, // isEnabled
      conditions,
      command.description
    )

    return this.policyRepo.save(policy)
  }
}
