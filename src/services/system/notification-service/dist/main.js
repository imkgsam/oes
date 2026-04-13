"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const contracts_1 = require("@oes/common/contracts");
const tracing_1 = require("@oes/common/tracing");
const logging_1 = require("@oes/common/logging");
const core_1 = require("@nestjs/core");
const microservices_1 = require("@nestjs/microservices");
const app_module_1 = require("./app.module");
async function bootstrap() {
    (0, tracing_1.initOtelSdk)(process.env.MODULE_NAME || 'notification-service');
    const microservice = await core_1.NestFactory.createMicroservice(app_module_1.AppModule, {
        transport: microservices_1.Transport.GRPC,
        options: {
            package: 'notification_service',
            protoPath: (0, contracts_1.resolveCommonProtoPath)('notification_service/notification.proto'),
            url: `${process.env.GRPC_LISTEN_HOST || '0.0.0.0'}:${process.env.GRPC_LISTEN_PORT || '50053'}`
        }
    });
    microservice.useLogger(microservice.get(logging_1.AppLogger));
    await microservice.listen();
}
bootstrap();
//# sourceMappingURL=main.js.map