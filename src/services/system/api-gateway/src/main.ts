import { NestFactory } from '@nestjs/core'
import { AppModule } from './app.module'
import { ApiGatewayExceptionsFilter } from './common/filters/api-gateway-exception.filter'
import { ResponseTransformInterceptor } from './common/interceptors/response.interceptor'

async function bootstrap() {
  const app = await NestFactory.create(AppModule)
  //使用全局过滤器
  app.useGlobalFilters(new ApiGatewayExceptionsFilter())
  //使用全局拦截器 返回结构化res
  app.useGlobalInterceptors(new ResponseTransformInterceptor())
  
  await app.listen(process.env.API_GATEWAY_PORT ?? 9101)
}
bootstrap()
