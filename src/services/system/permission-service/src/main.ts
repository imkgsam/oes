import { NestFactory } from '@nestjs/core'
import { AppModule } from './app.module'
import { ValidationPipe } from '@nestjs/common'
import { MicroserviceOptions, Transport } from '@nestjs/microservices'
import { MicroserviceExceptionsFilter } from '@oes/common/filters/microservice-exception.filter'

async function bootstrap() {

  const microservice = await NestFactory.createMicroservice<MicroserviceOptions>(AppModule, {
    transport: Transport.TCP,
    options: {
      host: '127.0.0.1',
      port: Number(process.env.PERMISSION_TCP_PORT ?? '9302'),
    },
  })

  microservice.useGlobalPipes(new ValidationPipe())
  microservice.useGlobalFilters(new MicroserviceExceptionsFilter('PERMISSION_SERVICE'))
  await microservice.listen()
}
bootstrap()
