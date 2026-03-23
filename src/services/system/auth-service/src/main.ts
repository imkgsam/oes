import { initOtelSdk } from '@oes/common/tracing'
import { AppLogger } from '@oes/common/logging'
import { NestFactory } from '@nestjs/core'
import { MicroserviceOptions, Transport } from '@nestjs/microservices'
import { dirname, join } from 'path'
import { AppModule } from './app.module'

const commonPackageRoot = dirname(dirname(require.resolve('@oes/common')))

async function bootstrap() {
  initOtelSdk(process.env.MODULE_NAME || 'auth-service')

  const microservice = await NestFactory.createMicroservice<MicroserviceOptions>(AppModule, {
    transport: Transport.GRPC,
    options: {
      package: 'auth_service',
      protoPath: join(commonPackageRoot, 'src', 'contracts', 'auth_service', 'auth.proto'),
      url: `${process.env.GRPC_LISTEN_HOST || '0.0.0.0'}:${process.env.GRPC_LISTEN_PORT || '50052'}`
    }
  })

  microservice.useLogger(microservice.get(AppLogger))
  await microservice.listen()
}

bootstrap()
