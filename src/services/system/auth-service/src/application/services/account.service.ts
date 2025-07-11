import { BadRequestException, Inject, Injectable } from '@nestjs/common'
import { AdminCreateUserDto } from '../dtos/admin-create-user.dto'
import { IUserRepository } from 'src/domain/repositories/user.repository'
import { hash } from 'bcrypt'

@Injectable()
export class AdminService {
  constructor(
    @Inject('UserRepository') private readonly userRepository: IUserRepository,
  ) {}

  async existsByEmailOrPhone(email: string, phone: string) {
    let conditions: any = {
      OR: [],
    }
    if (email) conditions.OR.push({ email })
    if (phone) conditions.OR.push({ phone })
    let found = await this.userRepository.findByFields(conditions)
    return found ? true : false
  }

  async createUser(dto: AdminCreateUserDto) {
    let found = await this.userRepository.findByFields(dto)
    if (found) throw new BadRequestException('User Exists')
    const passwordHash = await hash(dto.password, 10)
    console.log('pwh', passwordHash)
    return this.userRepository.create({ passwordHash, ...dto })
  }
}
