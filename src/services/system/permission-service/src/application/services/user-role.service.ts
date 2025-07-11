// application/services/user-role.service.ts
import { Injectable } from '@nestjs/common'
import { AssignUserRoleDto } from '../dtos/user-role.dto'
import { UserRoleRepository } from '../../domain/repositories/user-role.repository'
import { UserRole } from '../../domain/entities/user-role.entity'

@Injectable()
export class UserRoleService {
  constructor(private readonly repo: UserRoleRepository) { }

  async assign(dto: AssignUserRoleDto): Promise<void> {
    await this.repo.add(new UserRole(crypto.randomUUID(), dto.userId, dto.roleId))
  }

  async revoke(dto: AssignUserRoleDto): Promise<void> {
    await this.repo.remove(dto.userId, dto.roleId)
  }
}
