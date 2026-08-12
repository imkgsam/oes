import { NestFactory } from '@nestjs/core'
import { MicroserviceOptions, Transport } from '@nestjs/microservices'
import { resolveCommonProtoPath } from '@oes/common/contracts'
import { AppLogger } from '@oes/common/logging'
import { initOtelSdk } from '@oes/common/tracing'
import { createGrpcServerCredentials } from '@oes/common/transport'
import { AppModule } from './app.module'

/** bootstrap starts the sales-service gRPC runtime on the shared Nest microservice stack. */
async function bootstrap(): Promise<void> {
  initOtelSdk(process.env.MODULE_NAME || 'sales-service')
  const app = await NestFactory.createMicroservice<MicroserviceOptions>(AppModule, {
    bufferLogs: true,
    transport: Transport.GRPC,
    options: {
      package: 'sales_service',
      protoPath: [resolveCommonProtoPath('sales_service/sales.proto')],
      url: `${process.env.GRPC_LISTEN_HOST || '0.0.0.0'}:${process.env.GRPC_LISTEN_PORT || '50059'}`,
      credentials: createGrpcServerCredentials()
    }
  })

  app.useLogger(app.get(AppLogger))
  await app.listen()
}

void bootstrap()
