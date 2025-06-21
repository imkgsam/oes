import { Injectable } from "@nestjs/common";
import { UserRepository } from "src/domain/repositories/user.repository";
import { AuthDomainService } from "src/domain/services/auth.domain-service";
import { JwtService } from "src/infrastructure/jwt/jwt.service";

@Injectable()
export class AuthService {
  constructor(
    private readonly mongoUserRepository: UserRepository,
    private readonly authDomainService: AuthDomainService,
    private readonly jwtService: JwtService
  ){}
  
   async signInBasic(
    signInBasicDto: SignInBasicDto,
  ): Promise<{ user: User; tokens: UserTokensDto }> {
    const user = await this.userService.findByEmail(signInBasicDto.email);
    if (!user) throw new NotFoundException('User not found');
    if (!user.password)
      throw new BadRequestException('User credential not set');

    const match = await compare(signInBasicDto.password, user.password);
    if (!match) throw new UnauthorizedException('Authentication failure');

    const tokens = await this.createTokens(user);

    return { user: user, tokens: tokens };
  }

}