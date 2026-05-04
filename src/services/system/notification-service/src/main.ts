import { resolveCommonProtoPath } from '@oes/common/contracts'
import { initOtelSdk } from '@oes/common/tracing'
import { AppLogger } from '@oes/common/logging'
import { NestFactory } from '@nestjs/core'
import { MicroserviceOptions, Transport } from '@nestjs/microservices'
import { AppModule } from './app.module'

async function bootstrap() {
  initOtelSdk(process.env.MODULE_NAME || 'notification-service')

  const microservice = await NestFactory.createMicroservice<MicroserviceOptions>(AppModule, {
    bufferLogs: true,
    transport: Transport.GRPC,
    options: {
      package: 'notification_service',
      protoPath: resolveCommonProtoPath('notification_service/notification.proto'),
      url: `${process.env.GRPC_LISTEN_HOST || '0.0.0.0'}:${process.env.GRPC_LISTEN_PORT || '50053'}`
    }
  })

  microservice.useLogger(microservice.get(AppLogger))
  await microservice.listen()
}

bootstrap()
