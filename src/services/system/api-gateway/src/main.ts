// File: src/services/system/api-gateway/src/main.ts

import { initOtelSdk } from '@oes/common/tracing/otel-sdk'
import { NestFactory } from '@nestjs/core'
import { ValidationPipe } from '@nestjs/common'
import { ConfigService } from '@nestjs/config'
import helmet from 'helmet'
import { AppLogger } from '@oes/common/logging/app-logger.service'
import { OtelExceptionFilter } from '@oes/common/core/filters/otel-exception.filter'
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

  // ── API versioning ──
  app.setGlobalPrefix(config.get<string>('gateway.globalPrefix', 'api/v1'), {
    exclude: ['health', 'health/ready', 'docs', 'docs-json']
  })

  // ── Security (pluggable — move to APISIX later) ──
  app.use(helmet())
  app.enableCors({
    origin: config.get<string[]>('gateway.cors.origins', ['*']),
    methods: config.get<string>('gateway.cors.methods', 'GET,HEAD,PUT,PATCH,POST,DELETE,OPTIONS'),
    credentials: config.get<boolean>('gateway.cors.credentials', true)
  })

  // ── Validation ──
  app.useGlobalPipes(
    new ValidationPipe({
      transform: true,
      whitelist: true,
      forbidNonWhitelisted: true,
      forbidUnknownValues: true
    })
  )

  // ── Interceptors ──
  // interceptor执行顺序是： 先注册先执行
  app.useGlobalInterceptors(app.get(TimeoutInterceptor), new ResponseTransformInterceptor())
  // filter 的执行顺序是： 后注册先执行
  app.useGlobalFilters(new GatewayExceptionFilter(logger), new OtelExceptionFilter())

  // ── Swagger (pluggable — disable in production if needed) ──
  if (config.get<boolean>('gateway.swagger.enabled', true)) {
    setupSwagger(app)
  }

  // ── Graceful shutdown ──
  app.enableShutdownHooks()

  const port = config.get<number>('gateway.port', 9101)
  await app.listen(port)
  logger.log(`API Gateway listening on port ${port}`)
}

bootstrap()
