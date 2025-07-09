export declare class EmailPasswordLoginDto {
    readonly email: string;
    readonly password: string;
}
export declare class EmailOtpLoginDto {
    readonly email: string;
    readonly otp: string;
}
export declare class PhoneOtpLoginDto {
    readonly phone: string;
    readonly otp: string;
}
export declare class WechatLoginDto {
    readonly code: string;
}
export declare class GoogleLoginDto {
    readonly idToken: string;
}
