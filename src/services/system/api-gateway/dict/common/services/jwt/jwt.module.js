"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.JwtModule = void 0;
const common_1 = require("@nestjs/common");
const config_1 = require("@nestjs/config");
const jwt_1 = require("@nestjs/jwt");
const fs_1 = require("fs");
const path_1 = require("path");
let JwtModule = class JwtModule {
};
exports.JwtModule = JwtModule;
exports.JwtModule = JwtModule = __decorate([
    (0, common_1.Module)({
        imports: [
            config_1.ConfigModule,
            jwt_1.JwtModule.registerAsync({
                imports: [config_1.ConfigModule],
                inject: [config_1.ConfigService],
                useFactory: async (configService) => {
                    const publicKeyPath = configService.getOrThrow('AUTH_PUBLIC_KEY_PATH');
                    const publicKey = await (0, fs_1.readFileSync)((0, path_1.join)(__dirname, '../../../..', publicKeyPath), 'utf8');
                    return {
                        publicKey,
                        signOptions: {
                            algorithm: 'RS256',
                        },
                    };
                }
            })
        ]
    })
], JwtModule);
//# sourceMappingURL=jwt.module.js.map