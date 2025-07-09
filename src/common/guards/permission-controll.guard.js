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
exports.PermissionControllGuard = void 0;
const common_1 = require("@nestjs/common");
const core_1 = require("@nestjs/core");
const microservices_1 = require("@nestjs/microservices");
const permission_check_decorator_1 = require("../decorators/permission-check.decorator");
const permission_message_1 = require("../constants/messages/permission.message");
const rxjs_1 = require("rxjs");
const client_decorator_1 = require("@oes/modules/clients/client.decorator");
let PermissionControllGuard = class PermissionControllGuard {
    reflector;
    permissionServiceClient;
    constructor(reflector, permissionServiceClient) {
        this.reflector = reflector;
        this.permissionServiceClient = permissionServiceClient;
    }
    async canActivate(context) {
        const metadata = this.reflector.get(permission_check_decorator_1.PERMISSION_CHECK_KEY, context.getHandler());
        if (!metadata)
            return true;
        const { permission } = metadata;
        const request = context.switchToHttp().getRequest();
        const userId = request.user?.id || undefined;
        if (!userId)
            return false;
        const hasPermission = await (0, rxjs_1.firstValueFrom)(this.permissionServiceClient.send(permission_message_1.PERMISSION_MESSAGES.CHECK_USER_PERMISSION, {
            userId,
            permissionCode: permission,
            resourceId: undefined,
        }));
        return hasPermission === true;
    }
};
exports.PermissionControllGuard = PermissionControllGuard;
exports.PermissionControllGuard = PermissionControllGuard = __decorate([
    (0, common_1.Injectable)(),
    __param(1, (0, client_decorator_1.InjectServiceClient)('MES_TCP')),
    __metadata("design:paramtypes", [core_1.Reflector,
        microservices_1.ClientProxy])
], PermissionControllGuard);
//# sourceMappingURL=permission-controll.guard.js.map