import { IQueryHandler, QueryHandler } from '@nestjs/cqrs'
import { Inject } from '@nestjs/common'
import { ExceptionFactory } from '@oes/common/exceptions'
import { GetRoleTemplateByIdQuery } from './get-role-template-by-id.query'
import { RoleRepository } from '../../../domain/repositories/role.repository'
import { Role } from '../../../domain/aggregates/role.aggregate'
import { RoleKind } from '../../../domain/enums/role-kind.enum'
import { SYMBOLS } from '../../../common/constants/symbols'
import { AUTHORIZATION_DENIED, ROLE_TEMPLATE_NOT_FOUND } from '../../../common/constants/exception-enums'

@QueryHandler(GetRoleTemplateByIdQuery)
export class GetRoleTemplateByIdHandler implements IQueryHandler<GetRoleTemplateByIdQuery> {
  constructor(
    @Inject(SYMBOLS.REPO.ROLE)
    private readonly roleRepo: RoleRepository
  ) {}

  async execute(query: GetRoleTemplateByIdQuery): Promise<Role> {
    const operatorScope = query.operatorScope
    if (operatorScope && !operatorScope.isSystemScope) {
      throw ExceptionFactory.application(AUTHORIZATION_DENIED, {
        operatorId: operatorScope.operatorId,
        tenantId: operatorScope.tenantId,
        reason: 'template access requires system scope'
      })
    }

    const role = await this.roleRepo.findById(query.id)
    if (!role || role.kind !== RoleKind.SYSTEM_TEMPLATE) {
      throw ExceptionFactory.domain(ROLE_TEMPLATE_NOT_FOUND)
    }

    return role
  }
}
