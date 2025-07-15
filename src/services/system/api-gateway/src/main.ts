import { NestFactory } from '@nestjs/core'
import { AppModule } from './app.module'
import { HttpExceptionFilter } from './common/filters/http-exception.filter'
import { LoggingInterceptor } from './common/interceptors/logging.interceptor'
import { TraceIdMiddleware } from 'src/common/middlewares/trace-id.middleware'
import { ResponseTransformInterceptor } from './common/interceptors/response.interceptor'

async function bootstrap() {
  const app = await NestFactory.create(AppModule)
  app.useGlobalFilters(new HttpExceptionFilter())
  app.useGlobalInterceptors(new ResponseTransformInterceptor())
  app.use(new TraceIdMiddleware().use)
  await app.listen(process.env.API_GATEWAY_PORT ?? 9101)
}
bootstrap()
