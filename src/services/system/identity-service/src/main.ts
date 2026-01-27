// File: src/services/system/identity-service/src/main.ts

// 初始化otel sdk
import { initOtelSdk } from '@oes/common/tracing/otel-sdk'
import { AppLogger } from '@oes/common/logging/app-logger.service'

import { NestFactory } from '@nestjs/core'
import { AppModule } from './app.module'
import { ValidationPipe } from '@nestjs/common'
import { MicroserviceOptions, Transport } from '@nestjs/microservices'
import { MicroserviceExceptionsFilter } from '@oes/common/filters/microservice-exception.filter'
import { SERVICE_ENDPOINTS_CONFIG } from '@oes/common/rpc/clients/service-map'

async function bootstrap() {
  initOtelSdk(process.env.OTEL_SERVICE_NAME || 'identity-service')
  const microservice = await NestFactory.createMicroservice<MicroserviceOptions>(AppModule, {
    transport: Transport.TCP,
    options: {
      host: SERVICE_ENDPOINTS_CONFIG.IDENT_TCP.host,
      port: Number(SERVICE_ENDPOINTS_CONFIG.IDENT_TCP.port)
    }
  })

  //设置自定义日志服务
  microservice.useLogger(microservice.get(AppLogger))
  microservice.useGlobalPipes(new ValidationPipe())
  microservice.useGlobalFilters(new MicroserviceExceptionsFilter(process.env.MODULE_NAME))
  await microservice.listen()
}
bootstrap()
