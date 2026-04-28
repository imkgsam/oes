import { NestFactory } from '@nestjs/core'
import { MicroserviceOptions, Transport } from '@nestjs/microservices'
import { resolveCommonProtoPath } from '@oes/common/contracts'
import { AppLogger } from '@oes/common/logging'
import { initOtelSdk } from '@oes/common/tracing'
import { AppModule } from './app.module'

/** bootstrap starts the crm-service gRPC runtime on the shared Nest microservice stack. */
async function bootstrap(): Promise<void> {
  initOtelSdk(process.env.MODULE_NAME || 'crm-service')
  const app = await NestFactory.createMicroservice<MicroserviceOptions>(AppModule, {
    transport: Transport.GRPC,
    options: {
      package: 'crm_service',
      protoPath: [resolveCommonProtoPath('crm_service/crm.proto')],
      url: `${process.env.GRPC_LISTEN_HOST || '0.0.0.0'}:${process.env.GRPC_LISTEN_PORT || '50060'}`
    }
  })

  app.useLogger(app.get(AppLogger))
  await app.listen()
}

void bootstrap()
