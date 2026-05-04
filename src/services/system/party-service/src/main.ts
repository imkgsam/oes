import { NestFactory } from '@nestjs/core'
import { MicroserviceOptions, Transport } from '@nestjs/microservices'
import { resolveCommonProtoPath } from '@oes/common/contracts'
import { initOtelSdk } from '@oes/common/tracing'
import { AppLogger } from '@oes/common/logging'
import { AppModule } from './app.module'

async function bootstrap() {
  initOtelSdk(process.env.MODULE_NAME || 'party-service')
  const app = await NestFactory.createMicroservice<MicroserviceOptions>(AppModule, {
    bufferLogs: true,
    transport: Transport.GRPC,
    options: {
      package: 'party_service',
      protoPath: [resolveCommonProtoPath('party_service/party.proto')],
      url: `${process.env.GRPC_LISTEN_HOST || '0.0.0.0'}:${process.env.GRPC_LISTEN_PORT || '50053'}`
    }
  })

  app.useLogger(app.get(AppLogger))
  await app.listen()
}

bootstrap()
