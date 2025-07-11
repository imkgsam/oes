import { Injectable } from '@nestjs/common'
import { CreateRoleDto } from '../dtos/role.dto'
import { RoleService } from '../services/role.service'

@Injectable()
export class CreateRoleUseCase {
  constructor(private readonly roleService: RoleService) { }

  async execute(dto: CreateRoleDto): Promise<void> {
    await this.roleService.create(dto)
  }
}
