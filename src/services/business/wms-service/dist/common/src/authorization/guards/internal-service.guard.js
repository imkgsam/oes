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
exports.InternalServiceGuard = void 0;
const common_1 = require("@nestjs/common");
const core_1 = require("@nestjs/core");
const exceptions_1 = require("../../core/exceptions");
const constants_1 = require("../constants");
const exceptions_2 = require("../exceptions");
const utils_1 = require("../utils");
let InternalServiceGuard = class InternalServiceGuard {
    reflector;
    authenticator;
    constructor(reflector, authenticator) {
        this.reflector = reflector;
        this.authenticator = authenticator;
    }
    canActivate(context) {
        const isPublicInterface = this.reflector.getAllAndOverride(constants_1.PUBLIC_INTERFACE_METADATA_KEY, [context.getHandler(), context.getClass()]);
        if (isPublicInterface) {
            return true;
        }
        const rpcContext = context.switchToRpc();
        const metadata = rpcContext.getContext();
        const result = this.authenticator.authenticate(metadata);
        if (!result.authenticated || !result.principal) {
            if (result.reason?.includes('missing')) {
                throw exceptions_1.ExceptionFactory.application(exceptions_2.INTERNAL_SERVICE_METADATA_MISSING, {
                    reason: result.reason
                });
            }
            throw exceptions_1.ExceptionFactory.application(exceptions_2.INTERNAL_SERVICE_NOT_ALLOWED, {
                reason: result.reason
            });
        }
        (0, utils_1.attachInternalService)(rpcContext.getData(), result.principal.serviceName);
        return true;
    }
};
exports.InternalServiceGuard = InternalServiceGuard;
exports.InternalServiceGuard = InternalServiceGuard = __decorate([
    (0, common_1.Injectable)(),
    __param(1, (0, common_1.Inject)(constants_1.INTERNAL_SERVICE_AUTHENTICATOR)),
    __metadata("design:paramtypes", [core_1.Reflector, Object])
], InternalServiceGuard);
//# sourceMappingURL=internal-service.guard.js.map