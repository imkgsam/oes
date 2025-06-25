import { Injectable, UnauthorizedException } from "@nestjs/common";
import { IAuthProvider } from "./interfaces/auth-provider.interface";
import { EmailPasswordLoginDto } from "../dto/login.dto";
import { User } from "src/domain/entities/user.entity";
import { IUserRepository } from "src/domain/repositories/user.repository";
import { AuthDomainService } from "src/domain/services/auth.domain-service";

@Injectable()
export class EmailPasswordAuthProvider implements IAuthProvider<EmailPasswordLoginDto> {
  constructor(
    private readonly userRepository: IUserRepository,
    private readonly authDomainService: AuthDomainService
  ) { }

  async authenticate(dto: EmailPasswordLoginDto): Promise<User> {
    const user = await this.userRepository.findByEmail(dto.email)
    if (!user || !user?.hasPassword()) throw new UnauthorizedException('Invalid credentials')
    if (!this.authDomainService.validateUserPassword(user, dto.password))
      throw new UnauthorizedException('Invalid credentials')
    return user
  }
}