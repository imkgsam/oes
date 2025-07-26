import { BadRequestException, Injectable, Inject } from '@nestjs/common'
import { LoginMethodEnum } from 'src/domain/constants/login-method.enum'
import { IUserRepository } from 'src/domain/repositories/user.repository'

@Injectable()
export class AdminService {
  constructor(
    @Inject('UserRepository') private readonly userRepository: IUserRepository,
  ) { }

  async getAllUsers() {
    return this.userRepository.find
    return { accessToken: token }
  }
}
