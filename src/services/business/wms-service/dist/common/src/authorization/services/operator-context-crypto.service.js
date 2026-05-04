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
exports.OperatorContextCryptoService = void 0;
const common_1 = require("@nestjs/common");
const config_1 = require("@nestjs/config");
const crypto_1 = require("crypto");
const fs_1 = require("fs");
const path_1 = require("path");
const auth_1 = require("../../auth");
const utils_1 = require("../utils");
let OperatorContextCryptoService = class OperatorContextCryptoService {
    configService;
    constructor(configService) {
        this.configService = configService;
    }
    sign(payload) {
        const signer = (0, crypto_1.createSign)('RSA-SHA256');
        signer.update((0, utils_1.canonicalizeOperatorContextForSigning)(payload));
        signer.end();
        return signer.sign(this.getPrivateKey(), 'base64');
    }
    verify(rawPayload) {
        let payload;
        try {
            payload = (0, utils_1.decodeOperatorContext)(rawPayload);
        }
        catch (error) {
            return {
                valid: false,
                reason: error.message
            };
        }
        const validationError = (0, utils_1.validateOperatorContextPayload)(payload);
        if (validationError) {
            return {
                valid: false,
                reason: validationError
            };
        }
        const trustedIssuers = this.configService
            .get('OPERATOR_CONTEXT_TRUSTED_ISSUERS')
            ?.split(',')
            .map((item) => item.trim())
            .filter(Boolean);
        if (trustedIssuers && trustedIssuers.length > 0 && !trustedIssuers.includes(payload.issuer)) {
            return {
                valid: false,
                reason: `issuer ${payload.issuer} is not trusted`
            };
        }
        const verifier = (0, crypto_1.createVerify)('RSA-SHA256');
        verifier.update((0, utils_1.canonicalizeOperatorContextForSigning)(payload));
        verifier.end();
        const valid = verifier.verify(this.getPublicKey(), payload.signature, 'base64');
        return {
            valid,
            payload: valid ? payload : undefined,
            reason: valid ? undefined : 'signature verification failed'
        };
    }
    getPrivateKey() {
        const config = this.getAuthKeyConfig();
        return (0, fs_1.readFileSync)((0, path_1.join)(__dirname, '../../..', config.privateKeyPath), 'utf8');
    }
    getPublicKey() {
        const config = this.getAuthKeyConfig();
        return (0, fs_1.readFileSync)((0, path_1.join)(__dirname, '../../..', config.publicKeyPath), 'utf8');
    }
    getAuthKeyConfig() {
        return this.configService.getOrThrow(auth_1.AuthKeyConfigName);
    }
};
exports.OperatorContextCryptoService = OperatorContextCryptoService;
exports.OperatorContextCryptoService = OperatorContextCryptoService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [config_1.ConfigService])
], OperatorContextCryptoService);
//# sourceMappingURL=operator-context-crypto.service.js.map