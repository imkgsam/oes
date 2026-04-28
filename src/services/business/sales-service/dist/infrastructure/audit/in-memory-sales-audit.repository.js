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
exports.InMemorySalesAuditRepository = void 0;
const common_1 = require("@nestjs/common");
const sales_in_memory_store_1 = require("../store/sales-in-memory-store");
/** InMemorySalesAuditRepository keeps local command audit envelopes inside the phase 1 process-local skeleton store. */
let InMemorySalesAuditRepository = class InMemorySalesAuditRepository {
    constructor(store) {
        this.store = store;
    }
    async append(envelope) {
        this.store.auditEnvelopes.push(structuredClone(envelope));
    }
};
exports.InMemorySalesAuditRepository = InMemorySalesAuditRepository;
exports.InMemorySalesAuditRepository = InMemorySalesAuditRepository = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [sales_in_memory_store_1.SalesInMemoryStore])
], InMemorySalesAuditRepository);
//# sourceMappingURL=in-memory-sales-audit.repository.js.map