import { JwtService as NestJwtService } from "@nestjs/jwt";
export declare class JwtService {
    private readonly jwtService;
    constructor(jwtService: NestJwtService);
    verify(token: string): Promise<any>;
    decodeToken(token: string): any;
}
