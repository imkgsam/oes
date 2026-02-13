// File: src/services/system/permission-service/src/application/queries/authorization/check-account-permission-with-scope.handler.ts

import { IQueryHandler, QueryHandler } from '@nestjs/cqrs'
import { Inject } from '@nestjs/common'
import { CheckAccountPermissionWithScopeQuery } from './check-account-permission-with-scope.query'
import { RoleRepository } from 'src/domain/repositories/role.repository'
import { PermissionRepository } from 'src/domain/repositories/permission.repository'
import { SYMBOLS } from 'src/common/constants/symbols'
import { CheckPermissionResponse } from '@oes/common/generated/permission_service/permission_check'

@QueryHandler(CheckAccountPermissionWithScopeQuery)
export class CheckAccountPermissionWithScopeHandler implements IQueryHandler<CheckAccountPermissionWithScopeQuery> {
  constructor(
    @Inject(SYMBOLS.REPO.ROLE)
    private readonly roleRepo: RoleRepository,
    @Inject(SYMBOLS.REPO.PERMISSION)
    private readonly permissionRepo: PermissionRepository
  ) {}

  async execute(query: CheckAccountPermissionWithScopeQuery): Promise<CheckPermissionResponse> {
    const permission = await this.permissionRepo.findByCode(query.permissionCode)
    const rt = { pass: false, scopes: [] }
    if (!permission) {
      return rt
    }

    const roles = await this.roleRepo.findRolesForAccountId(query.accountId)
    if (!roles || roles.length === 0) {
      return rt
    }

    const pass = roles.some((role) => role.hasPermissionByCode(query.permissionCode))
    if (!pass) return rt
  }
}
