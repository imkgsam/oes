import { initOtelSdk } from '@oes/common/tracing'
import { AppLogger } from '@oes/common/logging'
import { resolveCommonProtoPath } from '@oes/common/contracts'
import { NestFactory } from '@nestjs/core'
import { AppModule } from './app.module'
import { createAuthGrpcMicroserviceOptions } from './infrastructure/execution-token-signer/auth-grpc-bootstrap'
import { createAuthGrpcServerCredentials } from './infrastructure/execution-token-signer/auth-grpc-security'

async function bootstrap() {
  initOtelSdk(process.env.MODULE_NAME || 'auth-service')

  const app = await NestFactory.create(AppModule, { bufferLogs: true })
  app.connectMicroservice(
    createAuthGrpcMicroserviceOptions(createAuthGrpcServerCredentials(), [
      resolveCommonProtoPath('auth_service/auth.proto'),
      resolveCommonProtoPath('auth_service/execution_token.proto'),
      resolveCommonProtoPath('auth_service/external_api_key.proto')
    ])
  )
  app.useLogger(app.get(AppLogger))
  await app.startAllMicroservices()
  await app.listen(process.env.AUTH_HTTP_PORT || 50051)
}

bootstrap()
