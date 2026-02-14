// File: src/services/system/api-gateway/src/main.ts
// 初始化otel sdk
import { initOtelSdk } from '@oes/common/tracing/otel-sdk'
import { AppLogger } from '@oes/common/logging/app-logger.service'

import { NestFactory } from '@nestjs/core'
import { AppModule } from './app.module'
import { GatewayExceptionFilter } from './common/filters/gateway-exception.filter'
import { OtelExceptionFilter } from '@oes/common/core/filters/otel-exception.filter'
import { ResponseTransformInterceptor } from './common/interceptors/response.interceptor'
import { GatewayJwtAuthGuard } from '@oes/common/auth/guards/gateway-jwt-auth.guard'
async function bootstrap() {
  initOtelSdk(process.env.MODULE_NAME || 'api-gateway')
  const app = await NestFactory.create(AppModule)
  //设置自定义日志服务
  app.useLogger(app.get(AppLogger))
  app.useGlobalGuards(app.get(GatewayJwtAuthGuard))
  //使用全局过滤器
  app.useGlobalFilters(new OtelExceptionFilter(), new GatewayExceptionFilter(app.get(AppLogger)))
  //使用全局拦截器 返回结构化res
  app.useGlobalInterceptors(new ResponseTransformInterceptor())
  await app.listen(process.env.API_GATEWAY_PORT ?? 9101)
}
bootstrap()
