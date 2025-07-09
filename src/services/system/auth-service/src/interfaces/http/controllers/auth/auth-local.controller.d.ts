import { EmailOtpLoginDto, EmailPasswordLoginDto, GoogleLoginDto, PhoneOtpLoginDto, WechatLoginDto } from "src/application/dtos/login.dto";
import { AuthService } from "src/application/services/auth-service";
export declare class HttpAuthController {
    private readonly authService;
    constructor(authService: AuthService);
    loginWithEmailPassword(dto: EmailPasswordLoginDto): Promise<any>;
    loginWithGoogle(dto: GoogleLoginDto): Promise<any>;
    loginWithEmailOtp(dto: EmailOtpLoginDto): Promise<any>;
    loginWithPhoneOtp(dto: PhoneOtpLoginDto): Promise<any>;
    loginWithWechat(dto: WechatLoginDto): Promise<any>;
}
