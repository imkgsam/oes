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
exports.AppModule = void 0;
const common_1 = require("@nestjs/common");
const auth_module_1 = require("./modules/auth/auth.module");
const config_1 = require("@nestjs/config");
const token_config_1 = __importDefault(require("./infrastructure/config/token.config"));
const authKey_config_1 = __importDefault(require("./infrastructure/config/authKey.config"));
const client_module_1 = require("@oes/common/modules/clients/client.module");
let AppModule = class AppModule {
};
exports.AppModule = AppModule;
exports.AppModule = AppModule = __decorate([
    (0, common_1.Module)({
        imports: [
            config_1.ConfigModule.forRoot({
                cache: true,
                isGlobal: true,
                // envFilePath: getEnvFilePath(),
                load: [
                    token_config_1.default,
                    authKey_config_1.default
                ]
            }),
            auth_module_1.AuthModule,
            client_module_1.ClientModule.register()
        ],
        controllers: [],
        providers: [],
    })
], AppModule);
function getEnvFilePath() {
    return process.env.NODE_ENV === 'test' ? '.env.test' : '.env';
}
//# sourceMappingURL=app.module.js.map