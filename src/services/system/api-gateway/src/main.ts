import { NestFactory } from '@nestjs/core'
import { AppModule } from './app.module'
import { ApiGatewayExceptionsFilter } from '@oes/common/filters/api-gateway-exception.filter'
import { TraceIdMiddleware } from 'src/common/middlewares/trace-id.middleware'
import { ResponseTransformInterceptor } from './common/interceptors/response.interceptor'

async function bootstrap() {
  const app = await NestFactory.create(AppModule)
  app.useGlobalFilters(new ApiGatewayExceptionsFilter())
  app.useGlobalInterceptors(new ResponseTransformInterceptor())
  app.use(new TraceIdMiddleware().use)
  await app.listen(process.env.API_GATEWAY_PORT ?? 9101)
}
bootstrap()
