import { NestFactory } from '@nestjs/core'
import { AppModule } from './app.module'
import { ApiGatewayExceptionsFilter } from '@oes/common/filters/api-gateway-exception.filter'
import { TraceIdMiddleware } from 'src/common/middlewares/trace-id.middleware'
import { ResponseTransformInterceptor } from './common/interceptors/response.interceptor'
import { SwaggerModule, DocumentBuilder } from '@nestjs/swagger';

async function bootstrap() {
  const app = await NestFactory.create(AppModule)
  //使用全局过滤器
  app.useGlobalFilters(new ApiGatewayExceptionsFilter())
  //使用全局拦截器返回结构化res
  app.useGlobalInterceptors(new ResponseTransformInterceptor())
  //使用中间件来确保traceid 存在
  app.use(new TraceIdMiddleware().use)

  // ✅ Swagger 文档 配置
  const config = new DocumentBuilder()
    .setTitle('OES 项目 API 文档')
    .setDescription('自动生成的 Swagger 文档')
    .setVersion('1.0')
    .addBearerAuth()
    .build()
  const document = SwaggerModule.createDocument(app, config)
  SwaggerModule.setup('api-docs', app, document)

  await app.listen(process.env.API_GATEWAY_PORT ?? 9101)
}
bootstrap()
