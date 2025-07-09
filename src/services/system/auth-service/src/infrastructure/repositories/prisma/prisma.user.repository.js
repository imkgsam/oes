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
var _a;
Object.defineProperty(exports, "__esModule", { value: true });
exports.PrismaUserRepository = void 0;
const common_1 = require("@nestjs/common");
const user_entity_1 = require("src/domain/entities/user.entity");
const prisma_service_1 = require("src/infrastructure/prisma/prisma.service");
let PrismaUserRepository = class PrismaUserRepository {
    prismaService;
    constructor(prismaService) {
        this.prismaService = prismaService;
    }
    async findByFields(fields) {
        const filters = Object.entries(fields)
            .filter(([key, value]) => value != null && key != 'password')
            .map(([key, value]) => ({ [key]: value }));
        console.log(fields);
        if (filters.length === 0)
            return null;
        const foundUser = await this.prismaService.user.findFirst({
            where: {
                OR: filters,
            }
        });
        return foundUser ? user_entity_1.User.fromPrisma(foundUser) : null;
    }
    async findByEmail(email) {
        const user = await this.prismaService.user.findUnique({ where: { email } });
        return user ? user_entity_1.User.fromPrisma(user) : null;
    }
    async findByPhone(phone) {
        const user = await this.prismaService.user.findUnique({ where: { phone } });
        return user ? user_entity_1.User.fromPrisma(user) : null;
    }
    async findByGoogleId(googleId) {
        const user = await this.prismaService.user.findUnique({ where: { googleId } });
        return user ? user_entity_1.User.fromPrisma(user) : null;
    }
    async findByWechatOpenId(wechatOpenId) {
        const user = await this.prismaService.user.findUnique({ where: { wechatOpenId } });
        return user ? user_entity_1.User.fromPrisma(user) : null;
    }
    async create(user) {
        console.log('user: ', user);
        const newUser = await this.prismaService.user.create({ data: { email: user.email, passwordHash: user.passwordHash } });
        return user_entity_1.User.fromPrisma(newUser);
    }
};
exports.PrismaUserRepository = PrismaUserRepository;
exports.PrismaUserRepository = PrismaUserRepository = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [typeof (_a = typeof prisma_service_1.PrismaService !== "undefined" && prisma_service_1.PrismaService) === "function" ? _a : Object])
], PrismaUserRepository);
//# sourceMappingURL=prisma.user.repository.js.map