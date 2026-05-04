"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.AuthorizationModule = void 0;
const common_1 = require("@nestjs/common");
const config_1 = require("@nestjs/config");
const auth_1 = require("../auth");
const constants_1 = require("./constants");
const guards_1 = require("./guards");
const interceptors_1 = require("./interceptors");
const services_1 = require("./services");
let AuthorizationModule = class AuthorizationModule {
};
exports.AuthorizationModule = AuthorizationModule;
exports.AuthorizationModule = AuthorizationModule = __decorate([
    (0, common_1.Global)(),
    (0, common_1.Module)({
        imports: [config_1.ConfigModule.forFeature(auth_1.authKeyConfig)],
        providers: [
            services_1.DefaultInternalServiceAuthenticator,
            services_1.DenyAllOperatorPermissionResolver,
            services_1.DefaultGrpcMetadataPropagationFactory,
            services_1.GrpcRequestContextStore,
            interceptors_1.GrpcRequestContextInterceptor,
            services_1.OperatorContextCryptoService,
            guards_1.InternalServiceGuard,
            guards_1.AuthenticatedOperatorGuard,
            guards_1.PermissionGuard,
            {
                provide: constants_1.INTERNAL_SERVICE_AUTHENTICATOR,
                useExisting: services_1.DefaultInternalServiceAuthenticator
            },
            {
                provide: constants_1.GRPC_METADATA_PROPAGATION_FACTORY,
                useExisting: services_1.DefaultGrpcMetadataPropagationFactory
            },
            {
                provide: constants_1.OPERATOR_CONTEXT_SIGNER,
                useExisting: services_1.OperatorContextCryptoService
            },
            {
                provide: constants_1.OPERATOR_CONTEXT_VERIFIER,
                useExisting: services_1.OperatorContextCryptoService
            },
            {
                provide: constants_1.OPERATOR_PERMISSION_RESOLVER,
                useExisting: services_1.DenyAllOperatorPermissionResolver
            }
        ],
        exports: [
            services_1.OperatorContextCryptoService,
            services_1.DefaultGrpcMetadataPropagationFactory,
            services_1.GrpcRequestContextStore,
            interceptors_1.GrpcRequestContextInterceptor,
            guards_1.InternalServiceGuard,
            guards_1.AuthenticatedOperatorGuard,
            guards_1.PermissionGuard,
            constants_1.GRPC_METADATA_PROPAGATION_FACTORY,
            constants_1.INTERNAL_SERVICE_AUTHENTICATOR,
            constants_1.OPERATOR_PERMISSION_RESOLVER,
            constants_1.OPERATOR_CONTEXT_SIGNER,
            constants_1.OPERATOR_CONTEXT_VERIFIER
        ]
    })
], AuthorizationModule);
//# sourceMappingURL=authorization.module.js.map