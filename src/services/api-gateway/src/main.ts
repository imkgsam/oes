import { initOtelSdk } from '@oes/common/tracing'
import { NestFactory } from '@nestjs/core'
import { ArgumentsHost, ValidationPipe } from '@nestjs/common'
import { ConfigService } from '@nestjs/config'
import { NextFunction, Request, Response } from 'express'
import helmet from 'helmet'
import { AppLogger } from '@oes/common/logging'
import { AppModule } from './app.module'
import { GatewayExceptionFilter } from './common/filters/gateway-exception.filter'
import { ResponseTransformInterceptor } from './common/interceptors/response.interceptor'
import { TimeoutInterceptor } from './common/interceptors/timeout.interceptor'
import { resolveCorsOrigin } from './config/cors-origin.util'
import { GATEWAY_GLOBAL_PREFIX_EXCLUDES } from './config/gateway-global-prefix'
import { setupSwagger } from './config/swagger.setup'

async function bootstrap() {
  initOtelSdk(process.env.MODULE_NAME || 'api-gateway')

  const app = await NestFactory.create(AppModule, { bufferLogs: true, rawBody: true })
  const config = app.get(ConfigService)
  const logger = app.get(AppLogger)

  app.useLogger(logger)

  app.setGlobalPrefix(config.get<string>('gateway.globalPrefix', 'api/v1'), {
    exclude: GATEWAY_GLOBAL_PREFIX_EXCLUDES
  })

  app.use(helmet())
  app.enableCors({
    origin: resolveCorsOrigin(config.get<string[]>('gateway.cors.origins', ['*'])),
    methods: config.get<string>('gateway.cors.methods', 'GET,HEAD,PUT,PATCH,POST,DELETE,OPTIONS'),
    credentials: config.get<boolean>('gateway.cors.credentials', false)
  })

  app.useGlobalPipes(
    new ValidationPipe({
      transform: true,
      whitelist: true,
      forbidNonWhitelisted: true,
      forbidUnknownValues: true
    })
  )

  app.useGlobalInterceptors(app.get(TimeoutInterceptor), app.get(ResponseTransformInterceptor))
  app.useGlobalFilters(app.get(GatewayExceptionFilter))

  const gatewayExceptionFilter = app.get(GatewayExceptionFilter)
  app.use((error: unknown, req: Request, res: Response, _next: NextFunction) => {
    gatewayExceptionFilter.catch(error, {
      switchToHttp: () => ({
        getResponse: () => res,
        getRequest: () => req
      })
    } as ArgumentsHost)
  })

  if (config.get<boolean>('gateway.swagger.enabled', true)) {
    setupSwagger(app)
  }

  app.enableShutdownHooks()

  const port = config.get<number>('gateway.port', 9101)
  await app.listen(port)
  logger.log(`API Gateway listening on port ${port}`)
}

bootstrap()
