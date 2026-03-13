import { INestApplication } from '@nestjs/common'
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger'

export function setupSwagger(app: INestApplication): void {
  const config = new DocumentBuilder()
    .setTitle('OES API Gateway')
    .setDescription('Open Enterprise System — Unified API Entry Point')
    .setVersion('1.0')
    .addBearerAuth({ type: 'http', scheme: 'bearer', bearerFormat: 'JWT' }, 'JWT')
    .addTag('auth', 'Authentication')
    .addTag('permission', 'Permission management')
    .addTag('role', 'Role management')
    .addTag('identity', 'Identity management')
    .addTag('health', 'Health checks')
    .build()

  const document = SwaggerModule.createDocument(app, config)
  SwaggerModule.setup('docs', app, document)
}
