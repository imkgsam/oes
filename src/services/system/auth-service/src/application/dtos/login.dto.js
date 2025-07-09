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
exports.GoogleLoginDto = exports.WechatLoginDto = exports.PhoneOtpLoginDto = exports.EmailOtpLoginDto = exports.EmailPasswordLoginDto = void 0;
const class_validator_1 = require("class-validator");
class EmailPasswordLoginDto {
    email;
    password;
}
exports.EmailPasswordLoginDto = EmailPasswordLoginDto;
__decorate([
    (0, class_validator_1.IsNotEmpty)(),
    (0, class_validator_1.IsEmail)(),
    __metadata("design:type", String)
], EmailPasswordLoginDto.prototype, "email", void 0);
__decorate([
    (0, class_validator_1.IsNotEmpty)(),
    (0, class_validator_1.Length)(6, 30),
    __metadata("design:type", String)
], EmailPasswordLoginDto.prototype, "password", void 0);
class EmailOtpLoginDto {
    email;
    otp;
}
exports.EmailOtpLoginDto = EmailOtpLoginDto;
__decorate([
    (0, class_validator_1.IsEmail)(),
    __metadata("design:type", String)
], EmailOtpLoginDto.prototype, "email", void 0);
__decorate([
    (0, class_validator_1.Length)(6),
    __metadata("design:type", String)
], EmailOtpLoginDto.prototype, "otp", void 0);
class PhoneOtpLoginDto {
    phone;
    otp;
}
exports.PhoneOtpLoginDto = PhoneOtpLoginDto;
__decorate([
    (0, class_validator_1.IsPhoneNumber)(),
    __metadata("design:type", String)
], PhoneOtpLoginDto.prototype, "phone", void 0);
__decorate([
    (0, class_validator_1.Length)(6),
    __metadata("design:type", String)
], PhoneOtpLoginDto.prototype, "otp", void 0);
class WechatLoginDto {
    code;
}
exports.WechatLoginDto = WechatLoginDto;
class GoogleLoginDto {
    idToken;
}
exports.GoogleLoginDto = GoogleLoginDto;
//# sourceMappingURL=login.dto.js.map