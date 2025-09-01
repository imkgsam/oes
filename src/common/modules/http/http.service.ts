import { Injectable, Logger } from '@nestjs/common'
import { HttpClient } from './http.client'
import { HttpClientOptions } from './http.types'

@Injectable()
export class HttpServiceFactory {
  private readonly logger = new Logger(HttpServiceFactory.name)

  createClient(options: HttpClientOptions): HttpClient {
    this.logger.log(`Creating HttpClient for ${options.baseURL}`)
    return new HttpClient(options)
  }
}
