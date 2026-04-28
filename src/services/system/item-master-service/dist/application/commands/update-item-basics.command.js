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
exports.UpdateItemBasicsCommand = void 0;
const class_validator_1 = require("class-validator");
/** UpdateItemBasicsCommand captures the only mutable phase 1 basic fields plus raw extras for contract rejection. */
class UpdateItemBasicsCommand {
    constructor(input) {
        this.input = input;
    }
    get tenantId() {
        return this.input.tenantId;
    }
    get itemId() {
        return this.input.itemId;
    }
    get itemCode() {
        return this.input.itemCode;
    }
    get itemName() {
        return this.input.itemName;
    }
    get structureType() {
        return this.input.structureType;
    }
    get natureType() {
        return this.input.natureType;
    }
}
exports.UpdateItemBasicsCommand = UpdateItemBasicsCommand;
__decorate([
    (0, class_validator_1.Allow)(),
    __metadata("design:type", Object)
], UpdateItemBasicsCommand.prototype, "input", void 0);
//# sourceMappingURL=update-item-basics.command.js.map