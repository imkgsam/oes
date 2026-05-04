"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.LoginMethodEnum = exports.LoginMethodType = void 0;
/**
 * 登录方法类型枚举
 */
var LoginMethodType;
(function (LoginMethodType) {
    LoginMethodType["EMAIL"] = "EMAIL";
    LoginMethodType["PHONE"] = "PHONE";
    LoginMethodType["OAUTH_OPENID"] = "OAUTH_OPENID";
})(LoginMethodType || (exports.LoginMethodType = LoginMethodType = {}));
/**
 * 认证方式枚举
 */
var LoginMethodEnum;
(function (LoginMethodEnum) {
    LoginMethodEnum["EmailPassword"] = "email-password";
    LoginMethodEnum["EmailOtp"] = "email-otp";
    LoginMethodEnum["PhoneOtp"] = "phone-otp";
    LoginMethodEnum["PhonePassword"] = "phone-password";
    LoginMethodEnum["ContextSwitch"] = "context-switch";
    LoginMethodEnum["Google"] = "google";
    LoginMethodEnum["Wechat"] = "wechat";
})(LoginMethodEnum || (exports.LoginMethodEnum = LoginMethodEnum = {}));
//# sourceMappingURL=login-method.type.js.map