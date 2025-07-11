import { NestFactory } from '@nestjs/core'
import { AppModule } from './app.module'
import { HttpExceptionFilter } from './common/filters/http-exception.filter'
import { LoggingInterceptor } from './common/interceptors/logging.interceptor'

async function bootstrap() {
  const app = await NestFactory.create(AppModule)
  // app.useGlobalInterceptors(new LoggingInterceptor())
  // app.useGlobalFilters(new HttpExceptionFilter());
  await app.listen(process.env.API_GATEWAY_PORT ?? 9101)
}
bootstrap()
