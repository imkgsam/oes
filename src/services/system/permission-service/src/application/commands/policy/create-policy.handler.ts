import { CommandHandler, ICommandHandler } from '@nestjs/cqrs'
import { Inject } from '@nestjs/common'
import { CreatePolicyCommand } from './create-policy.command'
import { PolicyRepository } from '../../../domain/repositories/policy.repository'
import { PermissionRepository } from '../../../domain/repositories/permission.repository'
import { Policy } from '../../../domain/aggregates/policy.aggregate'
import { PolicyConditionVO } from '../../../domain/vo/policy-condition.value-object'
import { SYMBOLS } from '../../../common/constants/symbols'
import { ExceptionFactory } from '@oes/common/exceptions'
import { PERMISSION_NOT_FOUND } from '../../../common/constants/exception-enums'

@CommandHandler(CreatePolicyCommand)
export class CreatePolicyHandler implements ICommandHandler<CreatePolicyCommand> {
  constructor(
    @Inject(SYMBOLS.REPO.POLICY)
    private readonly policyRepo: PolicyRepository,
    @Inject(SYMBOLS.REPO.PERMISSION)
    private readonly permissionRepo: PermissionRepository
  ) {}

  async execute(command: CreatePolicyCommand): Promise<Policy> {
    const permission = await this.permissionRepo.findByCode(command.permissionCode)
    if (!permission) throw ExceptionFactory.domain(PERMISSION_NOT_FOUND)

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
      command.permissionCode,
      command.resourceType ?? null,
      command.tenantId ?? null,
      true, // isEnabled
      conditions,
      command.description
    )

    return this.policyRepo.save(policy)
  }
}
