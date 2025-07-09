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
exports.AdminService = void 0;
const common_1 = require("@nestjs/common");
const user_repository_1 = require("src/domain/repositories/user.repository");
const bcrypt_1 = require("bcrypt");
let AdminService = class AdminService {
    userRepository;
    constructor(userRepository) {
        this.userRepository = userRepository;
    }
    async existsByEmailOrPhone(email, phone) {
        let conditions = {
            OR: []
        };
        if (email)
            conditions.OR.push({ email });
        if (phone)
            conditions.OR.push({ phone });
        let found = await this.userRepository.findByFields(conditions);
        return found ? true : false;
    }
    async createUser(dto) {
        let found = await this.userRepository.findByFields(dto);
        if (found)
            throw new common_1.BadRequestException('User Exists');
        const passwordHash = await (0, bcrypt_1.hash)(dto.password, 10);
        console.log('pwh', passwordHash);
        return this.userRepository.create({ passwordHash, ...dto });
    }
};
exports.AdminService = AdminService;
exports.AdminService = AdminService = __decorate([
    (0, common_1.Injectable)(),
    __param(0, (0, common_1.Inject)('UserRepository')),
    __metadata("design:paramtypes", [typeof (_a = typeof user_repository_1.IUserRepository !== "undefined" && user_repository_1.IUserRepository) === "function" ? _a : Object])
], AdminService);
//# sourceMappingURL=account.service.js.map