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
var _a, _b;
Object.defineProperty(exports, "__esModule", { value: true });
exports.AdminUsersController = void 0;
const common_1 = require("@nestjs/common");
const admin_create_user_dto_1 = require("src/application/dtos/admin-create-user.dto");
const admin_create_user_use_case_1 = require("src/application/user-cases/admin/admin-create-user.use-case");
let AdminUsersController = class AdminUsersController {
    adminCreateUserUseCase;
    constructor(adminCreateUserUseCase) {
        this.adminCreateUserUseCase = adminCreateUserUseCase;
    }
    async listAllUsers() {
    }
    async createNewUser(dto) {
        return this.adminCreateUserUseCase.execute(dto);
    }
};
exports.AdminUsersController = AdminUsersController;
__decorate([
    (0, common_1.Get)('/'),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", Promise)
], AdminUsersController.prototype, "listAllUsers", null);
__decorate([
    (0, common_1.Post)('/create'),
    __param(0, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [typeof (_b = typeof admin_create_user_dto_1.AdminCreateUserDto !== "undefined" && admin_create_user_dto_1.AdminCreateUserDto) === "function" ? _b : Object]),
    __metadata("design:returntype", Promise)
], AdminUsersController.prototype, "createNewUser", null);
exports.AdminUsersController = AdminUsersController = __decorate([
    (0, common_1.Controller)('admin/users'),
    __metadata("design:paramtypes", [typeof (_a = typeof admin_create_user_use_case_1.AdminCreateUserUseCase !== "undefined" && admin_create_user_use_case_1.AdminCreateUserUseCase) === "function" ? _a : Object])
], AdminUsersController);
//# sourceMappingURL=admin-user.controller.js.map