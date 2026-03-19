import { CommandHandler, ICommandHandler } from '@nestjs/cqrs'
import { Inject } from '@nestjs/common'
import { UpdatePolicyCommand } from './update-policy.command'
import { PolicyRepository } from '../../../domain/repositories/policy.repository'
import { PermissionRepository } from '../../../domain/repositories/permission.repository'
import { Policy } from '../../../domain/aggregates/policy.aggregate'
import { PolicyConditionVO } from '../../../domain/vo/policy-condition.value-object'
import { SYMBOLS } from '../../../common/constants/symbols'
import { ExceptionFactory } from '@oes/common/exceptions'
import { PERMISSION_NOT_FOUND, POLICY_NOT_FOUND } from '../../../common/constants/exception-enums'

@CommandHandler(UpdatePolicyCommand)
export class UpdatePolicyHandler implements ICommandHandler<UpdatePolicyCommand> {
  constructor(
    @Inject(SYMBOLS.REPO.POLICY)
    private readonly policyRepo: PolicyRepository,
    @Inject(SYMBOLS.REPO.PERMISSION)
    private readonly permissionRepo: PermissionRepository
  ) {}

  async execute(command: UpdatePolicyCommand): Promise<Policy> {
    const policy = await this.policyRepo.findById(command.id)
    if (!policy) throw ExceptionFactory.domain(POLICY_NOT_FOUND)

    if (command.permissionCode !== undefined) {
      const permission = await this.permissionRepo.findByCode(command.permissionCode)
      if (!permission) throw ExceptionFactory.domain(PERMISSION_NOT_FOUND)
    }

    if (command.name !== undefined) policy.name = command.name
    if (command.effect !== undefined) policy.effect = command.effect
    if (command.description !== undefined) policy.description = command.description
    if (command.subjectType !== undefined) policy.subjectType = command.subjectType
    if (command.subjectId !== undefined) policy.subjectId = command.subjectId
    if (command.permissionCode !== undefined) policy.permissionCode = command.permissionCode
    if (command.resourceType !== undefined) policy.resourceType = command.resourceType
    if (command.priority !== undefined) policy.priority = command.priority

    if (command.conditions !== undefined) {
      const conditions = command.conditions.map(
        (c) =>
          new PolicyConditionVO(
            crypto.randomUUID(),
            c.attributeSource,
            c.attributeKey,
            c.operator,
            c.value
          )
      )
      policy.replaceConditions(conditions)
    }

    return this.policyRepo.save(policy)
  }
}
