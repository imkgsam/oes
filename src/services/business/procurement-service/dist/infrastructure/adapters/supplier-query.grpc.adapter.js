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
exports.SupplierQueryGrpcAdapter = void 0;
const common_1 = require("@nestjs/common");
const authorization_1 = require("@oes/common/authorization");
const constants_1 = require("@oes/common/constants");
const srm_service_1 = require("@oes/common/generated/srm_service");
const transport_1 = require("@oes/common/transport");
/** SupplierQueryGrpcAdapter validates supplier activity and standard-item offerability through srm-service query truth. */
let SupplierQueryGrpcAdapter = class SupplierQueryGrpcAdapter {
    constructor(supplierClient, metadataFactory, requestContextStore) {
        this.supplierClient = supplierClient;
        this.metadataFactory = metadataFactory;
        this.requestContextStore = requestContextStore;
    }
    onModuleInit() {
        this.supplierQueryService = this.supplierClient.getService(srm_service_1.SUPPLIER_QUERY_SERVICE_NAME);
    }
    async getSupplierById(tenantId, supplierId) {
        const response = await (0, transport_1.safeGrpcCall)(this.supplierQueryService.getSupplier(this.buildGetSupplierRequest(tenantId, supplierId), this.buildMetadata()), {
            caller: constants_1.SERVICE_NAMES.PROCUREMENT,
            method: 'SupplierQueryService.getSupplier'
        });
        const supplier = response.supplier;
        if (!supplier?.supplierId?.trim()) {
            return null;
        }
        return {
            supplierId: supplier.supplierId,
            supplierDisplayName: supplier.displayName ?? '',
            status: normalizeSupplierStatus(supplier.status)
        };
    }
    async getActiveSupplierOffering(tenantId, supplierId, itemId) {
        const response = await (0, transport_1.safeGrpcCall)(this.supplierQueryService.listSupplierOfferingsBySupplier(this.buildListOfferingsRequest(tenantId, supplierId), this.buildMetadata()), {
            caller: constants_1.SERVICE_NAMES.PROCUREMENT,
            method: 'SupplierQueryService.listSupplierOfferingsBySupplier'
        });
        const offering = (response.offerings ?? []).find((candidate) => candidate.itemId === itemId && candidate.supplierOfferingId?.trim());
        if (!offering?.supplierOfferingId?.trim()) {
            return null;
        }
        return {
            supplierOfferingId: offering.supplierOfferingId,
            supplierId: offering.supplierId ?? supplierId,
            itemId: offering.itemId ?? itemId,
            status: normalizeSupplierOfferingStatus(offering.status)
        };
    }
    /** buildMetadata forwards trace/request context while keeping supplier lookups on the internal-service boundary. */
    buildMetadata() {
        const current = this.requestContextStore.getContext();
        if (current?.operatorContext) {
            return this.metadataFactory.createOperatorScopedMetadata({
                callerServiceName: constants_1.SERVICE_NAMES.PROCUREMENT,
                operatorContext: {
                    operatorId: current.operatorContext.operator_id,
                    operatorType: current.operatorContext.operator_type,
                    tenantId: current.operatorContext.tenant_id,
                    orgId: current.operatorContext.org_id,
                    operatorRoles: current.operatorContext.operator_roles
                },
                requestId: current.requestId,
                traceId: current.traceId
            });
        }
        return this.metadataFactory.createInternalCallMetadata({
            callerServiceName: constants_1.SERVICE_NAMES.PROCUREMENT,
            requestId: current?.requestId,
            traceId: current?.traceId
        });
    }
    /** buildGetSupplierRequest mirrors the srm-service explicit query context contract for downstream lookups. */
    buildGetSupplierRequest(tenantId, supplierId) {
        const current = this.requestContextStore.getContext();
        return {
            tenantId,
            supplierId,
            operatorContext: {
                operatorId: current?.operatorContext?.operator_id ?? 'procurement-system',
                operatorType: current?.operatorContext?.operator_type ?? 'SYSTEM',
                orgId: current?.operatorContext?.org_id ?? ''
            },
            traceContext: {
                traceId: current?.traceId ?? 'procurement-trace',
                requestId: current?.requestId ?? 'procurement-request'
            }
        };
    }
    /** buildListOfferingsRequest mirrors the srm-service explicit query context contract for downstream offerability checks. */
    buildListOfferingsRequest(tenantId, supplierId) {
        const current = this.requestContextStore.getContext();
        return {
            tenantId,
            supplierId,
            status: srm_service_1.SupplierOfferingStatus.SUPPLIER_OFFERING_STATUS_ACTIVE,
            page: 1,
            pageSize: 200,
            operatorContext: {
                operatorId: current?.operatorContext?.operator_id ?? 'procurement-system',
                operatorType: current?.operatorContext?.operator_type ?? 'SYSTEM',
                orgId: current?.operatorContext?.org_id ?? ''
            },
            traceContext: {
                traceId: current?.traceId ?? 'procurement-trace',
                requestId: current?.requestId ?? 'procurement-request'
            }
        };
    }
};
exports.SupplierQueryGrpcAdapter = SupplierQueryGrpcAdapter;
exports.SupplierQueryGrpcAdapter = SupplierQueryGrpcAdapter = __decorate([
    (0, common_1.Injectable)(),
    __param(0, (0, transport_1.InjectGrpcClient)(constants_1.SERVICE_NAMES.SRM)),
    __param(1, (0, common_1.Inject)(authorization_1.GRPC_METADATA_PROPAGATION_FACTORY)),
    __metadata("design:paramtypes", [Object, Object, authorization_1.GrpcRequestContextStore])
], SupplierQueryGrpcAdapter);
/** normalizeSupplierStatus converts generated SRM enum numbers or labels into procurement's plain ACTIVE/INACTIVE strings. */
function normalizeSupplierStatus(value) {
    const raw = typeof value === 'number'
        ? (srm_service_1.SupplierStatus[value] ?? '')
        : `${value ?? ''}`;
    return raw.replace('SUPPLIER_STATUS_', '');
}
/** normalizeSupplierOfferingStatus converts generated offering enum numbers or labels into procurement's plain ACTIVE/INACTIVE strings. */
function normalizeSupplierOfferingStatus(value) {
    const raw = typeof value === 'number'
        ? (srm_service_1.SupplierOfferingStatus[value] ?? '')
        : `${value ?? ''}`;
    return raw.replace('SUPPLIER_OFFERING_STATUS_', '');
}
//# sourceMappingURL=supplier-query.grpc.adapter.js.map