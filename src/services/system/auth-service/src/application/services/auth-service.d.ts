import { JwtService } from "src/infrastructure/jwt/jwt.service";
import { EmailPasswordAuthProvider } from "../providers/email-password.provider";
import { WechatAuthProvider } from "../providers/wechat.provider";
import { EmailOtpProvider, PhoneOtpProvider } from "../providers/otp.provider";
import { LoginMethodEnum } from "src/domain/constants/login-method.enum";
import { GoogleAuthProvider } from "../providers/google.provider";
export declare class AuthService {
    private readonly emailProvider;
    private readonly googleProvider;
    private readonly wechatProvider;
    private readonly emailOtpProvider;
    private readonly phoneOtpProvider;
    private readonly jwtService;
    constructor(emailProvider: EmailPasswordAuthProvider, googleProvider: GoogleAuthProvider, wechatProvider: WechatAuthProvider, emailOtpProvider: EmailOtpProvider, phoneOtpProvider: PhoneOtpProvider, jwtService: JwtService);
    login(method: LoginMethodEnum, dto: any): Promise<{
        accessToken: any;
    }>;
}
