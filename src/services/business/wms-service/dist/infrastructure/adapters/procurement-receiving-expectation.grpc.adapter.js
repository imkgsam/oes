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
exports.ProcurementReceivingExpectationGrpcAdapter = void 0;
const common_1 = require("@nestjs/common");
const authorization_1 = require("@oes/common/authorization");
const constants_1 = require("@oes/common/constants");
const procurement_service_1 = require("@oes/common/generated/procurement_service");
const transport_1 = require("@oes/common/transport");
/** ProcurementReceivingExpectationGrpcAdapter validates referenced receiving expectations through procurement-service query truth. */
let ProcurementReceivingExpectationGrpcAdapter = class ProcurementReceivingExpectationGrpcAdapter {
    constructor(procurementClient, metadataFactory, requestContextStore) {
        this.procurementClient = procurementClient;
        this.metadataFactory = metadataFactory;
        this.requestContextStore = requestContextStore;
    }
    onModuleInit() {
        this.receivingExpectationQueryService =
            this.procurementClient.getService(procurement_service_1.RECEIVING_EXPECTATION_QUERY_SERVICE_NAME);
    }
    async getReceivingExpectationById(tenantId, receivingExpectationId) {
        const response = await (0, transport_1.safeGrpcCall)(this.receivingExpectationQueryService.getReceivingExpectation({
            tenantId,
            receivingExpectationId
        }, this.buildMetadata()), {
            caller: constants_1.SERVICE_NAMES.WMS,
            method: 'ReceivingExpectationQueryService.getReceivingExpectation'
        });
        const expectation = response.receivingExpectation;
        if (!expectation?.receivingExpectationId?.trim()) {
            return null;
        }
        return {
            receivingExpectationId: expectation.receivingExpectationId,
            purchaseOrderId: expectation.purchaseOrderId ?? '',
            purchaseOrderLineId: expectation.purchaseOrderLineId ?? '',
            targetWarehouseId: expectation.targetWarehouseId ?? null,
            openQuantity: expectation.openQuantity ?? '0',
            status: `${expectation.status ?? ''}`
        };
    }
    /** buildMetadata forwards trace/request context while keeping procurement lookup on the internal-service boundary. */
    buildMetadata() {
        const current = this.requestContextStore.getContext();
        if (current?.operatorContext) {
            return this.metadataFactory.createOperatorScopedMetadata({
                callerServiceName: constants_1.SERVICE_NAMES.WMS,
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
            callerServiceName: constants_1.SERVICE_NAMES.WMS,
            requestId: current?.requestId,
            traceId: current?.traceId
        });
    }
};
exports.ProcurementReceivingExpectationGrpcAdapter = ProcurementReceivingExpectationGrpcAdapter;
exports.ProcurementReceivingExpectationGrpcAdapter = ProcurementReceivingExpectationGrpcAdapter = __decorate([
    (0, common_1.Injectable)(),
    __param(0, (0, transport_1.InjectGrpcClient)(constants_1.SERVICE_NAMES.PROCUREMENT)),
    __param(1, (0, common_1.Inject)(authorization_1.GRPC_METADATA_PROPAGATION_FACTORY)),
    __metadata("design:paramtypes", [Object, Object, authorization_1.GrpcRequestContextStore])
], ProcurementReceivingExpectationGrpcAdapter);
//# sourceMappingURL=procurement-receiving-expectation.grpc.adapter.js.map