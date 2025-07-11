import { Injectable } from '@nestjs/common'
import { AssignUserRoleDto } from '../dtos/user-role.dto'
import { UserRoleService } from '../services/user-role.service'

@Injectable()
export class AssignUserRoleUseCase {
  constructor(private readonly service: UserRoleService) {}

  async execute(dto: AssignUserRoleDto): Promise<void> {
    await this.service.assign(dto)
  }
}
