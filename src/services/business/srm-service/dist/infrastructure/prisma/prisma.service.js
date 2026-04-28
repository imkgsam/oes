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
exports.PrismaService = void 0;
const common_1 = require("@nestjs/common");
const config_1 = require("@nestjs/config");
const async_hooks_1 = require("async_hooks");
const constants_1 = require("@oes/common/constants");
const exceptions_1 = require("@oes/common/exceptions");
const prisma_1 = require("../../../prisma/generated/prisma");
/** PrismaService manages the srm-service database connection and ambient transaction reuse. */
let PrismaService = class PrismaService extends prisma_1.PrismaClient {
    constructor(configService) {
        const databaseUrl = configService?.get('DATABASE_URL') ?? process.env.DATABASE_URL;
        super(databaseUrl ? { datasources: { db: { url: databaseUrl } } } : undefined);
        this.logger = new common_1.Logger('PrismaService');
        this.transactionStorage = new async_hooks_1.AsyncLocalStorage();
    }
    /** getExecutionClient returns the ambient Prisma transaction client when one is active. */
    getExecutionClient() {
        return this.transactionStorage.getStore() ?? this;
    }
    /** hasActiveTransaction tells persistence adapters whether they are already inside a Prisma transaction. */
    hasActiveTransaction() {
        return this.transactionStorage.getStore() !== undefined;
    }
    /** runInTransaction executes one callback inside a shared Prisma transaction boundary. */
    async runInTransaction(callback) {
        if (this.hasActiveTransaction()) {
            return callback();
        }
        return this.$transaction((transaction) => this.transactionStorage.run(transaction, callback));
    }
    async onModuleInit() {
        try {
            await this.$connect();
            this.logger.log('PrismaService connected to the database successfully.');
        }
        catch (_error) {
            const exception = exceptions_1.ExceptionFactory.infrastructure(constants_1.GLOBAL_SYSTEM_ERRORS.DATABASE_CONNECTION_FAILED);
            this.logger.error('[SRM_SERVICE] PrismaService connection failed', exception);
            process.exit(1);
        }
    }
    async onModuleDestroy() {
        await this.$disconnect();
    }
};
exports.PrismaService = PrismaService;
exports.PrismaService = PrismaService = __decorate([
    (0, common_1.Injectable)(),
    __param(0, (0, common_1.Optional)()),
    __metadata("design:paramtypes", [config_1.ConfigService])
], PrismaService);
//# sourceMappingURL=prisma.service.js.map