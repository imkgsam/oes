"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const core_1 = require("@nestjs/core");
const microservices_1 = require("@nestjs/microservices");
const contracts_1 = require("@oes/common/contracts");
const logging_1 = require("@oes/common/logging");
const tracing_1 = require("@oes/common/tracing");
const app_module_1 = require("./app.module");
/** bootstrap starts the srm-service gRPC runtime on the shared Nest microservice stack. */
async function bootstrap() {
    (0, tracing_1.initOtelSdk)(process.env.MODULE_NAME || 'srm-service');
    const app = await core_1.NestFactory.createMicroservice(app_module_1.AppModule, {
        transport: microservices_1.Transport.GRPC,
        options: {
            package: 'srm_service',
            protoPath: [(0, contracts_1.resolveCommonProtoPath)('srm_service/srm.proto')],
            url: `${process.env.GRPC_LISTEN_HOST || '0.0.0.0'}:${process.env.GRPC_LISTEN_PORT || '50060'}`
        }
    });
    app.useLogger(app.get(logging_1.AppLogger));
    await app.listen();
}
void bootstrap();
//# sourceMappingURL=main.js.map