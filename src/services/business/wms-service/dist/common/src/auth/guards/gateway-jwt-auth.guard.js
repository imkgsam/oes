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
exports.GatewayJwtAuthGuard = exports.AccountHolderType = void 0;
const common_1 = require("@nestjs/common");
const core_1 = require("@nestjs/core");
const jwt_service_1 = require("../jwt/jwt.service");
const exceptions_1 = require("../../core/exceptions");
const application_exception_enum_1 = require("../../core/exceptions/exception-enums/application-exception.enum");
const is_public_decorator_1 = require("../decorators/is-public.decorator");
var AccountHolderType;
(function (AccountHolderType) {
    AccountHolderType["USER"] = "USER";
    AccountHolderType["SERVICE"] = "SERVICE";
})(AccountHolderType || (exports.AccountHolderType = AccountHolderType = {}));
let GatewayJwtAuthGuard = class GatewayJwtAuthGuard {
    reflector;
    jwtService;
    constructor(reflector, jwtService) {
        this.reflector = reflector;
        this.jwtService = jwtService;
    }
    async canActivate(context) {
        const isPublic = this.reflector.getAllAndOverride(is_public_decorator_1.IS_PUBLIC_KEY, [
            context.getHandler(),
            context.getClass()
        ]);
        if (isPublic)
            return true;
        if (context.getType() !== 'http')
            return false;
        const req = context.switchToHttp().getRequest();
        const authHeader = req.headers['authorization'] || req.headers['Authorization'];
        if (!authHeader || !authHeader.startsWith('Bearer ')) {
            throw exceptions_1.ExceptionFactory.application(application_exception_enum_1.JWT_MISSING);
        }
        const token = authHeader.slice(7);
        if (!token) {
            throw exceptions_1.ExceptionFactory.application(application_exception_enum_1.JWT_MISSING);
        }
        try {
            const payload = await this.jwtService.verifyAsync(token);
            req['user'] = payload;
        }
        catch {
            throw exceptions_1.ExceptionFactory.application(application_exception_enum_1.JWT_INVALID);
        }
        return true;
    }
};
exports.GatewayJwtAuthGuard = GatewayJwtAuthGuard;
exports.GatewayJwtAuthGuard = GatewayJwtAuthGuard = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [core_1.Reflector,
        jwt_service_1.CommonJwtService])
], GatewayJwtAuthGuard);
//# sourceMappingURL=gateway-jwt-auth.guard.js.map