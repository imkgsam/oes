// src/services/system/entity-service/src/main.ts

// Initialize OpenTelemetry before the Nest microservice starts.
import { initOtelSdk } from '@oes/common/tracing'
import { AppLogger } from '@oes/common/logging'

import { NestFactory } from '@nestjs/core'
import { AppModule } from './app.module'
import { ValidationPipe } from '@nestjs/common'
import { MicroserviceOptions, Transport } from '@nestjs/microservices'
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
  // Use the shared application logger once the microservice is created.
  microservice.useLogger(microservice.get(AppLogger))
  microservice.useGlobalPipes(new ValidationPipe())
  await microservice.listen()
}
bootstrap()
