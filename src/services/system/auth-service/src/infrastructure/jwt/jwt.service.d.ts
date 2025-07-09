import { JwtService as NestJwtService } from '@nestjs/jwt';
export declare class JwtService {
    private readonly jwtService;
    constructor(jwtService: NestJwtService);
    sign(payload: any, options?: any): Promise<string>;
    verify(token: string): Promise<any>;
}
