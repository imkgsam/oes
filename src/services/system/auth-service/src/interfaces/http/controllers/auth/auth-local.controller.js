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
var __param = (this && this.__param) || function (paramIndex, decorator) {
    return function (target, key) { decorator(target, key, paramIndex); }
};
var _a, _b, _c, _d, _e, _f;
Object.defineProperty(exports, "__esModule", { value: true });
exports.HttpAuthController = void 0;
const common_1 = require("@nestjs/common");
const login_dto_1 = require("src/application/dtos/login.dto");
const auth_service_1 = require("src/application/services/auth-service");
const login_method_enum_1 = require("src/domain/constants/login-method.enum");
let HttpAuthController = class HttpAuthController {
    authService;
    constructor(authService) {
        this.authService = authService;
    }
    async loginWithEmailPassword(dto) {
        return this.authService.login(login_method_enum_1.LoginMethodEnum.EmailPassword, dto);
    }
    async loginWithGoogle(dto) {
        return this.authService.login(login_method_enum_1.LoginMethodEnum.Google, dto);
    }
    async loginWithEmailOtp(dto) {
        return this.authService.login(login_method_enum_1.LoginMethodEnum.EmailOtp, dto);
    }
    async loginWithPhoneOtp(dto) {
        return this.authService.login(login_method_enum_1.LoginMethodEnum.PhoneOtp, dto);
    }
    async loginWithWechat(dto) {
        return this.authService.login(login_method_enum_1.LoginMethodEnum.Wechat, dto);
    }
};
exports.HttpAuthController = HttpAuthController;
__decorate([
    (0, common_1.Post)('login/email-password'),
    __param(0, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [typeof (_b = typeof login_dto_1.EmailPasswordLoginDto !== "undefined" && login_dto_1.EmailPasswordLoginDto) === "function" ? _b : Object]),
    __metadata("design:returntype", Promise)
], HttpAuthController.prototype, "loginWithEmailPassword", null);
__decorate([
    (0, common_1.Post)('login/google'),
    __param(0, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [typeof (_c = typeof login_dto_1.GoogleLoginDto !== "undefined" && login_dto_1.GoogleLoginDto) === "function" ? _c : Object]),
    __metadata("design:returntype", Promise)
], HttpAuthController.prototype, "loginWithGoogle", null);
__decorate([
    (0, common_1.Post)('login/email-otp'),
    __param(0, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [typeof (_d = typeof login_dto_1.EmailOtpLoginDto !== "undefined" && login_dto_1.EmailOtpLoginDto) === "function" ? _d : Object]),
    __metadata("design:returntype", Promise)
], HttpAuthController.prototype, "loginWithEmailOtp", null);
__decorate([
    (0, common_1.Post)('login/phone-otp'),
    __param(0, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [typeof (_e = typeof login_dto_1.PhoneOtpLoginDto !== "undefined" && login_dto_1.PhoneOtpLoginDto) === "function" ? _e : Object]),
    __metadata("design:returntype", Promise)
], HttpAuthController.prototype, "loginWithPhoneOtp", null);
__decorate([
    (0, common_1.Post)('login/wechat'),
    __param(0, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [typeof (_f = typeof login_dto_1.WechatLoginDto !== "undefined" && login_dto_1.WechatLoginDto) === "function" ? _f : Object]),
    __metadata("design:returntype", Promise)
], HttpAuthController.prototype, "loginWithWechat", null);
exports.HttpAuthController = HttpAuthController = __decorate([
    (0, common_1.Controller)('auth'),
    __metadata("design:paramtypes", [typeof (_a = typeof auth_service_1.AuthService !== "undefined" && auth_service_1.AuthService) === "function" ? _a : Object])
], HttpAuthController);
//# sourceMappingURL=auth-local.controller.js.map