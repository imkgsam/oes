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
exports.AuthService = void 0;
const common_1 = require("@nestjs/common");
const jwt_service_1 = require("../../infrastructure/jwt/jwt.service");
const email_password_provider_1 = require("../providers/email-password.provider");
const wechat_provider_1 = require("../providers/wechat.provider");
const otp_provider_1 = require("../providers/otp.provider");
const login_method_enum_1 = require("../../domain/constants/login-method.enum");
const google_provider_1 = require("../providers/google.provider");
let AuthService = class AuthService {
    emailProvider;
    googleProvider;
    wechatProvider;
    emailOtpProvider;
    phoneOtpProvider;
    jwtService;
    constructor(emailProvider, googleProvider, wechatProvider, emailOtpProvider, phoneOtpProvider, 
    // private readonly sessionDomainService: SessionDomainService
    jwtService) {
        this.emailProvider = emailProvider;
        this.googleProvider = googleProvider;
        this.wechatProvider = wechatProvider;
        this.emailOtpProvider = emailOtpProvider;
        this.phoneOtpProvider = phoneOtpProvider;
        this.jwtService = jwtService;
    }
    async login(method, dto) {
        let user;
        switch (method) {
            case login_method_enum_1.LoginMethodEnum.EmailPassword:
                user = await this.emailProvider.authenticate(dto);
                break;
            case login_method_enum_1.LoginMethodEnum.Google:
                user = await this.googleProvider.authenticate(dto);
                break;
            case login_method_enum_1.LoginMethodEnum.Wechat:
                user = await this.wechatProvider.authenticate(dto);
                break;
            case login_method_enum_1.LoginMethodEnum.EmailOtp:
                user = await this.emailOtpProvider.authenticate(dto);
                break;
            case login_method_enum_1.LoginMethodEnum.PhoneOtp:
                user = await this.phoneOtpProvider.authenticate(dto);
                break;
            default:
                throw new common_1.BadRequestException('Unsupported login method');
        }
        const payload = { sub: user.id };
        const token = this.jwtService.sign(payload, { expiresIn: '1h' });
        return { accessToken: token };
    }
};
exports.AuthService = AuthService;
exports.AuthService = AuthService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [email_password_provider_1.EmailPasswordAuthProvider,
        google_provider_1.GoogleAuthProvider,
        wechat_provider_1.WechatAuthProvider,
        otp_provider_1.EmailOtpProvider,
        otp_provider_1.PhoneOtpProvider,
        jwt_service_1.JwtService])
], AuthService);
//# sourceMappingURL=auth-service.js.map