import { AuthClient } from "src/clients/auth.client";
import { EmailPasswordLoginDto, GoogleLoginDto, EmailOtpLoginDto, PhoneOtpLoginDto, WechatLoginDto } from "src/dtos/login.dto";
export declare class AuthController {
    private readonly authClient;
    constructor(authClient: AuthClient);
    loginWithEmailPassword(dto: EmailPasswordLoginDto): Promise<unknown>;
    loginWithGoogle(dto: GoogleLoginDto): Promise<void>;
    loginWithEmailOtp(dto: EmailOtpLoginDto): Promise<void>;
    loginWithPhoneOtp(dto: PhoneOtpLoginDto): Promise<void>;
    loginWithWechat(dto: WechatLoginDto): Promise<void>;
}
