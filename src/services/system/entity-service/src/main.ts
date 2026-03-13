// src/services/system/entity-service/src/main.ts

// 鍒濆鍖杘tel sdk
import { initOtelSdk } from '@oes/common/tracing'
import { AppLogger } from '@oes/common/logging'

import { NestFactory } from '@nestjs/core'
import { AppModule } from './app.module'
import { ValidationPipe } from '@nestjs/common'
import { MicroserviceOptions, Transport } from '@nestjs/microservices'
import { MicroserviceExceptionsFilter } from '@oes/common/filters'
import { SERVICE_ENDPOINTS_CONFIG } from '@oes/common/clients'

async function bootstrap() {
  initOtelSdk(process.env.MODULE_NAME || 'entity-service')
  const microservice = await NestFactory.createMicroservice<MicroserviceOptions>(AppModule, {
    transport: Transport.TCP,
    options: {
      host: SERVICE_ENDPOINTS_CONFIG.ENTITY_TCP.host,
      port: Number(SERVICE_ENDPOINTS_CONFIG.ENTITY_TCP.port)
    }
  })
  //璁剧疆鑷畾涔夋棩蹇楁湇鍔?  microservice.useLogger(microservice.get(AppLogger))
  microservice.useGlobalPipes(new ValidationPipe())
  microservice.useGlobalFilters(new MicroserviceExceptionsFilter(process.env.MODULE_NAME))
  await microservice.listen()
}
bootstrap()
