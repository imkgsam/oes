// File: src/services/system/permission-service/src/main.ts

import { resolveCommonProtoPath } from '@oes/common/contracts'
import { initOtelSdk } from '@oes/common/tracing'
import { AppLogger } from '@oes/common/logging'
import { NestFactory } from '@nestjs/core'
import { AppModule } from './app.module'
import { MicroserviceOptions, Transport } from '@nestjs/microservices'

async function bootstrap() {
  initOtelSdk(process.env.MODULE_NAME || 'permission-service')
  const app = await NestFactory.createMicroservice<MicroserviceOptions>(AppModule, {
    bufferLogs: true,
    transport: Transport.GRPC,
    options: {
      package: 'permission_service',
      protoPath: [
        resolveCommonProtoPath('permission_service/permission_check.proto'),
        resolveCommonProtoPath('permission_service/permission_access_summary.proto'),
        resolveCommonProtoPath('permission_service/permission_management.proto'),
        resolveCommonProtoPath('permission_service/policy_management.proto')
      ],
      url: `${process.env.GRPC_LISTEN_HOST || '0.0.0.0'}:${process.env.GRPC_LISTEN_PORT || '50051'}`
    }
  })

  app.useLogger(app.get(AppLogger))
  await app.listen()
}
bootstrap()
