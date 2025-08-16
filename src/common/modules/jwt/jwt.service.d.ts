import { JwtService, JwtSignOptions, JwtVerifyOptions } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
export declare class CommonJwtService {
    private readonly jwtService;
    private readonly configService;
    private tokenConfig;
    constructor(jwtService: JwtService, configService: ConfigService);
    signAccessToken(payload: Record<string, any>, options?: JwtSignOptions): string;
    signRefreshToken(payload: Record<string, any>, options?: JwtSignOptions): string;
    verify<T extends object = any>(token: string, options?: JwtVerifyOptions): T;
    verifyAsync<T extends object = any>(token: string, options?: JwtVerifyOptions): Promise<T>;
    decode(token: string, options?: {
        json?: boolean;
    }): null | {
        [key: string]: any;
    } | string;
}
