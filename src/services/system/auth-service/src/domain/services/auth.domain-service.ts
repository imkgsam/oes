import { User } from "../entities/user.entity"
import * as bcrypt from 'bcrypt';

export class AuthDomainService {
  async validateUserPassword(
    user: User,
    password: string,
  ): Promise<boolean> {
    if (!user) return false
    return await user.validatePassword(password, bcrypt.compare)
  }
}