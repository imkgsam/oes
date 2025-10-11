// app.module.ts 或任何需要HTTP客户端的模块
import { Module } from '@nestjs/common'
import { HttpModule } from '@oes/common/modules/http/http.module'

@Module({
imports: [
HttpModule, // 导入HTTP模块
// 其他模块...
],
// ...
})
export class AppModule {}

// 任何服务中
import { Injectable } from '@nestjs/common'
import { HttpServiceFactory } from '@oes/common/modules/http/http.service'

@Injectable()
export class SomeService {
constructor(
private readonly httpFactory: HttpServiceFactory // 注入工厂
) {}
}

@Injectable()
export class ExternalApiService {
constructor(private readonly httpFactory: HttpServiceFactory) {}

async callExternalApi() {
// 创建HTTP客户端
const client = this.httpFactory.createClient({
baseURL: 'https://api.external.com',
timeout: 10000,
retries: 3,
headers: {
'Authorization': 'Bearer your-token',
'Content-Type': 'application/json'
}
})

    try {
      // 调用外部API
      const result = await client.get('/users')
      return result
    } catch (error) {
      // 错误处理
      console.error('External API call failed:', error)
      throw error
    }

}
}
