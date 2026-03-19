import { IQueryHandler, QueryHandler } from '@nestjs/cqrs'
import { Inject } from '@nestjs/common'
import { GetRoleByIdQuery } from './get-role-by-id.query'
import { RoleRepository } from '../../../domain/repositories/role.repository'
import { Role } from '../../../domain/aggregates/role.aggregate'
import { SYMBOLS } from '../../../common/constants/symbols'
import { ExceptionFactory } from '@oes/common/exceptions'
import { ROLE_NOT_FOUND } from '../../../common/constants/exception-enums'

@QueryHandler(GetRoleByIdQuery)
export class GetRoleByIdHandler implements IQueryHandler<GetRoleByIdQuery> {
  constructor(
    @Inject(SYMBOLS.REPO.ROLE)
    private readonly roleRepo: RoleRepository
  ) {}

  async execute(query: GetRoleByIdQuery): Promise<Role | null> {
    const role = await this.roleRepo.findById(query.id)
    if (!role) throw ExceptionFactory.domain(ROLE_NOT_FOUND)
    return role
  }
}
