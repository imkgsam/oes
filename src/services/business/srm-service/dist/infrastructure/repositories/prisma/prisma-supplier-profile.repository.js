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
exports.PrismaSupplierProfileRepository = void 0;
const common_1 = require("@nestjs/common");
const exceptions_1 = require("@oes/common/exceptions");
const prisma_1 = require("../../../../prisma/generated/prisma");
const srm_errors_1 = require("../../../common/errors/srm.errors");
const prisma_service_1 = require("../../prisma/prisma.service");
const prisma_srm_record_mapper_1 = require("./prisma-srm-record.mapper");
/** PrismaSupplierProfileRepository persists SRM supplier-profile shells and allocates globally unique supplier numbers. */
let PrismaSupplierProfileRepository = class PrismaSupplierProfileRepository {
    constructor(prisma) {
        this.prisma = prisma;
    }
    async nextSupplierProfileNo(tenantId) {
        return this.prisma.runInTransaction(async () => {
            const client = this.prisma.getExecutionClient();
            await client.srmSequenceCounter.upsert({
                where: {
                    tenantId: CUSTOMER_ACCOUNT_NO_SEQUENCE_KEY
                },
                create: {
                    tenantId: CUSTOMER_ACCOUNT_NO_SEQUENCE_KEY,
                    nextSupplierProfileNo: 1
                },
                update: {}
            });
            const [globalCounter, highestCounter, persistedCeiling] = await Promise.all([
                client.srmSequenceCounter.findUniqueOrThrow({
                    where: {
                        tenantId: CUSTOMER_ACCOUNT_NO_SEQUENCE_KEY
                    },
                    select: {
                        nextSupplierProfileNo: true
                    }
                }),
                client.srmSequenceCounter.aggregate({
                    _max: {
                        nextSupplierProfileNo: true
                    }
                }),
                readPersistedSupplierProfileNoCeiling(client)
            ]);
            const nextSupplierProfileNo = Math.max(globalCounter.nextSupplierProfileNo, highestCounter._max.nextSupplierProfileNo ?? 1, persistedCeiling + 1);
            await client.srmSequenceCounter.updateMany({
                where: {
                    tenantId: CUSTOMER_ACCOUNT_NO_SEQUENCE_KEY,
                    nextSupplierProfileNo: {
                        lt: nextSupplierProfileNo
                    }
                },
                data: {
                    nextSupplierProfileNo
                }
            });
            const updated = await client.srmSequenceCounter.update({
                where: {
                    tenantId: CUSTOMER_ACCOUNT_NO_SEQUENCE_KEY
                },
                data: {
                    nextSupplierProfileNo: {
                        increment: 1
                    }
                },
                select: {
                    nextSupplierProfileNo: true
                }
            });
            return formatDocumentNo(CUSTOMER_ACCOUNT_NO_PREFIX, updated.nextSupplierProfileNo - 1);
        });
    }
    async findById(tenantId, supplierId) {
        const record = await this.prisma.getExecutionClient().supplierProfile.findFirst({
            where: {
                tenantId,
                id: supplierId
            },
            include: prisma_srm_record_mapper_1.PrismaSrmRecordMapper.supplierProfileIncludeValue()
        });
        return record ? prisma_srm_record_mapper_1.PrismaSrmRecordMapper.toSupplierProfile(record) : null;
    }
    async findByTenantPartyId(tenantId, tenantPartyId) {
        const record = await this.prisma.getExecutionClient().supplierProfile.findFirst({
            where: {
                tenantId,
                partyBinding: {
                    is: {
                        tenantPartyId
                    }
                }
            },
            include: prisma_srm_record_mapper_1.PrismaSrmRecordMapper.supplierProfileIncludeValue()
        });
        return record ? prisma_srm_record_mapper_1.PrismaSrmRecordMapper.toSupplierProfile(record) : null;
    }
    async save(profile) {
        try {
            return await this.prisma.runInTransaction(async () => {
                const client = this.prisma.getExecutionClient();
                await client.supplierProfile.upsert({
                    where: {
                        id: profile.id
                    },
                    create: {
                        id: profile.id,
                        supplierNo: profile.supplierNo,
                        tenantId: profile.tenantId,
                        displayName: profile.displayName,
                        status: prisma_srm_record_mapper_1.PrismaSrmRecordMapper.toPersistedSupplierStatus(profile.status),
                        supplierCategory: profile.supplierCategory ?? null,
                        tags: prisma_srm_record_mapper_1.PrismaSrmRecordMapper.toInputJson(profile.tags)
                    },
                    update: {
                        supplierNo: profile.supplierNo,
                        displayName: profile.displayName,
                        status: prisma_srm_record_mapper_1.PrismaSrmRecordMapper.toPersistedSupplierStatus(profile.status),
                        supplierCategory: profile.supplierCategory ?? null,
                        tags: prisma_srm_record_mapper_1.PrismaSrmRecordMapper.toInputJson(profile.tags)
                    }
                });
                if (profile.partyBinding) {
                    await client.supplierPartyBinding.upsert({
                        where: {
                            supplierId: profile.id
                        },
                        create: {
                            id: profile.partyBinding.supplierPartyBindingId,
                            tenantId: profile.partyBinding.tenantId,
                            supplierId: profile.id,
                            tenantPartyId: profile.partyBinding.tenantPartyId,
                            bindingStatus: prisma_srm_record_mapper_1.PrismaSrmRecordMapper.toPersistedBindingStatus(profile.partyBinding.bindingStatus),
                            partyDisplayName: profile.partyBinding.partyDisplayName ?? null
                        },
                        update: {
                            tenantPartyId: profile.partyBinding.tenantPartyId,
                            bindingStatus: prisma_srm_record_mapper_1.PrismaSrmRecordMapper.toPersistedBindingStatus(profile.partyBinding.bindingStatus),
                            partyDisplayName: profile.partyBinding.partyDisplayName ?? null
                        }
                    });
                }
                else {
                    await client.supplierPartyBinding.deleteMany({
                        where: {
                            supplierId: profile.id
                        }
                    });
                }
                const saved = await client.supplierProfile.findUniqueOrThrow({
                    where: {
                        id: profile.id
                    },
                    include: prisma_srm_record_mapper_1.PrismaSrmRecordMapper.supplierProfileIncludeValue()
                });
                return prisma_srm_record_mapper_1.PrismaSrmRecordMapper.toSupplierProfile(saved);
            });
        }
        catch (error) {
            if (isTenantPartyBindingUniqueViolation(error, profile)) {
                throw exceptions_1.ExceptionFactory.application(srm_errors_1.SRM_ALREADY_EXISTS, {
                    reason: 'tenantParty is already bound to another supplier profile',
                    tenantPartyId: profile.partyBinding?.tenantPartyId,
                    supplierId: profile.id
                });
            }
            if (isSupplierProfileNoUniqueViolation(error)) {
                throw exceptions_1.ExceptionFactory.application(srm_errors_1.SRM_ALREADY_EXISTS, {
                    reason: 'supplierNo is already occupied by another supplier profile',
                    supplierNo: profile.supplierNo,
                    supplierId: profile.id
                });
            }
            throw error;
        }
    }
    async search(input) {
        const page = input.page ?? 1;
        const pageSize = input.pageSize ?? 20;
        const where = buildSearchWhere(input);
        const [total, items] = await Promise.all([
            this.prisma.getExecutionClient().supplierProfile.count({ where }),
            this.prisma.getExecutionClient().supplierProfile.findMany({
                where,
                include: prisma_srm_record_mapper_1.PrismaSrmRecordMapper.supplierProfileIncludeValue(),
                orderBy: {
                    supplierNo: 'asc'
                },
                skip: (page - 1) * pageSize,
                take: pageSize
            })
        ]);
        return {
            items: items.map((item) => prisma_srm_record_mapper_1.PrismaSrmRecordMapper.toSupplierProfile(item)),
            total,
            page,
            pageSize
        };
    }
};
exports.PrismaSupplierProfileRepository = PrismaSupplierProfileRepository;
exports.PrismaSupplierProfileRepository = PrismaSupplierProfileRepository = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService])
], PrismaSupplierProfileRepository);
const CUSTOMER_ACCOUNT_NO_PREFIX = 'CA';
const CUSTOMER_ACCOUNT_NO_SEQUENCE_KEY = '__global_supplier_no__';
/** buildSearchWhere translates the SRM supplier-directory filters into a Prisma where clause. */
function buildSearchWhere(input) {
    return {
        tenantId: input.tenantId,
        status: input.status ? prisma_srm_record_mapper_1.PrismaSrmRecordMapper.toPersistedSupplierStatus(input.status) : undefined,
        partyBinding: input.tenantPartyId
            ? {
                is: {
                    tenantPartyId: input.tenantPartyId
                }
            }
            : undefined,
        OR: input.keyword
            ? [
                {
                    supplierNo: {
                        contains: input.keyword,
                        mode: 'insensitive'
                    }
                },
                {
                    displayName: {
                        contains: input.keyword,
                        mode: 'insensitive'
                    }
                },
                {
                    partyBinding: {
                        is: {
                            partyDisplayName: {
                                contains: input.keyword,
                                mode: 'insensitive'
                            }
                        }
                    }
                }
            ]
            : undefined
    };
}
/** formatDocumentNo converts one numeric sequence into the frozen SRM supplier-number summary format. */
function formatDocumentNo(prefix, value) {
    return `${prefix}-${String(value).padStart(4, '0')}`;
}
/** readPersistedSupplierProfileNoCeiling extracts the highest numeric CA sequence already stored in the database. */
async function readPersistedSupplierProfileNoCeiling(client) {
    const rows = await client.$queryRaw(prisma_1.Prisma.sql `
    SELECT MAX(
      CASE
        WHEN "supplierNo" ~ '^CA-[0-9]+$'
        THEN CAST(SUBSTRING("supplierNo" FROM 4) AS INTEGER)
        ELSE NULL
      END
    ) AS "maxSequence"
    FROM "SupplierProfile"
  `);
    return rows[0]?.maxSequence ?? 0;
}
/** isTenantPartyBindingUniqueViolation detects the Prisma uniqueness error that enforces one binding per tenant-party pair. */
function isTenantPartyBindingUniqueViolation(error, profile) {
    if (!profile.partyBinding) {
        return false;
    }
    if (!(error instanceof prisma_1.Prisma.PrismaClientKnownRequestError) || error.code !== 'P2002') {
        return false;
    }
    const target = Array.isArray(error.meta?.target) ? error.meta.target.map(String) : [];
    return target.includes('tenantId') && target.includes('tenantPartyId');
}
/** isSupplierProfileNoUniqueViolation detects duplicate SRM account-number writes that should map to ALREADY_EXISTS. */
function isSupplierProfileNoUniqueViolation(error) {
    if (!(error instanceof prisma_1.Prisma.PrismaClientKnownRequestError) || error.code !== 'P2002') {
        return false;
    }
    const target = Array.isArray(error.meta?.target) ? error.meta.target.map(String) : [];
    return target.includes('supplierNo');
}
//# sourceMappingURL=prisma-supplier-profile.repository.js.map