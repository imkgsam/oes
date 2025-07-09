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
var _a;
Object.defineProperty(exports, "__esModule", { value: true });
exports.PermissionController = void 0;
const common_1 = require("@nestjs/common");
const microservices_1 = require("@nestjs/microservices");
const permission_message_1 = require("@oes/common/constants/messages/permission.message");
const permission_dto_1 = require("../dtos/permission.dto");
let PermissionController = class PermissionController {
    permissionService;
    constructor(permissionService) {
        this.permissionService = permissionService;
    }
    checkUserPermission(data) {
        return this.permissionService.checkUserPermission(data);
    }
    checkUserScope(data) {
        return this.permissionService.checkUserScope(data);
    }
};
exports.PermissionController = PermissionController;
__decorate([
    (0, microservices_1.MessagePattern)(permission_message_1.PERMISSION_MESSAGES.CHECK_USER_PERMISSION),
    __param(0, (0, microservices_1.Payload)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [permission_dto_1.CheckUserPermissionDto]),
    __metadata("design:returntype", void 0)
], PermissionController.prototype, "checkUserPermission", null);
__decorate([
    (0, microservices_1.MessagePattern)(permission_message_1.PERMISSION_MESSAGES.CheckUserScope),
    __param(0, (0, microservices_1.Payload)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [permission_dto_1.CheckUserScopeDto]),
    __metadata("design:returntype", void 0)
], PermissionController.prototype, "checkUserScope", null);
exports.PermissionController = PermissionController = __decorate([
    (0, common_1.Controller)(),
    __metadata("design:paramtypes", [typeof (_a = typeof PermissionService !== "undefined" && PermissionService) === "function" ? _a : Object])
], PermissionController);
//# sourceMappingURL=permission.controller.js.map