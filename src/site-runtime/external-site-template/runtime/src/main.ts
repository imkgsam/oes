import 'reflect-metadata'

import { NestFactory } from '@nestjs/core'

import { AppModule } from './app.module'

// bootstrap starts the standalone Site Runtime backend with rawBody enabled for webhook signing.
async function bootstrap(): Promise<void> {
  const app = await NestFactory.create(AppModule, { rawBody: true })
  app.enableCors({
    origin: process.env.STOREFRONT_INTERNAL_ORIGIN ?? true,
    credentials: false
  })
  const port = Number(process.env.SITE_RUNTIME_PORT ?? 4301)
  const host = process.env.SITE_RUNTIME_HOST ?? '127.0.0.1'
  await app.listen(port, host)
}

void bootstrap()
