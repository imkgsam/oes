"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.AuthModule = void 0;
const common_1 = require("@nestjs/common");
const auth_service_1 = require("../../application/services/auth-service");
const otp_provider_1 = require("../../application/providers/otp.provider");
const email_password_provider_1 = require("../../application/providers/email-password.provider");
const google_provider_1 = require("../../application/providers/google.provider");
const wechat_provider_1 = require("../../application/providers/wechat.provider");
const prisma_user_repository_1 = require("src/infrastructure/repositories/prisma/prisma.user.repository");
const auth_domain_service_1 = require("src/domain/services/auth.domain-service");
const jwt_module_1 = require("src/infrastructure/jwt/jwt.module");
const auth_local_controller_1 = require("src/interfaces/http/controllers/auth/auth-local.controller");
const auth_local_controller_2 = require("src/interfaces/tcp/controllers/auth/auth-local.controller");
const prisma_module_1 = require("src/infrastructure/prisma/prisma.module");
let AuthModule = class AuthModule {
};
exports.AuthModule = AuthModule;
exports.AuthModule = AuthModule = __decorate([
    (0, common_1.Module)({
        imports: [jwt_module_1.JwtModule, prisma_module_1.PrismaModule],
        providers: [
            auth_service_1.AuthService,
            otp_provider_1.EmailOtpProvider,
            otp_provider_1.PhoneOtpProvider,
            email_password_provider_1.EmailPasswordAuthProvider,
            google_provider_1.GoogleAuthProvider,
            wechat_provider_1.WechatAuthProvider,
            { provide: 'UserRepository', useClass: prisma_user_repository_1.PrismaUserRepository },
            auth_domain_service_1.AuthDomainService
        ],
        controllers: [auth_local_controller_1.HttpAuthController, auth_local_controller_2.TcpAuthController]
    })
], AuthModule);
//# sourceMappingURL=auth.module.js.map