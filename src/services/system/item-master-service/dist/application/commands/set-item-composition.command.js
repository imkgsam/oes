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
exports.SetItemCompositionCommand = void 0;
const class_validator_1 = require("class-validator");
/** SetItemCompositionCommand captures the full replacement component list for one bundle parent. */
class SetItemCompositionCommand {
    constructor(input) {
        this.input = input;
    }
    get tenantId() {
        return this.input.tenantId;
    }
    get itemId() {
        return this.input.itemId;
    }
    get componentItemIds() {
        return this.input.componentItemIds;
    }
}
exports.SetItemCompositionCommand = SetItemCompositionCommand;
__decorate([
    (0, class_validator_1.Allow)(),
    __metadata("design:type", Object)
], SetItemCompositionCommand.prototype, "input", void 0);
//# sourceMappingURL=set-item-composition.command.js.map