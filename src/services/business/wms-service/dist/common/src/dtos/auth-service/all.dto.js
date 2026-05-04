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
exports.TestingWithParamsResponseDto = exports.TestingWithParamsRequestDto = exports.GoogleLoginRequestDto = exports.WechatLoginRequestDto = exports.PhonePasswordLoginRequestDto = exports.PhoneOtpLoginRequestDto = exports.EmailOtpLoginRequestDto = exports.EmailPasswordLoginRequestDto = void 0;
const class_validator_1 = require("class-validator");
// ============================== 登录 LOGIN ==============================
//邮箱密码登录
class EmailPasswordLoginRequestDto {
    email;
    password;
}
exports.EmailPasswordLoginRequestDto = EmailPasswordLoginRequestDto;
__decorate([
    (0, class_validator_1.IsNotEmpty)(),
    (0, class_validator_1.IsEmail)(),
    __metadata("design:type", String)
], EmailPasswordLoginRequestDto.prototype, "email", void 0);
__decorate([
    (0, class_validator_1.IsNotEmpty)(),
    (0, class_validator_1.Length)(6, 30),
    __metadata("design:type", String)
], EmailPasswordLoginRequestDto.prototype, "password", void 0);
//邮箱验证码登录
class EmailOtpLoginRequestDto {
    email;
    otp;
}
exports.EmailOtpLoginRequestDto = EmailOtpLoginRequestDto;
__decorate([
    (0, class_validator_1.IsEmail)(),
    __metadata("design:type", String)
], EmailOtpLoginRequestDto.prototype, "email", void 0);
__decorate([
    (0, class_validator_1.Length)(6),
    __metadata("design:type", String)
], EmailOtpLoginRequestDto.prototype, "otp", void 0);
//手机验证码登录
class PhoneOtpLoginRequestDto {
    phone;
    otp;
}
exports.PhoneOtpLoginRequestDto = PhoneOtpLoginRequestDto;
__decorate([
    (0, class_validator_1.IsPhoneNumber)(),
    __metadata("design:type", String)
], PhoneOtpLoginRequestDto.prototype, "phone", void 0);
__decorate([
    (0, class_validator_1.Length)(6),
    __metadata("design:type", String)
], PhoneOtpLoginRequestDto.prototype, "otp", void 0);
//手机密码登录
class PhonePasswordLoginRequestDto {
    phone;
    password;
}
exports.PhonePasswordLoginRequestDto = PhonePasswordLoginRequestDto;
__decorate([
    (0, class_validator_1.IsPhoneNumber)(),
    __metadata("design:type", String)
], PhonePasswordLoginRequestDto.prototype, "phone", void 0);
__decorate([
    (0, class_validator_1.IsNotEmpty)(),
    (0, class_validator_1.Length)(6, 30),
    __metadata("design:type", String)
], PhonePasswordLoginRequestDto.prototype, "password", void 0);
//微信扫码登录
class WechatLoginRequestDto {
    code;
}
exports.WechatLoginRequestDto = WechatLoginRequestDto;
//google登录
class GoogleLoginRequestDto {
    token;
}
exports.GoogleLoginRequestDto = GoogleLoginRequestDto;
class LoginResponseDto_MFA_notRequired {
    mfaRequired = false;
    accessToken;
    refreshToken;
    userId;
    accountId;
    tenantId;
}
class LoginResponseDto_MFA_required {
    userId;
    mfaRequired = true;
    challengeId;
    mfaType;
}
// ============================== 测试 TEST ==============================
class TestingWithParamsRequestDto {
    name;
    age;
}
exports.TestingWithParamsRequestDto = TestingWithParamsRequestDto;
__decorate([
    (0, class_validator_1.IsNotEmpty)(),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], TestingWithParamsRequestDto.prototype, "name", void 0);
__decorate([
    (0, class_validator_1.IsNotEmpty)(),
    (0, class_validator_1.IsNumber)(),
    __metadata("design:type", Number)
], TestingWithParamsRequestDto.prototype, "age", void 0);
class TestingWithParamsResponseDto {
    result;
    msg;
}
exports.TestingWithParamsResponseDto = TestingWithParamsResponseDto;
//# sourceMappingURL=all.dto.js.map