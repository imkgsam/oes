import { NestFactory } from '@nestjs/core'
import { MicroserviceOptions, Transport } from '@nestjs/microservices'
import { resolveCommonProtoPath } from '@oes/common/contracts'
import { AppLogger } from '@oes/common/logging'
import { initOtelSdk } from '@oes/common/tracing'
import { AppModule } from './app.module'

// bootstrap starts browser-activity-service as a gRPC microservice using the shared contract proto.
async function bootstrap() {
  initOtelSdk(process.env.MODULE_NAME || 'browser-activity-service')
  const app = await NestFactory.createMicroservice<MicroserviceOptions>(AppModule, {
    bufferLogs: true,
    transport: Transport.GRPC,
    options: {
      package: 'browser_activity_service',
      protoPath: [resolveCommonProtoPath('browser_activity_service/browser_activity.proto')],
      url: `${process.env.GRPC_LISTEN_HOST || '0.0.0.0'}:${process.env.GRPC_LISTEN_PORT || '50070'}`
    }
  })

  app.useLogger(app.get(AppLogger))
  await app.listen()
}

void bootstrap()
