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
exports.AuthenticatedOperatorGuard = void 0;
const common_1 = require("@nestjs/common");
const core_1 = require("@nestjs/core");
const exceptions_1 = require("../../core/exceptions");
const constants_1 = require("../constants");
const exceptions_2 = require("../exceptions");
const utils_1 = require("../utils");
let AuthenticatedOperatorGuard = class AuthenticatedOperatorGuard {
    reflector;
    verifier;
    constructor(reflector, verifier) {
        this.reflector = reflector;
        this.verifier = verifier;
    }
    canActivate(context) {
        const requiredPermission = this.reflector.getAllAndOverride(constants_1.REQUIRE_PERMISSION_METADATA_KEY, [
            context.getHandler(),
            context.getClass()
        ]);
        const shouldRequireAuthenticatedOperator = this.reflector.getAllAndOverride(constants_1.REQUIRE_AUTHENTICATED_OPERATOR_METADATA_KEY, [
            context.getHandler(),
            context.getClass()
        ]) ||
            this.reflector.getAllAndOverride(constants_1.MANAGEMENT_INTERFACE_METADATA_KEY, [
                context.getHandler(),
                context.getClass()
            ]) ||
            Boolean(requiredPermission);
        if (!shouldRequireAuthenticatedOperator) {
            return true;
        }
        const rpcContext = context.switchToRpc();
        const metadata = rpcContext.getContext();
        const rawOperatorContext = (0, utils_1.getGrpcMetadataValue)(metadata, constants_1.OPERATOR_CONTEXT_METADATA_KEY);
        if (!rawOperatorContext) {
            throw exceptions_1.ExceptionFactory.application(exceptions_2.OPERATOR_CONTEXT_MISSING);
        }
        const result = this.verifier.verify(rawOperatorContext);
        if (!result.valid || !result.payload) {
            throw exceptions_1.ExceptionFactory.application(exceptions_2.OPERATOR_CONTEXT_INVALID, {
                reason: result.reason
            });
        }
        (0, utils_1.attachOperatorContext)(rpcContext.getData(), result.payload);
        return true;
    }
};
exports.AuthenticatedOperatorGuard = AuthenticatedOperatorGuard;
exports.AuthenticatedOperatorGuard = AuthenticatedOperatorGuard = __decorate([
    (0, common_1.Injectable)(),
    __param(1, (0, common_1.Inject)(constants_1.OPERATOR_CONTEXT_VERIFIER)),
    __metadata("design:paramtypes", [core_1.Reflector, Object])
], AuthenticatedOperatorGuard);
//# sourceMappingURL=authenticated-operator.guard.js.map