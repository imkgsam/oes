import { CommandHandler, ICommandHandler } from '@nestjs/cqrs'
import { Inject } from '@nestjs/common'
import { ExceptionFactory } from '@oes/common/exceptions'
import { AddPermissionPolicyCommand } from './add-permission-policy.command'
import { PermissionRepository } from '../../../domain/repositories/permission.repository'
import { PolicyRepository } from '../../../domain/repositories/policy.repository'
import { Policy } from '../../../domain/aggregates/policy.aggregate'
import { normalizePolicyConditionAstJson } from './normalize-policy-condition-ast'
import { SYMBOLS } from '../../../common/constants/symbols'
import { PERMISSION_NOT_FOUND } from '../../../common/constants/exception-enums'

@CommandHandler(AddPermissionPolicyCommand)
export class AddPermissionPolicyHandler implements ICommandHandler<AddPermissionPolicyCommand> {
  constructor(
    @Inject(SYMBOLS.REPO.PERMISSION)
    private readonly permissionRepo: PermissionRepository,
    @Inject(SYMBOLS.REPO.POLICY)
    private readonly policyRepo: PolicyRepository
  ) {}

  async execute(command: AddPermissionPolicyCommand): Promise<Policy> {
    const permission = await this.permissionRepo.findByCode(command.permissionCode)
    if (!permission) throw ExceptionFactory.domain(PERMISSION_NOT_FOUND)

    const conditionAstJson = normalizePolicyConditionAstJson(command.conditionAstJson)

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
      true,
      conditionAstJson,
      command.description
    )

    return this.policyRepo.save(policy)
  }
}
