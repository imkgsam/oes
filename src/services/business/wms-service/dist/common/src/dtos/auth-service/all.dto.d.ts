import { MfaType } from '../../auth';
export declare class EmailPasswordLoginRequestDto {
    readonly email: string;
    readonly password: string;
}
export declare class EmailOtpLoginRequestDto {
    readonly email: string;
    readonly otp: string;
}
export declare class PhoneOtpLoginRequestDto {
    readonly phone: string;
    readonly otp: string;
}
export declare class PhonePasswordLoginRequestDto {
    readonly phone: string;
    readonly password: string;
}
export declare class WechatLoginRequestDto {
    readonly code: string;
}
export declare class GoogleLoginRequestDto {
    readonly token: string;
}
export type LoginResponseDto = LoginResponseDto_MFA_notRequired | LoginResponseDto_MFA_required | LoginResponseDto_MultipleAccounts;
declare class LoginResponseDto_MFA_notRequired {
    mfaRequired: boolean;
    accessToken: string;
    refreshToken: string;
    userId: string;
    accountId: string;
    tenantId: string;
}
declare class LoginResponseDto_MFA_required {
    userId: string;
    mfaRequired: boolean;
    challengeId: string;
    mfaType: MfaType;
}
interface LoginResponseDto_MultipleAccounts {
    multipleAccounts: true;
    userId: string;
    accounts: Array<{
        accountId: string;
        tenantId: string;
        displayName?: string;
    }>;
}
export declare class TestingWithParamsRequestDto {
    name: string;
    age: number;
}
export declare class TestingWithParamsResponseDto {
    result: number;
    msg: string;
}
export {};
