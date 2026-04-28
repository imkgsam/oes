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
exports.PrismaItemCompositionRepository = void 0;
const common_1 = require("@nestjs/common");
const prisma_service_1 = require("../../prisma/prisma.service");
/** PrismaItemCompositionRepository persists full-replacement bundle composition rows with stable ordering. */
let PrismaItemCompositionRepository = class PrismaItemCompositionRepository {
    constructor(prisma) {
        this.prisma = prisma;
    }
    async replaceForParent(tenantId, parentItemId, componentItemIds) {
        await this.prisma.runInTransaction(async () => {
            await this.prisma.getExecutionClient().itemComposition.deleteMany({
                where: {
                    tenantId,
                    parentItemId
                }
            });
            if (componentItemIds.length > 0) {
                await this.prisma.getExecutionClient().itemComposition.createMany({
                    data: componentItemIds.map((componentItemId, index) => ({
                        tenantId,
                        parentItemId,
                        componentItemId,
                        sortOrder: index
                    }))
                });
            }
        });
        return this.listByParentId(tenantId, parentItemId);
    }
    async listByParentId(tenantId, parentItemId) {
        const records = await this.prisma.getExecutionClient().itemComposition.findMany({
            where: {
                tenantId,
                parentItemId
            },
            orderBy: {
                sortOrder: 'asc'
            }
        });
        return records.map((record) => ({
            parentItemId: record.parentItemId,
            componentItemId: record.componentItemId,
            sortOrder: record.sortOrder
        }));
    }
};
exports.PrismaItemCompositionRepository = PrismaItemCompositionRepository;
exports.PrismaItemCompositionRepository = PrismaItemCompositionRepository = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService])
], PrismaItemCompositionRepository);
//# sourceMappingURL=prisma-item-composition.repository.js.map