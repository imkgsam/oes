import { Body, Controller, Post } from "@nestjs/common";
import { AuthService } from "src/application/auth-service";
import { LoginBasicDto } from "./dto/login.dto";

@Controller('auth')
export class HttpAuthController {
  constructor(private readonly authService: AuthService) { }

  @Post('login')
  async login(@Body logInBasicDto: LoginBasicDto): Promise<UserAuthDto> {
    const { user, tokens } = await this.authService.LoginBasic(LoginBasicDto);
    return new UserAuthDto(user, tokens);
  }

}