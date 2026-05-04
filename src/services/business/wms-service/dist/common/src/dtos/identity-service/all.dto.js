"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __exportStar = (this && this.__exportStar) || function(m, exports) {
    for (var p in m) if (p !== "default" && !Object.prototype.hasOwnProperty.call(exports, p)) __createBinding(exports, m, p);
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.PhoneRequestDto = exports.EmailRequestDto = exports.AccountIdRequestDto = exports.UserIdRequestDto = exports.AccountDto = exports.UserDto = void 0;
// src/common/src/dtos/identity-service/all.dto.ts
__exportStar(require("./module.auth.dto"), exports);
class UserDto {
    id;
    email;
    phone;
    fullname;
    createdAt;
    updatedAt;
}
exports.UserDto = UserDto;
class AccountDto {
    id;
    userId;
    tenantId;
    email;
    phone;
    isEnable;
    isAdmin;
    avatarUrl;
    createdAt;
    updatedAt;
}
exports.AccountDto = AccountDto;
class UserIdRequestDto {
    userId;
}
exports.UserIdRequestDto = UserIdRequestDto;
class AccountIdRequestDto {
    accountId;
}
exports.AccountIdRequestDto = AccountIdRequestDto;
class EmailRequestDto {
    email;
}
exports.EmailRequestDto = EmailRequestDto;
class PhoneRequestDto {
    phone;
}
exports.PhoneRequestDto = PhoneRequestDto;
//# sourceMappingURL=all.dto.js.map