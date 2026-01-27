//File: src/services/system/permission-service/src/main.ts

// 初始化otel sdk
import { initOtelSdk } from '@oes/common/tracing/otel-sdk'
import { AppLogger } from '@oes/common/logging/app-logger.service'

import { NestFactory } from '@nestjs/core'
import { AppModule } from './app.module'
import { ValidationPipe } from '@nestjs/common'
import { MicroserviceOptions, Transport } from '@nestjs/microservices'
import { MicroserviceExceptionsFilter } from '@oes/common/rpc/filters/microservice-exception.filter'
import { SERVICE_ENDPOINTS_CONFIG } from '@oes/common/modules/clients/service-map'

async function bootstrap() {
  initOtelSdk(process.env.OTEL_SERVICE_NAME || 'permission-service')
  const microservice = await NestFactory.createMicroservice<MicroserviceOptions>(AppModule, {
    transport: Transport.TCP,
    options: {
      host: SERVICE_ENDPOINTS_CONFIG.PERMISSION_TCP.host,
      port: Number(SERVICE_ENDPOINTS_CONFIG.PERMISSION_TCP.port)
    }
  })
  //设置自定义日志服务
  microservice.useLogger(microservice.get(AppLogger))
  microservice.useGlobalPipes(new ValidationPipe())
  microservice.useGlobalFilters(new MicroserviceExceptionsFilter(process.env.MODULE_NAME))
  await microservice.listen()
}
bootstrap()
