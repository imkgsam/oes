import { IQueryHandler, QueryHandler } from '@nestjs/cqrs'
import { Inject } from '@nestjs/common'
import { ExceptionFactory } from '@oes/common/exceptions'
import { ListPoliciesByPermissionQuery } from './list-policies-by-permission.query'
import { PermissionRepository } from '../../../domain/repositories/permission.repository'
import { PolicyRepository } from '../../../domain/repositories/policy.repository'
import { Policy } from '../../../domain/aggregates/policy.aggregate'
import { SYMBOLS } from '../../../common/constants/symbols'
import { PERMISSION_NOT_FOUND } from '../../../common/constants/exception-enums'

@QueryHandler(ListPoliciesByPermissionQuery)
export class ListPoliciesByPermissionHandler
  implements IQueryHandler<ListPoliciesByPermissionQuery>
{
  constructor(
    @Inject(SYMBOLS.REPO.PERMISSION)
    private readonly permissionRepo: PermissionRepository,
    @Inject(SYMBOLS.REPO.POLICY)
    private readonly policyRepo: PolicyRepository
  ) {}

  async execute(query: ListPoliciesByPermissionQuery): Promise<Policy[]> {
    const permission = await this.permissionRepo.findByCode(query.permissionCode)
    if (!permission) throw ExceptionFactory.domain(PERMISSION_NOT_FOUND)

    return this.policyRepo.findByPermissionCode(query.permissionCode, query.tenantId)
  }
}
