import { resolveCommonProtoPath } from '@oes/common/contracts'
import { AppLogger } from '@oes/common/logging'
import { initOtelSdk } from '@oes/common/tracing'
import { createGrpcServerCredentials } from '@oes/common/transport'
import { NestFactory } from '@nestjs/core'
import { MicroserviceOptions, Transport } from '@nestjs/microservices'
import { AppModule } from './app.module'

// bootstrap starts terminal-device-service as a gRPC microservice using the shared contract proto.
async function bootstrap() {
  initOtelSdk(process.env.MODULE_NAME || 'terminal-device-service')
  const app = await NestFactory.createMicroservice<MicroserviceOptions>(AppModule, {
    bufferLogs: true,
    transport: Transport.GRPC,
    options: {
      package: 'terminal_device_service',
      protoPath: [resolveCommonProtoPath('terminal_device_service/terminal_device.proto')],
      url: `${process.env.GRPC_LISTEN_HOST || '0.0.0.0'}:${process.env.GRPC_LISTEN_PORT || '50057'}`,
      credentials: createGrpcServerCredentials()
    }
  })

  app.useLogger(app.get(AppLogger))
  await app.listen()
}

void bootstrap()
