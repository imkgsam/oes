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
exports.ItemMasterStockableQueryGrpcAdapter = void 0;
const common_1 = require("@nestjs/common");
const authorization_1 = require("@oes/common/authorization");
const constants_1 = require("@oes/common/constants");
const item_master_service_1 = require("@oes/common/generated/item_master_service");
const transport_1 = require("@oes/common/transport");
/** ItemMasterStockableQueryGrpcAdapter validates WMS receipt items through item-master-service query truth. */
let ItemMasterStockableQueryGrpcAdapter = class ItemMasterStockableQueryGrpcAdapter {
    itemMasterClient;
    metadataFactory;
    requestContextStore;
    itemMasterQueryService;
    constructor(itemMasterClient, metadataFactory, requestContextStore) {
        this.itemMasterClient = itemMasterClient;
        this.metadataFactory = metadataFactory;
        this.requestContextStore = requestContextStore;
    }
    onModuleInit() {
        this.itemMasterQueryService = this.itemMasterClient.getService(item_master_service_1.ITEM_MASTER_QUERY_SERVICE_NAME);
    }
    async getItemById(tenantId, itemId) {
        const response = await (0, transport_1.safeGrpcCall)(this.itemMasterQueryService.getItem({
            tenantId,
            itemId
        }, this.buildMetadata()), {
            caller: constants_1.SERVICE_NAMES.WMS,
            method: 'ItemMasterQueryService.getItem'
        });
        const item = response.item;
        if (!item?.itemId?.trim()) {
            return null;
        }
        return {
            itemId: item.itemId,
            itemCode: item.itemCode ?? '',
            itemName: item.itemName ?? '',
            status: `${item.status ?? ''}`,
            stockable: item.capabilities?.stockable ?? false
        };
    }
    /** buildMetadata forwards trace/request context while keeping item lookup on the internal-service boundary. */
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
exports.ItemMasterStockableQueryGrpcAdapter = ItemMasterStockableQueryGrpcAdapter;
exports.ItemMasterStockableQueryGrpcAdapter = ItemMasterStockableQueryGrpcAdapter = __decorate([
    (0, common_1.Injectable)(),
    __param(0, (0, transport_1.InjectGrpcClient)(constants_1.SERVICE_NAMES.ITEM_MASTER)),
    __param(1, (0, common_1.Inject)(authorization_1.GRPC_METADATA_PROPAGATION_FACTORY)),
    __metadata("design:paramtypes", [Object, Object, authorization_1.GrpcRequestContextStore])
], ItemMasterStockableQueryGrpcAdapter);
//# sourceMappingURL=item-master-stockable-query.grpc.adapter.js.map