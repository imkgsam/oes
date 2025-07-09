export declare class Session {
    readonly sessionId: string;
    readonly userId: string;
    deviceId: string;
    accessToken: string;
    refreshToken: string;
    userAgent: string;
    ip: string;
    loginAt: Date;
    lastActiveAt: Date;
    status: 'active' | 'revoked';
    constructor(sessionId: string, userId: string, deviceId: string, accessToken: string, refreshToken: string, userAgent: string, ip: string, loginAt: Date, lastActiveAt: Date, status?: 'active' | 'revoked');
    revoke(): void;
    refreshTokens(accessToken: string, refreshToken: string): void;
    touch(): void;
    isActive(): boolean;
}
