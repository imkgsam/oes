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
Object.defineProperty(exports, "__esModule", { value: true });
exports.AuthController = void 0;
const common_1 = require("@nestjs/common");
const auth_client_1 = require("../../clients/auth.client");
const login_dto_1 = require("../../dtos/login.dto");
let AuthController = class AuthController {
    authClient;
    constructor(authClient) {
        this.authClient = authClient;
    }
    async loginWithEmailPassword(dto) {
        console.log('in api-gateway, http, loginWithEmailPassword');
        const result = await this.authClient.send('email_password_login', dto);
        console.log(result);
        return result;
    }
    async loginWithGoogle(dto) {
    }
    async loginWithEmailOtp(dto) {
    }
    async loginWithPhoneOtp(dto) {
    }
    async loginWithWechat(dto) {
    }
};
exports.AuthController = AuthController;
__decorate([
    (0, common_1.Post)('login/email-password'),
    __param(0, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [login_dto_1.EmailPasswordLoginDto]),
    __metadata("design:returntype", Promise)
], AuthController.prototype, "loginWithEmailPassword", null);
__decorate([
    (0, common_1.Post)('login/google'),
    __param(0, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [login_dto_1.GoogleLoginDto]),
    __metadata("design:returntype", Promise)
], AuthController.prototype, "loginWithGoogle", null);
__decorate([
    (0, common_1.Post)('login/email-otp'),
    __param(0, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [login_dto_1.EmailOtpLoginDto]),
    __metadata("design:returntype", Promise)
], AuthController.prototype, "loginWithEmailOtp", null);
__decorate([
    (0, common_1.Post)('login/phone-otp'),
    __param(0, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [login_dto_1.PhoneOtpLoginDto]),
    __metadata("design:returntype", Promise)
], AuthController.prototype, "loginWithPhoneOtp", null);
__decorate([
    (0, common_1.Post)('login/wechat'),
    __param(0, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [login_dto_1.WechatLoginDto]),
    __metadata("design:returntype", Promise)
], AuthController.prototype, "loginWithWechat", null);
exports.AuthController = AuthController = __decorate([
    (0, common_1.Controller)('auth'),
    __metadata("design:paramtypes", [auth_client_1.AuthClient])
], AuthController);
//# sourceMappingURL=auth-local.controller.js.map