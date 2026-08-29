import { NestFactory } from '@nestjs/core'
import { MicroserviceOptions, Transport } from '@nestjs/microservices'
import { resolveCommonProtoPath } from '@oes/common/contracts'
import { AppLogger } from '@oes/common/logging'
import { initOtelSdk } from '@oes/common/tracing'
import { createGrpcServerCredentials } from '@oes/common/transport'
import { AppModule } from './app.module'

// bootstrap starts public-entry-service as an internal gRPC microservice.
async function bootstrap() {
  initOtelSdk(process.env.MODULE_NAME || 'public-entry-service')
  const app = await NestFactory.createMicroservice<MicroserviceOptions>(AppModule, {
    bufferLogs: true,
    transport: Transport.GRPC,
    options: {
      package: 'public_entry_service',
      protoPath: [resolveCommonProtoPath('public_entry_service/public_entry.proto')],
      url: `${process.env.GRPC_LISTEN_HOST || '0.0.0.0'}:${process.env.GRPC_LISTEN_PORT || '50067'}`,
      credentials: createGrpcServerCredentials()
    }
  })

  app.useLogger(app.get(AppLogger))
  await app.listen()
}

void bootstrap()
