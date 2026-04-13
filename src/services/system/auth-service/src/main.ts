import { resolveCommonProtoPath } from '@oes/common/contracts'
import { initOtelSdk } from '@oes/common/tracing'
import { AppLogger } from '@oes/common/logging'
import { NestFactory } from '@nestjs/core'
import { MicroserviceOptions, Transport } from '@nestjs/microservices'
import { AppModule } from './app.module'

async function bootstrap() {
  initOtelSdk(process.env.MODULE_NAME || 'auth-service')

  const microservice = await NestFactory.createMicroservice<MicroserviceOptions>(AppModule, {
    transport: Transport.GRPC,
    options: {
      package: 'auth_service',
      protoPath: resolveCommonProtoPath('auth_service/auth.proto'),
      url: `${process.env.GRPC_LISTEN_HOST || '0.0.0.0'}:${process.env.GRPC_LISTEN_PORT || '50050'}`
    }
  })

  microservice.useLogger(microservice.get(AppLogger))
  await microservice.listen()
}

bootstrap()
