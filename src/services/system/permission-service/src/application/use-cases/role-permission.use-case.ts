import { Injectable } from '@nestjs/common'
import { AssignRolePermissionDto } from '../dtos/role-permission.dto'
import { RolePermissionService } from '../services/role-permission.service'

@Injectable()
export class AssignPermissionUseCase {
  constructor(private readonly service: RolePermissionService) {}

  async execute(dto: AssignRolePermissionDto): Promise<void> {
    await this.service.assign(dto)
  }
}
