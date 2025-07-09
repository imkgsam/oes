import { EmailOtpLoginDto, EmailPasswordLoginDto, GoogleLoginDto, PhoneOtpLoginDto, WechatLoginDto } from "src/application/dtos/login.dto";
import { AuthService } from "src/application/services/auth-service";
export declare class HttpAuthController {
    private readonly authService;
    constructor(authService: AuthService);
    loginWithEmailPassword(dto: EmailPasswordLoginDto): Promise<{
        accessToken: Promise<string>;
    }>;
    loginWithGoogle(dto: GoogleLoginDto): Promise<{
        accessToken: Promise<string>;
    }>;
    loginWithEmailOtp(dto: EmailOtpLoginDto): Promise<{
        accessToken: Promise<string>;
    }>;
    loginWithPhoneOtp(dto: PhoneOtpLoginDto): Promise<{
        accessToken: Promise<string>;
    }>;
    loginWithWechat(dto: WechatLoginDto): Promise<{
        accessToken: Promise<string>;
    }>;
}
