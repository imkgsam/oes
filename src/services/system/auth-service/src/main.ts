import { resolveCommonProtoPath } from '@oes/common/contracts'
import { initOtelSdk } from '@oes/common/tracing'
import { AppLogger } from '@oes/common/logging'
import { NestFactory } from '@nestjs/core'
import { MicroserviceOptions, Transport } from '@nestjs/microservices'
import { AppModule } from './app.module'

async function bootstrap() {
  initOtelSdk(process.env.MODULE_NAME || 'auth-service')

  const app = await NestFactory.create(AppModule, { bufferLogs: true })
  app.connectMicroservice<MicroserviceOptions>({ transport: Transport.GRPC, options: { package: 'auth_service', protoPath: [resolveCommonProtoPath('auth_service/auth.proto'), resolveCommonProtoPath('auth_service/execution_token.proto')], url: `${process.env.GRPC_LISTEN_HOST || '0.0.0.0'}:${process.env.GRPC_LISTEN_PORT || '50050'}` } })
  app.useLogger(app.get(AppLogger))
  await app.startAllMicroservices()
  await app.listen(process.env.AUTH_HTTP_PORT || 50051)
}

bootstrap()
