import { Inject, Injectable, UnauthorizedException } from "@nestjs/common";
import { IAuthProvider } from "./interfaces/auth-provider.interface";
import { EmailPasswordLoginDto } from "../dtos/login.dto";
import { User } from "src/domain/entities/user.entity";
import { IUserRepository } from "src/domain/repositories/user.repository";
import { AuthDomainService } from "src/domain/services/auth.domain-service";

@Injectable()
export class EmailPasswordAuthProvider implements IAuthProvider<EmailPasswordLoginDto> {
  constructor(
    @Inject('UserRepository') private readonly userRepository: IUserRepository,
  ) { }

  async authenticate(dto: EmailPasswordLoginDto): Promise<User> {
    const user = await this.userRepository.findByEmail(dto.email)
    if (!user || !user?.hasPassword()) throw new UnauthorizedException('Invalid credentials')
    if (!user.validatePassword(dto.password))
      throw new UnauthorizedException('Invalid credentials')
    return user
  }
}