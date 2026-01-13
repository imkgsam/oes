// src/services/system/auth-service/src/main.ts
import { NestFactory } from '@nestjs/core'
import { AppModule } from './app.module'
import { ValidationPipe } from '@nestjs/common'
import { MicroserviceOptions, Transport } from '@nestjs/microservices'
import { MicroserviceExceptionsFilter } from '@oes/common/filters/microservice-exception.filter'
import { SERVICE_ENDPOINTS_CONFIG } from '@oes/common/modules/clients/service-map'
import { RpcResponseInterceptor } from '@oes/common/interceptors/rpc-response.interceptor'

async function bootstrap() {
  const microservice = await NestFactory.createMicroservice<MicroserviceOptions>(AppModule, {
    transport: Transport.TCP,
    options: {
      host: SERVICE_ENDPOINTS_CONFIG.AUTH_TCP.host,
      port: Number(SERVICE_ENDPOINTS_CONFIG.AUTH_TCP.port)
    }
  })
  microservice.useGlobalPipes(
    new ValidationPipe({
      transform: true,
      whitelist: true,
      forbidNonWhitelisted: true,
      forbidUnknownValues: true,
      validateCustomDecorators: true
    })
  )
  microservice.useGlobalFilters(new MicroserviceExceptionsFilter(process.env.MODULE_NAME))
  microservice.useGlobalInterceptors(new RpcResponseInterceptor(process.env.MODULE_NAME))
  await microservice.listen()
}
bootstrap()
