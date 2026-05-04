export * from './module.auth.dto';
export declare class UserDto {
    id: string;
    email?: string;
    phone?: string;
    fullname: string;
    createdAt: Date;
    updatedAt: Date;
}
export declare class AccountDto {
    id: string;
    userId: string;
    tenantId: string;
    email?: string;
    phone?: string;
    isEnable: Boolean;
    isAdmin: Boolean;
    avatarUrl?: string;
    createdAt: Date;
    updatedAt: Date;
}
export declare class UserIdRequestDto {
    userId: string;
}
export declare class AccountIdRequestDto {
    accountId: string;
}
export declare class EmailRequestDto {
    email: string;
}
export declare class PhoneRequestDto {
    phone: string;
}
