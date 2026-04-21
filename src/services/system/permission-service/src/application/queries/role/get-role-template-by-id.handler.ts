import { IQueryHandler, QueryHandler } from '@nestjs/cqrs'
import { Inject } from '@nestjs/common'
import { ExceptionFactory } from '@oes/common/exceptions'
import { GetRoleTemplateByIdQuery } from './get-role-template-by-id.query'
import { RoleRepository } from '../../../domain/repositories/role.repository'
import { Role } from '../../../domain/aggregates/role.aggregate'
import { RoleKind } from '../../../domain/enums/role-kind.enum'
import { SYMBOLS } from '../../../common/constants/symbols'
import { ROLE_TEMPLATE_NOT_FOUND } from '../../../common/constants/exception-enums'

@QueryHandler(GetRoleTemplateByIdQuery)
// Loads one global role template so system and tenant operators can instantiate from the same catalog.
export class GetRoleTemplateByIdHandler implements IQueryHandler<GetRoleTemplateByIdQuery> {
  constructor(
    @Inject(SYMBOLS.REPO.ROLE)
    private readonly roleRepo: RoleRepository
  ) {}

  async execute(query: GetRoleTemplateByIdQuery): Promise<Role> {
    const role = await this.roleRepo.findById(query.id)
    if (!role || role.kind !== RoleKind.SYSTEM_TEMPLATE) {
      throw ExceptionFactory.domain(ROLE_TEMPLATE_NOT_FOUND)
    }

    return role
  }
}
