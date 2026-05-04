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
exports.ValidatingQueryBus = void 0;
const common_1 = require("@nestjs/common");
const cqrs_1 = require("@nestjs/cqrs");
const class_validator_1 = require("class-validator");
const exception_factory_1 = require("../core/exceptions/exception.factory");
const index_1 = require("../core/exceptions/exception-enums/index");
let ValidatingQueryBus = class ValidatingQueryBus {
    queryBus;
    constructor(queryBus) {
        this.queryBus = queryBus;
    }
    async execute(query) {
        await this.validateQuery(query);
        return this.queryBus.execute(query);
    }
    async validateQuery(query) {
        const errors = await (0, class_validator_1.validate)(query, {
            whitelist: true,
            forbidNonWhitelisted: true,
            forbidUnknownValues: false,
            skipMissingProperties: false
        });
        if (errors.length > 0) {
            const messages = this.formatErrors(errors);
            throw exception_factory_1.ExceptionFactory.application(index_1.VALIDATION_FAILED, {
                violations: messages
            });
        }
    }
    formatErrors(errors) {
        return errors.flatMap((error) => this.extractConstraints(error));
    }
    extractConstraints(error, parentPath = '') {
        const propertyPath = parentPath ? `${parentPath}.${error.property}` : error.property;
        const messages = [];
        if (error.constraints) {
            messages.push(...Object.values(error.constraints).map((msg) => `${propertyPath}: ${msg}`));
        }
        if (error.children && error.children.length > 0) {
            for (const child of error.children) {
                messages.push(...this.extractConstraints(child, propertyPath));
            }
        }
        return messages;
    }
};
exports.ValidatingQueryBus = ValidatingQueryBus;
exports.ValidatingQueryBus = ValidatingQueryBus = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [cqrs_1.QueryBus])
], ValidatingQueryBus);
//# sourceMappingURL=validating-query-bus.js.map