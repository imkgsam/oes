"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.CommonJwtService = void 0;
const common_1 = require("@nestjs/common");
const jwt_1 = require("@nestjs/jwt");
const config_1 = require("@nestjs/config");
const token_config_1 = require("../../configs/token.config");
//自定义jwt服务
let CommonJwtService = class CommonJwtService {
    constructor(jwtService, configService) {
        this.jwtService = jwtService;
        this.configService = configService;
        this.tokenConfig =
            this.configService.getOrThrow(token_config_1.TokenConfigName);
    }
    // 生成accesstoken
    signAccessToken(payload, options) {
        return this.jwtService.sign(payload, {
            expiresIn: this.tokenConfig.accessTokenValidity || '15m',
            ...options
        });
    }
    // 生成refreshtoken
    signRefreshToken(payload, options) {
        return this.jwtService.sign(payload, {
            expiresIn: this.tokenConfig.refreshTokenValidity || '7d',
            ...options
        });
    }
    // 验证token
    verify(token, options) {
        return this.jwtService.verify(token, options);
    }
    // 异步验证token
    async verifyAsync(token, options) {
        return this.jwtService.verifyAsync(token, options);
    }
    // 解码 token
    decode(token, options) {
        return this.jwtService.decode(token, options);
    }
};
exports.CommonJwtService = CommonJwtService;
exports.CommonJwtService = CommonJwtService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [jwt_1.JwtService,
        config_1.ConfigService])
], CommonJwtService);
//# sourceMappingURL=jwt.service.js.map