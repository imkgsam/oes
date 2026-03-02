import { initOtelSdk } from '@oes/common/tracing/otel-sdk'
import { AppLogger } from '@oes/common/logging/app-logger.service'
import { NestFactory } from '@nestjs/core'
import { AppModule } from './app.module'
import { MicroserviceOptions, Transport } from '@nestjs/microservices'
import { join, resolve } from 'path'

async function bootstrap() {
  initOtelSdk(process.env.MODULE_NAME || 'permission-service')

  const app = await NestFactory.createMicroservice<MicroserviceOptions>(AppModule, {
    transport: Transport.GRPC,
    options: {
      package: 'permission_service',
      protoPath: [
        require.resolve('@oes/common/src/contracts/permission_service/permission_check.proto'),
        require.resolve('@oes/common/src/contracts/permission_service/permission_management.proto'),
        require.resolve('@oes/common/src/contracts/permission_service/policy_management.proto')
      ],
      url: `${process.env.GRPC_HOST || '0.0.0.0'}:${process.env.GRPC_PORT || '50051'}`
    }
  })

  app.useLogger(app.get(AppLogger))
  await app.listen()
}
bootstrap()
