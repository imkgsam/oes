import { IQueryHandler, QueryHandler } from '@nestjs/cqrs'
import { Inject } from '@nestjs/common'
import { ExceptionFactory } from '@oes/common/exceptions'
import { ListRoleTemplatePermissionsQuery } from './list-role-template-permissions.query'
import { Permission } from '../../../domain/aggregates/permission.aggregate'
import { RoleRepository } from '../../../domain/repositories/role.repository'
import { RoleKind } from '../../../domain/enums/role-kind.enum'
import { SYMBOLS } from '../../../common/constants/symbols'
import { ROLE_TEMPLATE_NOT_FOUND } from '../../../common/constants/exception-enums'

@QueryHandler(ListRoleTemplatePermissionsQuery)
export class ListRoleTemplatePermissionsHandler
  implements IQueryHandler<ListRoleTemplatePermissionsQuery>
{
  constructor(
    @Inject(SYMBOLS.REPO.ROLE)
    private readonly roleRepo: RoleRepository
  ) {}

  async execute(query: ListRoleTemplatePermissionsQuery): Promise<Permission[]> {
    const role = await this.roleRepo.findById(query.roleTemplateId)
    if (!role || role.kind !== RoleKind.SYSTEM_TEMPLATE) {
      throw ExceptionFactory.domain(ROLE_TEMPLATE_NOT_FOUND)
    }

    return this.roleRepo.findOwnPermissions(query.roleTemplateId)
  }
}
