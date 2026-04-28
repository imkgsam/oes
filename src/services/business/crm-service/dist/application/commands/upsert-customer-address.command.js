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
exports.UpsertCustomerAddressCommand = void 0;
const class_validator_1 = require("class-validator");
/** UpsertCustomerAddressCommand carries one create-or-update CRM business-address payload. */
class UpsertCustomerAddressCommand {
    constructor(payload) {
        this.payload = payload;
    }
    get tenantId() {
        return this.payload.tenantId;
    }
    get customerAccountId() {
        return this.payload.customerAccountId;
    }
    get customerAddressId() {
        return this.payload.customerAddressId;
    }
    get label() {
        return this.payload.label;
    }
    get countryCode() {
        return this.payload.countryCode;
    }
    get region() {
        return this.payload.region;
    }
    get locality() {
        return this.payload.locality;
    }
    get addressLine1() {
        return this.payload.addressLine1;
    }
    get addressLine2() {
        return this.payload.addressLine2;
    }
    get postalCode() {
        return this.payload.postalCode;
    }
    get isPrimaryAddress() {
        return this.payload.isPrimaryAddress;
    }
    get isActive() {
        return this.payload.isActive;
    }
}
exports.UpsertCustomerAddressCommand = UpsertCustomerAddressCommand;
__decorate([
    (0, class_validator_1.Allow)(),
    __metadata("design:type", Object)
], UpsertCustomerAddressCommand.prototype, "payload", void 0);
//# sourceMappingURL=upsert-customer-address.command.js.map