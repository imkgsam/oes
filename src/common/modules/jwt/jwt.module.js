"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.CommonJwtModule = void 0;
const common_1 = require("@nestjs/common");
const config_1 = require("@nestjs/config");
const jwt_1 = require("@nestjs/jwt");
const jwtOptions_factory_1 = require("./jwtOptions.factory");
const jwt_service_1 = require("./jwt.service");
const authKey_config_1 = __importDefault(require("../../configs/authKey.config"));
const token_config_1 = __importDefault(require("../../configs/token.config"));
//自定义jwt模块
let CommonJwtModule = class CommonJwtModule {
};
exports.CommonJwtModule = CommonJwtModule;
exports.CommonJwtModule = CommonJwtModule = __decorate([
    (0, common_1.Module)({
        imports: [
            config_1.ConfigModule.forFeature(authKey_config_1.default),
            config_1.ConfigModule.forFeature(token_config_1.default),
            jwt_1.JwtModule.registerAsync({
                imports: [config_1.ConfigModule],
                inject: [config_1.ConfigService],
                useClass: jwtOptions_factory_1.OptionsFactory
            })
        ],
        providers: [jwt_service_1.CommonJwtService],
        exports: [jwt_service_1.CommonJwtService, jwt_1.JwtModule]
    })
], CommonJwtModule);
//# sourceMappingURL=jwt.module.js.map