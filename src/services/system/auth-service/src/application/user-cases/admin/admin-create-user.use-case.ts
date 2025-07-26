import { Injectable } from '@nestjs/common'
import { AdminCreateUserDto } from 'src/application/dtos/admin-create-user.dto'
import { AdminService } from 'src/application/services/account.service'
import { User } from 'src/domain/entities/credential.entity'

@Injectable()
export class AdminCreateUserUseCase {
  constructor(private readonly adminService: AdminService) { }

  async execute(dto: AdminCreateUserDto): Promise<User> {
    // 检查是否重复（也可以放到 domain 规则中）
    const exists = await this.adminService.existsByEmailOrPhone(
      dto.email,
      dto.phone,
    )
    if (exists) {
      throw new Error('User with this email or phone already exists')
    }
    return await this.adminService.createUser(dto)
  }
}
