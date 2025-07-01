import { BadRequestException, Injectable, Inject } from "@nestjs/common";
import { JwtService } from "src/infrastructure/jwt/jwt.service";
import { EmailPasswordAuthProvider } from "../providers/email-password.provider";
import { WechatAuthProvider } from "../providers/wechat.provider";
import { EmailOtpProvider, PhoneOtpProvider } from "../providers/otp.provider";
import { LoginMethodEnum } from "src/domain/constants/login-method.enum";
import { GoogleAuthProvider } from "../providers/google.provider";


@Injectable()
export class AuthService {
  constructor(
    private readonly emailProvider: EmailPasswordAuthProvider,
    private readonly googleProvider: GoogleAuthProvider,
    private readonly wechatProvider: WechatAuthProvider,
    private readonly emailOtpProvider: EmailOtpProvider,
    private readonly phoneOtpProvider: PhoneOtpProvider,
    private readonly jwtService: JwtService,
  ) { }

  async login(method: LoginMethodEnum, dto: any) {
    let user;
    switch (method) {
      case LoginMethodEnum.EmailPassword:
        user = await this.emailProvider.authenticate(dto);
        break;
      case LoginMethodEnum.Google:
        user = await this.googleProvider.authenticate(dto);
        break;
      case LoginMethodEnum.Wechat:
        user = await this.wechatProvider.authenticate(dto);
        break;
      case LoginMethodEnum.EmailOtp:
        user = await this.emailOtpProvider.authenticate(dto);
        break;
      case LoginMethodEnum.PhoneOtp:
        user = await this.phoneOtpProvider.authenticate(dto);
        break;
      default:
        throw new BadRequestException('Unsupported login method')
    }

    const payload = { sub: user.id };
    const token = this.jwtService.sign(payload, { expiresIn: '1h' });

    return { accessToken: token };
  }


}