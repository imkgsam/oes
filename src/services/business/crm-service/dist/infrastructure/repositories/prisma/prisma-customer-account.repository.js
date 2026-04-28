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
exports.PrismaCustomerAccountRepository = void 0;
const common_1 = require("@nestjs/common");
const exceptions_1 = require("@oes/common/exceptions");
const prisma_1 = require("../../../../prisma/generated/prisma");
const crm_errors_1 = require("../../../common/errors/crm.errors");
const crm_records_1 = require("../../../domain/models/crm-records");
const prisma_service_1 = require("../../prisma/prisma.service");
const prisma_crm_record_mapper_1 = require("./prisma-crm-record.mapper");
/** PrismaCustomerAccountRepository persists CRM account shells and allocates globally unique account numbers in PostgreSQL. */
let PrismaCustomerAccountRepository = class PrismaCustomerAccountRepository {
    constructor(prisma) {
        this.prisma = prisma;
    }
    async nextCustomerAccountNo(tenantId) {
        return this.prisma.runInTransaction(async () => {
            const client = this.prisma.getExecutionClient();
            await client.crmSequenceCounter.upsert({
                where: {
                    tenantId: CUSTOMER_ACCOUNT_NO_SEQUENCE_KEY
                },
                create: {
                    tenantId: CUSTOMER_ACCOUNT_NO_SEQUENCE_KEY,
                    nextCustomerAccountNo: 1
                },
                update: {}
            });
            const [globalCounter, highestCounter, persistedCeiling] = await Promise.all([
                client.crmSequenceCounter.findUniqueOrThrow({
                    where: {
                        tenantId: CUSTOMER_ACCOUNT_NO_SEQUENCE_KEY
                    },
                    select: {
                        nextCustomerAccountNo: true
                    }
                }),
                client.crmSequenceCounter.aggregate({
                    _max: {
                        nextCustomerAccountNo: true
                    }
                }),
                readPersistedCustomerAccountNoCeiling(client)
            ]);
            const nextCustomerAccountNo = Math.max(globalCounter.nextCustomerAccountNo, highestCounter._max.nextCustomerAccountNo ?? 1, persistedCeiling + 1);
            await client.crmSequenceCounter.updateMany({
                where: {
                    tenantId: CUSTOMER_ACCOUNT_NO_SEQUENCE_KEY,
                    nextCustomerAccountNo: {
                        lt: nextCustomerAccountNo
                    }
                },
                data: {
                    nextCustomerAccountNo
                }
            });
            const updated = await client.crmSequenceCounter.update({
                where: {
                    tenantId: CUSTOMER_ACCOUNT_NO_SEQUENCE_KEY
                },
                data: {
                    nextCustomerAccountNo: {
                        increment: 1
                    }
                },
                select: {
                    nextCustomerAccountNo: true
                }
            });
            return formatDocumentNo(CUSTOMER_ACCOUNT_NO_PREFIX, updated.nextCustomerAccountNo - 1);
        });
    }
    async findById(tenantId, customerAccountId) {
        const record = await this.prisma.getExecutionClient().customerAccount.findFirst({
            where: {
                tenantId,
                id: customerAccountId
            },
            include: prisma_crm_record_mapper_1.PrismaCrmRecordMapper.customerAccountIncludeValue()
        });
        return record ? prisma_crm_record_mapper_1.PrismaCrmRecordMapper.toCustomerAccount(record) : null;
    }
    async findActiveByTenantPartyId(tenantId, tenantPartyId) {
        const record = await this.prisma.getExecutionClient().customerAccount.findFirst({
            where: {
                tenantId,
                status: prisma_1.CrmCustomerStatus.ACTIVE_CUSTOMER,
                primaryBinding: {
                    is: {
                        tenantPartyId
                    }
                }
            },
            include: prisma_crm_record_mapper_1.PrismaCrmRecordMapper.customerAccountIncludeValue()
        });
        return record ? prisma_crm_record_mapper_1.PrismaCrmRecordMapper.toCustomerAccount(record) : null;
    }
    async save(account) {
        try {
            return await this.prisma.runInTransaction(async () => {
                const client = this.prisma.getExecutionClient();
                await client.customerAccount.upsert({
                    where: {
                        id: account.id
                    },
                    create: {
                        id: account.id,
                        customerAccountNo: account.customerAccountNo,
                        tenantId: account.tenantId,
                        displayName: account.displayName,
                        status: prisma_crm_record_mapper_1.PrismaCrmRecordMapper.toPersistedCustomerStatus(account.status),
                        customerCategory: account.customerCategory ?? null,
                        tags: prisma_crm_record_mapper_1.PrismaCrmRecordMapper.toInputJson(account.tags)
                    },
                    update: {
                        customerAccountNo: account.customerAccountNo,
                        displayName: account.displayName,
                        status: prisma_crm_record_mapper_1.PrismaCrmRecordMapper.toPersistedCustomerStatus(account.status),
                        customerCategory: account.customerCategory ?? null,
                        tags: prisma_crm_record_mapper_1.PrismaCrmRecordMapper.toInputJson(account.tags)
                    }
                });
                if (account.primaryBinding) {
                    await client.customerPartyBinding.upsert({
                        where: {
                            customerAccountId: account.id
                        },
                        create: {
                            id: account.primaryBinding.customerPartyBindingId,
                            tenantId: account.primaryBinding.tenantId,
                            customerAccountId: account.id,
                            tenantPartyId: account.primaryBinding.tenantPartyId,
                            bindingStatus: prisma_crm_record_mapper_1.PrismaCrmRecordMapper.toPersistedBindingStatus(account.primaryBinding.bindingStatus),
                            partyDisplayName: account.primaryBinding.partyDisplayName ?? null
                        },
                        update: {
                            tenantPartyId: account.primaryBinding.tenantPartyId,
                            bindingStatus: prisma_crm_record_mapper_1.PrismaCrmRecordMapper.toPersistedBindingStatus(account.primaryBinding.bindingStatus),
                            partyDisplayName: account.primaryBinding.partyDisplayName ?? null
                        }
                    });
                }
                else {
                    await client.customerPartyBinding.deleteMany({
                        where: {
                            customerAccountId: account.id
                        }
                    });
                }
                const saved = await client.customerAccount.findUniqueOrThrow({
                    where: {
                        id: account.id
                    },
                    include: prisma_crm_record_mapper_1.PrismaCrmRecordMapper.customerAccountIncludeValue()
                });
                return prisma_crm_record_mapper_1.PrismaCrmRecordMapper.toCustomerAccount(saved);
            });
        }
        catch (error) {
            if (isTenantPartyBindingUniqueViolation(error, account)) {
                throw exceptions_1.ExceptionFactory.application(crm_errors_1.CRM_ALREADY_EXISTS, {
                    reason: 'tenantParty is already bound to another active customer account',
                    tenantPartyId: account.primaryBinding?.tenantPartyId,
                    customerAccountId: account.id
                });
            }
            if (isCustomerAccountNoUniqueViolation(error)) {
                throw exceptions_1.ExceptionFactory.application(crm_errors_1.CRM_ALREADY_EXISTS, {
                    reason: 'customerAccountNo is already occupied by another customer account',
                    customerAccountNo: account.customerAccountNo,
                    customerAccountId: account.id
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
            this.prisma.getExecutionClient().customerAccount.count({ where }),
            this.prisma.getExecutionClient().customerAccount.findMany({
                where,
                include: prisma_crm_record_mapper_1.PrismaCrmRecordMapper.customerAccountIncludeValue(),
                orderBy: {
                    customerAccountNo: 'asc'
                },
                skip: (page - 1) * pageSize,
                take: pageSize
            })
        ]);
        return {
            items: items.map((item) => prisma_crm_record_mapper_1.PrismaCrmRecordMapper.toCustomerAccount(item)),
            total,
            page,
            pageSize
        };
    }
    async searchSelectable(input) {
        const page = input.page ?? 1;
        const pageSize = input.pageSize ?? 20;
        const where = {
            tenantId: input.tenantId,
            status: prisma_1.CrmCustomerStatus.ACTIVE_CUSTOMER,
            primaryBinding: {
                isNot: null
            },
            OR: input.keyword
                ? [
                    {
                        customerAccountNo: {
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
                        primaryBinding: {
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
        const [total, items] = await Promise.all([
            this.prisma.getExecutionClient().customerAccount.count({ where }),
            this.prisma.getExecutionClient().customerAccount.findMany({
                where,
                include: prisma_crm_record_mapper_1.PrismaCrmRecordMapper.customerAccountIncludeValue(),
                orderBy: {
                    customerAccountNo: 'asc'
                },
                skip: (page - 1) * pageSize,
                take: pageSize
            })
        ]);
        return {
            items: items.map((item) => ({
                customerAccountId: item.id,
                customerAccountNo: item.customerAccountNo,
                displayName: item.displayName,
                status: crm_records_1.CustomerStatus.ACTIVE_CUSTOMER,
                primaryTenantPartyId: item.primaryBinding.tenantPartyId,
                primaryPartyDisplayName: item.primaryBinding.partyDisplayName ?? null
            })),
            total,
            page,
            pageSize
        };
    }
};
exports.PrismaCustomerAccountRepository = PrismaCustomerAccountRepository;
exports.PrismaCustomerAccountRepository = PrismaCustomerAccountRepository = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService])
], PrismaCustomerAccountRepository);
const CUSTOMER_ACCOUNT_NO_PREFIX = 'CA';
const CUSTOMER_ACCOUNT_NO_SEQUENCE_KEY = '__global_customer_account_no__';
/** buildSearchWhere translates the CRM account-directory filters into a Prisma where clause. */
function buildSearchWhere(input) {
    return {
        tenantId: input.tenantId,
        status: input.status ? prisma_crm_record_mapper_1.PrismaCrmRecordMapper.toPersistedCustomerStatus(input.status) : undefined,
        primaryBinding: input.primaryTenantPartyId
            ? {
                is: {
                    tenantPartyId: input.primaryTenantPartyId
                }
            }
            : undefined,
        OR: input.keyword
            ? [
                {
                    customerAccountNo: {
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
                    primaryBinding: {
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
/** formatDocumentNo converts one numeric sequence into the frozen CRM account-number summary format. */
function formatDocumentNo(prefix, value) {
    return `${prefix}-${String(value).padStart(4, '0')}`;
}
/** readPersistedCustomerAccountNoCeiling extracts the highest numeric CA sequence already stored in the database. */
async function readPersistedCustomerAccountNoCeiling(client) {
    const rows = await client.$queryRaw(prisma_1.Prisma.sql `
    SELECT MAX(
      CASE
        WHEN "customerAccountNo" ~ '^CA-[0-9]+$'
        THEN CAST(SUBSTRING("customerAccountNo" FROM 4) AS INTEGER)
        ELSE NULL
      END
    ) AS "maxSequence"
    FROM "CustomerAccount"
  `);
    return rows[0]?.maxSequence ?? 0;
}
/** isTenantPartyBindingUniqueViolation detects the Prisma uniqueness error that enforces one binding per tenant-party pair. */
function isTenantPartyBindingUniqueViolation(error, account) {
    if (!account.primaryBinding) {
        return false;
    }
    if (!(error instanceof prisma_1.Prisma.PrismaClientKnownRequestError) || error.code !== 'P2002') {
        return false;
    }
    const target = Array.isArray(error.meta?.target) ? error.meta.target.map(String) : [];
    return target.includes('tenantId') && target.includes('tenantPartyId');
}
/** isCustomerAccountNoUniqueViolation detects duplicate CRM account-number writes that should map to ALREADY_EXISTS. */
function isCustomerAccountNoUniqueViolation(error) {
    if (!(error instanceof prisma_1.Prisma.PrismaClientKnownRequestError) || error.code !== 'P2002') {
        return false;
    }
    const target = Array.isArray(error.meta?.target) ? error.meta.target.map(String) : [];
    return target.includes('customerAccountNo');
}
//# sourceMappingURL=prisma-customer-account.repository.js.map