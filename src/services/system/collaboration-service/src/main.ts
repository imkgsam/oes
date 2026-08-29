import { NestFactory } from '@nestjs/core'
import { MicroserviceOptions, Transport } from '@nestjs/microservices'
import { resolveCommonProtoPath } from '@oes/common/contracts'
import { AppLogger } from '@oes/common/logging'
import { initOtelSdk } from '@oes/common/tracing'
import { createGrpcServerCredentials } from '@oes/common/transport'
import { AppModule } from './app.module'

/** bootstrap starts collaboration-service as an internal gRPC microservice. */
async function bootstrap() {
  initOtelSdk(process.env.MODULE_NAME || 'collaboration-service')
  const app = await NestFactory.createMicroservice<MicroserviceOptions>(AppModule, {
    bufferLogs: true,
    transport: Transport.GRPC,
    options: {
      package: 'collaboration_service',
      protoPath: [resolveCommonProtoPath('collaboration_service/collaboration.proto')],
      url: `${process.env.GRPC_LISTEN_HOST || '0.0.0.0'}:${process.env.GRPC_LISTEN_PORT || '50068'}`,
      credentials: createGrpcServerCredentials()
    }
  })

  app.useLogger(app.get(AppLogger))
  await app.listen()
}

void bootstrap().catch((error: unknown) => {
  console.error('COLLABORATION_BOOTSTRAP_FAILED', error)
  process.exitCode = 1
})
