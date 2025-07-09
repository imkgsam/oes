import { ConfigService } from "@nestjs/config";
import { JwtModuleOptions, JwtOptionsFactory } from "@nestjs/jwt";
export declare class OptionsFactory implements JwtOptionsFactory {
    private readonly configService;
    constructor(configService: ConfigService);
    createJwtOptions(): Promise<JwtModuleOptions>;
}
