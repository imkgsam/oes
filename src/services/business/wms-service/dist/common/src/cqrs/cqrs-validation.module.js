"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.CqrsValidationModule = void 0;
const common_1 = require("@nestjs/common");
const cqrs_1 = require("@nestjs/cqrs");
const validating_command_bus_1 = require("./validating-command-bus");
const validating_query_bus_1 = require("./validating-query-bus");
let CqrsValidationModule = class CqrsValidationModule {
};
exports.CqrsValidationModule = CqrsValidationModule;
exports.CqrsValidationModule = CqrsValidationModule = __decorate([
    (0, common_1.Global)(),
    (0, common_1.Module)({
        imports: [cqrs_1.CqrsModule],
        providers: [validating_command_bus_1.ValidatingCommandBus, validating_query_bus_1.ValidatingQueryBus],
        exports: [validating_command_bus_1.ValidatingCommandBus, validating_query_bus_1.ValidatingQueryBus]
    })
], CqrsValidationModule);
//# sourceMappingURL=cqrs-validation.module.js.map