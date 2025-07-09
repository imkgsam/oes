"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const core_1 = require("@nestjs/core");
const app_module_1 = require("./app.module");
const common_1 = require("@nestjs/common");
const microservices_1 = require("@nestjs/microservices");
async function bootstrap() {
    const app = await core_1.NestFactory.create(app_module_1.AppModule);
    app.useGlobalPipes(new common_1.ValidationPipe());
    await app.listen(process.env.PERMISSION_HTTP_PORT ?? 9201);
    app.connectMicroservice({
        transport: microservices_1.Transport.TCP,
        options: {
            host: '127.0.0.1',
            port: Number(process.env.PERMISSION_TCP_PORT ?? '9202')
        },
    });
    await app.startAllMicroservices();
}
bootstrap();
//# sourceMappingURL=main.js.map