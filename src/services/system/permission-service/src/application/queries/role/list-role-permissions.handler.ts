import { IQueryHandler, QueryHandler } from '@nestjs/cqrs'
import { Inject } from '@nestjs/common'
import { ExceptionFactory } from '@oes/common/exceptions'
import { ListRolePermissionsQuery } from './list-role-permissions.query'
import { Permission } from '../../../domain/aggregates/permission.aggregate'
import { RoleRepository } from '../../../domain/repositories/role.repository'
import { RoleKind } from '../../../domain/enums/role-kind.enum'
import { SYMBOLS } from '../../../common/constants/symbols'
import { ROLE_NOT_FOUND } from '../../../common/constants/exception-enums'

@QueryHandler(ListRolePermissionsQuery)
export class ListRolePermissionsHandler implements IQueryHandler<ListRolePermissionsQuery> {
  constructor(
    @Inject(SYMBOLS.REPO.ROLE)
    private readonly roleRepo: RoleRepository
  ) {}

  async execute(query: ListRolePermissionsQuery): Promise<Permission[]> {
    const role = await this.roleRepo.findById(query.roleId)
    if (!role || role.kind !== RoleKind.TENANT_INSTANCE) {
      throw ExceptionFactory.domain(ROLE_NOT_FOUND)
    }

    return this.roleRepo.findOwnPermissions(query.roleId)
  }
}
