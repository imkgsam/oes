import { NestFactory } from '@nestjs/core'
import { MicroserviceOptions, Transport } from '@nestjs/microservices'
import { resolveCommonProtoPath } from '@oes/common/contracts'
import { AppLogger } from '@oes/common/logging'
import { initOtelSdk } from '@oes/common/tracing'
import { AppModule } from './app.module'

/** bootstrap starts the srm-service gRPC runtime on the shared Nest microservice stack. */
async function bootstrap(): Promise<void> {
  initOtelSdk(process.env.MODULE_NAME || 'srm-service')
  const app = await NestFactory.createMicroservice<MicroserviceOptions>(AppModule, {
    transport: Transport.GRPC,
    options: {
      package: 'srm_service',
      protoPath: [resolveCommonProtoPath('srm_service/srm.proto')],
      url: `${process.env.GRPC_LISTEN_HOST || '0.0.0.0'}:${process.env.GRPC_LISTEN_PORT || '50060'}`
    }
  })

  app.useLogger(app.get(AppLogger))
  await app.listen()
}

void bootstrap()
