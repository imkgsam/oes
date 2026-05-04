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
exports.DefaultInternalServiceAuthenticator = void 0;
const common_1 = require("@nestjs/common");
const config_1 = require("@nestjs/config");
const constants_1 = require("../constants");
const utils_1 = require("../utils");
let DefaultInternalServiceAuthenticator = class DefaultInternalServiceAuthenticator {
    configService;
    constructor(configService) {
        this.configService = configService;
    }
    authenticate(metadata) {
        const serviceName = (0, utils_1.getGrpcMetadataValue)(metadata, constants_1.INTERNAL_SERVICE_NAME_METADATA_KEY)?.trim();
        if (!serviceName) {
            return {
                authenticated: false,
                reason: 'missing x-internal-service-name'
            };
        }
        const trustedServices = this.configService
            .get('INTERNAL_SERVICE_TRUSTED_SERVICES')
            ?.split(',')
            .map((item) => item.trim())
            .filter(Boolean);
        if (trustedServices && trustedServices.length > 0 && !trustedServices.includes(serviceName)) {
            return {
                authenticated: false,
                reason: `service ${serviceName} is not in trusted allowlist`
            };
        }
        return {
            authenticated: true,
            principal: {
                serviceName
            }
        };
    }
};
exports.DefaultInternalServiceAuthenticator = DefaultInternalServiceAuthenticator;
exports.DefaultInternalServiceAuthenticator = DefaultInternalServiceAuthenticator = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [config_1.ConfigService])
], DefaultInternalServiceAuthenticator);
//# sourceMappingURL=default-internal-service-authenticator.service.js.map