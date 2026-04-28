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
exports.PartyQueryGrpcAdapter = void 0;
const common_1 = require("@nestjs/common");
const authorization_1 = require("@oes/common/authorization");
const constants_1 = require("@oes/common/constants");
const party_service_1 = require("@oes/common/generated/party_service");
const transport_1 = require("@oes/common/transport");
/** PartyQueryGrpcAdapter validates tenantParty references against party-service before CRM binds them. */
let PartyQueryGrpcAdapter = class PartyQueryGrpcAdapter {
    constructor(partyClient, metadataFactory, requestContextStore) {
        this.partyClient = partyClient;
        this.metadataFactory = metadataFactory;
        this.requestContextStore = requestContextStore;
    }
    onModuleInit() {
        this.partyQueryService = this.partyClient.getService(party_service_1.PARTY_QUERY_SERVICE_NAME);
    }
    async getTenantPartyById(tenantId, tenantPartyId) {
        const response = await (0, transport_1.safeGrpcCall)(this.partyQueryService.getTenantPartyById({
            tenantId,
            tenantPartyId
        }, this.buildMetadata()), {
            caller: constants_1.SERVICE_NAMES.CRM,
            method: 'PartyQueryService.getTenantPartyById'
        });
        const tenantParty = response.tenantParty;
        if (!tenantParty?.id?.trim()) {
            return null;
        }
        return {
            tenantId: tenantParty.tenantId ?? tenantId,
            tenantPartyId: tenantParty.id,
            status: tenantParty.status ?? '',
            partyDisplayName: tenantParty.localDisplayName ?? ''
        };
    }
    /** buildMetadata forwards trace/request context while keeping party lookup on the internal-service boundary. */
    buildMetadata() {
        const current = this.requestContextStore.getContext();
        return this.metadataFactory.createInternalCallMetadata({
            callerServiceName: constants_1.SERVICE_NAMES.CRM,
            requestId: current?.requestId,
            traceId: current?.traceId
        });
    }
};
exports.PartyQueryGrpcAdapter = PartyQueryGrpcAdapter;
exports.PartyQueryGrpcAdapter = PartyQueryGrpcAdapter = __decorate([
    (0, common_1.Injectable)(),
    __param(0, (0, transport_1.InjectGrpcClient)(constants_1.SERVICE_NAMES.PARTY)),
    __param(1, (0, common_1.Inject)(authorization_1.GRPC_METADATA_PROPAGATION_FACTORY)),
    __metadata("design:paramtypes", [Object, Object, authorization_1.GrpcRequestContextStore])
], PartyQueryGrpcAdapter);
//# sourceMappingURL=party-query-grpc.adapter.js.map