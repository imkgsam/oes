import { NestFactory } from '@nestjs/core'
import { AppModule } from './app.module'
import { ValidationPipe } from '@nestjs/common'
import { MicroserviceOptions, Transport } from '@nestjs/microservices'
import { AllRpcExceptionsFilter } from '@oes/common/filters/all-rpc-exception.filter'

async function bootstrap() {
  const app = await NestFactory.create(AppModule)
  app.useGlobalPipes(new ValidationPipe())
  await app.listen(process.env.PERMISSION_HTTP_PORT ?? 9201)

  const microservice = app.connectMicroservice<MicroserviceOptions>({
    transport: Transport.TCP,
    options: {
      host: '127.0.0.1',
      port: Number(process.env.PERMISSION_TCP_PORT ?? '9202'),
    }, 
  })
  microservice.useGlobalFilters(new AllRpcExceptionsFilter('AUTH_SERVICE'))
  await app.startAllMicroservices()
}
bootstrap()
