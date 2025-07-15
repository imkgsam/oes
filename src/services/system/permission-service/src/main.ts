import { NestFactory } from '@nestjs/core'
import { AppModule } from './app.module'
import { ValidationPipe } from '@nestjs/common'
import { MicroserviceOptions, Transport } from '@nestjs/microservices'
import { AllRpcExceptionsFilter } from '@oes/common/filters/all-rpc-exception.filter'
import { ConfigService } from '@nestjs/config'
import { initExceptionFactory } from '@oes/common/helpers/exception.factory'


async function bootstrap() {
  
  const microservice = await NestFactory.createMicroservice<MicroserviceOptions>(AppModule, {
    transport: Transport.TCP,
    options: {
      host: '127.0.0.1',
      port: Number(process.env.PERMISSION_TCP_PORT ?? '9302'),
    },
  })
  
  // 初始化 ConfigService
  const configService = microservice.get(ConfigService)

  // ✅ 初始化 ExceptionFactory 的模块名称
  initExceptionFactory(configService)
  
  microservice.useGlobalPipes(new ValidationPipe())
  microservice.useGlobalFilters(new AllRpcExceptionsFilter('AUTH_SERVICE'))
  await microservice.listen()
}
bootstrap()
