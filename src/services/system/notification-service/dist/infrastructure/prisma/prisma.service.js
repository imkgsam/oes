"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.PrismaService = void 0;
const common_1 = require("@nestjs/common");
const constants_1 = require("@oes/common/constants");
const exceptions_1 = require("@oes/common/exceptions");
const prisma_1 = require("../../../prisma/generated/prisma");
let PrismaService = class PrismaService extends prisma_1.PrismaClient {
    constructor() {
        super(...arguments);
        this.logger = new common_1.Logger('PrismaService');
    }
    async onModuleInit() {
        try {
            await this.$connect();
            this.logger.log('PrismaService connected to the database successfully.');
        }
        catch (error) {
            const e = exceptions_1.ExceptionFactory.infrastructure(constants_1.GLOBAL_SYSTEM_ERRORS.DATABASE_CONNECTION_FAILED);
            this.logger.error('[NOTIFICATION_SERVICE] PrismaService connection failed', error);
            this.logger.error('[NOTIFICATION_SERVICE] Normalized system exception', e);
            process.exit(1);
        }
    }
    async onModuleDestroy() {
        await this.$disconnect();
    }
};
exports.PrismaService = PrismaService;
exports.PrismaService = PrismaService = __decorate([
    (0, common_1.Injectable)()
], PrismaService);
//# sourceMappingURL=prisma.service.js.map