// File: src/services/system/api-gateway/src/main.ts

import { initOtelSdk } from '@oes/common/tracing'
import { NestFactory } from '@nestjs/core'
import { ValidationPipe } from '@nestjs/common'
import { ConfigService } from '@nestjs/config'
import helmet from 'helmet'
import { AppLogger } from '@oes/common/logging'
import { OtelExceptionFilter } from '@oes/common/filters'
import { AppModule } from './app.module'
import { GatewayExceptionFilter } from './common/filters/gateway-exception.filter'
import { ResponseTransformInterceptor } from './common/interceptors/response.interceptor'
import { TimeoutInterceptor } from './common/interceptors/timeout.interceptor'
import { setupSwagger } from './config/swagger.setup'

async function bootstrap() {
  initOtelSdk(process.env.MODULE_NAME || 'api-gateway')

  const app = await NestFactory.create(AppModule, { bufferLogs: true })
  const config = app.get(ConfigService)
  const logger = app.get(AppLogger)

  app.useLogger(logger)

  // 鈹€鈹€ http API versioning 鈹€鈹€
  app.setGlobalPrefix(config.get<string>('gateway.globalPrefix', 'api/v1'), {
    exclude: ['health', 'health/ready', 'docs', 'docs-json']
  })

  // 鈹€鈹€ Security (pluggable 鈥?move to APISIX later) 鈹€鈹€
  app.use(helmet())
  app.enableCors({
    origin: config.get<string[]>('gateway.cors.origins', ['*']),
    methods: config.get<string>('gateway.cors.methods', 'GET,HEAD,PUT,PATCH,POST,DELETE,OPTIONS'),
    credentials: config.get<boolean>('gateway.cors.credentials', false)
  })

  // 鈹€鈹€ Validation 鈹€鈹€
  app.useGlobalPipes(
    new ValidationPipe({
      transform: true,
      whitelist: true,
      forbidNonWhitelisted: true,
      forbidUnknownValues: true
    })
  )

  // 鈹€鈹€ Interceptors 鈹€鈹€
  // interceptor鎵ц椤哄簭鏄細 鍏堟敞鍐屽厛鎵ц
  app.useGlobalInterceptors(app.get(TimeoutInterceptor), app.get(ResponseTransformInterceptor))
  // filter 鐨勬墽琛岄『搴忔槸锛?鍚庢敞鍐屽厛鎵ц
  app.useGlobalFilters(app.get(GatewayExceptionFilter), app.get(OtelExceptionFilter))

  // 鈹€鈹€ Swagger (pluggable 鈥?disable in production if needed) 鈹€鈹€
  if (config.get<boolean>('gateway.swagger.enabled', true)) {
    setupSwagger(app)
  }

  // 鈹€鈹€ Graceful shutdown 鈹€鈹€
  app.enableShutdownHooks()

  const port = config.get<number>('gateway.port', 9101)
  await app.listen(port)
  logger.log(`API Gateway listening on port ${port}`)
}

bootstrap()
