# OES Logging Module

统一的日志解决方案，集成 OpenTelemetry 追踪上下文，支持结构化日志和第三方 SDK 兼容。

## 目录

- [特性](#特性)
- [快速开始](#快速开始)
- [API 参考](#api-参考)
- [使用场景](#使用场景)
  - [基础日志记录](#基础日志记录)
  - [NestJS 集成](#nestjs-集成)
  - [第三方 SDK 集成](#第三方-sdk-集成)
  - [请求级别日志](#请求级别日志)
  - [错误日志](#错误日志)
- [配置选项](#配置选项)
- [注意事项](#注意事项)
- [最佳实践](#最佳实践)

---

## 特性

- ✅ **OpenTelemetry 集成**: 自动注入 `traceId` 和 `spanId`
- ✅ **双模式支持**: 结构化日志 + 可变参数日志
- ✅ **NestJS 兼容**: 实现 `LoggerService` 接口
- ✅ **SDK 兼容**: 通过适配器支持 Nacos、Redis 等第三方 SDK
- ✅ **高性能**: 基于 Pino 的高性能 JSON 日志
- ✅ **类型安全**: 完整的 TypeScript 类型定义

---

## 快速开始

### 安装依赖

```bash
pnpm add pino @opentelemetry/api
```

### 基础使用

```typescript
import { AppLogger } from '@oes/common/logging'

const logger = new AppLogger({ serviceName: 'my-service' })

// 结构化日志（推荐）
logger.info('User logged in', {
  module: 'auth',
  operation: 'login',
  details: { userId: '12345' }
})

// 可变参数日志
logger.info('Server started on port', 3000)
```

### NestJS 模块导入

```typescript
import { Module } from '@nestjs/common'
import { LoggingModule } from '@oes/common/logging'

@Module({
  imports: [
    LoggingModule.forRoot({
      serviceName: 'api-gateway',
      level: 'debug'
    })
  ]
})
export class AppModule {}
```

---

## API 参考

### OesLogger 接口

```typescript
interface OesLogger {
  debug(message: string, meta?: LogMeta): void
  debug(...args: unknown[]): void

  info(message: string, meta?: LogMeta): void
  info(...args: unknown[]): void

  warn(message: string, meta?: LogMeta): void
  warn(...args: unknown[]): void

  error(message: string, meta?: LogMeta): void
  error(...args: unknown[]): void
}
```

### LogMeta 接口

```typescript
interface LogMeta {
  module?: string // 模块名称
  operation?: string // 操作名称
  errorCode?: string // 错误代码
  details?: unknown // 额外详情
  [key: string]: unknown // 自定义字段
}
```

### LogLevel 枚举

```typescript
enum LogLevel {
  DEBUG = 'debug',
  INFO = 'info',
  WARN = 'warn',
  ERROR = 'error'
}
```

---

## 使用场景

### 基础日志记录

#### 场景 1: 结构化日志（推荐用于应用代码）

```typescript
import { AppLogger } from '@oes/common/logging'

const logger = new AppLogger({ serviceName: 'user-service' })

// 信息日志
logger.info('User created successfully', {
  module: 'user',
  operation: 'create',
  details: {
    userId: 'usr_123',
    email: 'user@example.com'
  }
})

// 输出示例:
// {"level":"info","time":1708416000000,"service":"user-service","env":"production",
//  "traceId":"abc123","spanId":"def456","module":"user","operation":"create",
//  "details":{"userId":"usr_123","email":"user@example.com"},"msg":"User created successfully"}
```

#### 场景 2: 可变参数日志（兼容 console 风格）

```typescript
// 简单消息
logger.info('Server started')

// 多参数拼接
logger.info('Connected to database', 'mongodb://localhost:27017', 'with timeout', 5000)
// 输出: "Connected to database mongodb://localhost:27017 with timeout 5000"

// Printf 风格
logger.info('Request %s completed in %dms', 'req_123', 45)
// 输出: "Request req_123 completed in 45ms"
```

#### 场景 3: 不同日志级别

```typescript
// DEBUG: 详细的调试信息，仅在开发环境启用
logger.debug('Parsing request body', {
  module: 'http',
  details: { contentType: 'application/json', size: 1024 }
})

// INFO: 一般操作信息
logger.info('Order placed', {
  module: 'order',
  operation: 'create',
  details: { orderId: 'ord_456', amount: 99.99 }
})

// WARN: 潜在问题，但不影响正常运行
logger.warn('Rate limit approaching', {
  module: 'ratelimit',
  details: { current: 95, limit: 100, window: '1m' }
})

// ERROR: 错误事件
logger.error('Payment failed', {
  module: 'payment',
  operation: 'charge',
  errorCode: 'PAYMENT_DECLINED',
  details: { orderId: 'ord_456', reason: 'Insufficient funds' }
})
```

---

### NestJS 集成

#### 场景 4: 作为 NestJS 应用日志器

```typescript
// main.ts
import { NestFactory } from '@nestjs/core'
import { AppModule } from './app.module'
import { AppLogger } from '@oes/common/logging'

async function bootstrap() {
  // 使用 bufferLogs 确保启动日志也被捕获
  const app = await NestFactory.create(AppModule, { bufferLogs: true })

  // 获取 DI 容器中的 AppLogger 实例
  const logger = app.get(AppLogger)
  app.useLogger(logger)

  await app.listen(3000)
  logger.info('Application started', {
    module: 'bootstrap',
    details: { port: 3000 }
  })
}
bootstrap()
```

#### 场景 5: 在 Service 中注入使用

```typescript
import { Injectable } from '@nestjs/common'
import { AppLogger } from '@oes/common/logging'

@Injectable()
export class UserService {
  constructor(private readonly logger: AppLogger) {
    // 设置上下文，所有日志都会包含此信息
    this.logger.setContext(UserService.name)
  }

  async createUser(data: CreateUserDto): Promise<User> {
    this.logger.info('Creating user', {
      module: 'user',
      operation: 'create',
      details: { email: data.email }
    })

    try {
      const user = await this.userRepository.create(data)

      this.logger.info('User created', {
        module: 'user',
        operation: 'create',
        details: { userId: user.id }
      })

      return user
    } catch (error) {
      this.logger.error('Failed to create user', {
        module: 'user',
        operation: 'create',
        errorCode: 'USER_CREATE_FAILED',
        details: { email: data.email, error: error.message }
      })
      throw error
    }
  }
}
```

#### 场景 6: 自定义配置

```typescript
// app.module.ts
import { Module } from '@nestjs/common'
import { LoggingModule } from '@oes/common/logging'

@Module({
  imports: [
    LoggingModule.forRoot({
      serviceName: 'order-service',
      level: process.env.LOG_LEVEL || 'info',
      baseFields: {
        version: '1.0.0',
        region: 'us-east-1'
      }
    })
  ]
})
export class AppModule {}
```

---

### 第三方 SDK 集成

#### 场景 7: Nacos 服务注册

```typescript
import { Injectable, OnModuleInit } from '@nestjs/common'
import { NacosNamingClient } from 'nacos'
import { AppLogger, ConsoleLoggerAdapter } from '@oes/common/logging'

@Injectable()
export class NacosRegistryService implements OnModuleInit {
  private client: NacosNamingClient

  constructor(private readonly logger: AppLogger) {
    // 使用 ConsoleLoggerAdapter 桥接到 Nacos 期望的 Console 接口
    this.client = new NacosNamingClient({
      serverList: process.env.NACOS_SERVER!,
      namespace: process.env.NACOS_NAMESPACE,
      logger: new ConsoleLoggerAdapter(this.logger, 'nacos')
    })
  }

  async onModuleInit(): Promise<void> {
    await this.client.ready()

    await this.client.registerInstance('my-service', {
      ip: process.env.SERVICE_IP!,
      port: Number(process.env.SERVICE_PORT),
      healthy: true,
      enabled: true,
      instanceId: `${process.env.SERVICE_IP}:${process.env.SERVICE_PORT}`
    })

    this.logger.info('Service registered to Nacos', {
      module: 'nacos',
      operation: 'register'
    })
  }
}
```

#### 场景 8: Redis 客户端

```typescript
import { createClient } from 'redis'
import { AppLogger, ConsoleLoggerAdapter } from '@oes/common/logging'

const logger = new AppLogger({ serviceName: 'cache-service' })

const redisClient = createClient({
  url: 'redis://localhost:6379'
  // 某些 Redis 客户端支持自定义 logger
  // logger: new ConsoleLoggerAdapter(logger, 'redis')
})

redisClient.on('connect', () => {
  logger.info('Redis connected', { module: 'redis', operation: 'connect' })
})

redisClient.on('error', (err) => {
  logger.error('Redis error', {
    module: 'redis',
    errorCode: 'REDIS_ERROR',
    details: { error: err.message }
  })
})
```

#### 场景 9: gRPC 客户端

```typescript
import { AppLogger, ConsoleLoggerAdapter } from '@oes/common/logging'
import * as grpc from '@grpc/grpc-js'

const logger = new AppLogger({ serviceName: 'grpc-client' })

// 设置 gRPC 日志
grpc.setLogger(new ConsoleLoggerAdapter(logger, 'grpc'))
grpc.setLogVerbosity(grpc.logVerbosity.DEBUG)
```

---

### 请求级别日志

#### 场景 10: 使用 Child Logger 绑定请求上下文

```typescript
import { Injectable, NestMiddleware } from '@nestjs/common'
import { Request, Response, NextFunction } from 'express'
import { AppLogger } from '@oes/common/logging'
import { v4 as uuidv4 } from 'uuid'

@Injectable()
export class RequestLoggerMiddleware implements NestMiddleware {
  constructor(private readonly logger: AppLogger) {}

  use(req: Request, res: Response, next: NextFunction): void {
    const requestId = (req.headers['x-request-id'] as string) || uuidv4()
    const startTime = Date.now()

    // 创建绑定了 requestId 的子 logger
    const requestLogger = this.logger.child({
      requestId,
      method: req.method,
      path: req.path
    })

    // 将 logger 附加到请求对象，供后续处理器使用
    ;(req as any).logger = requestLogger

    requestLogger.info('Request started', {
      module: 'http',
      operation: 'request',
      details: {
        userAgent: req.headers['user-agent'],
        ip: req.ip
      }
    })

    res.on('finish', () => {
      const duration = Date.now() - startTime

      requestLogger.info('Request completed', {
        module: 'http',
        operation: 'response',
        details: {
          statusCode: res.statusCode,
          duration: `${duration}ms`
        }
      })
    })

    next()
  }
}
```

#### 场景 11: 在 Controller 中使用请求 Logger

```typescript
import { Controller, Get, Req } from '@nestjs/common'
import { Request } from 'express'
import { AppLogger } from '@oes/common/logging'

@Controller('users')
export class UserController {
  @Get(':id')
  async getUser(@Req() req: Request): Promise<User> {
    // 获取请求级别的 logger（包含 requestId）
    const logger = (req as any).logger as AppLogger

    logger.info('Fetching user', {
      module: 'user',
      operation: 'get',
      details: { userId: req.params.id }
    })

    // ... 业务逻辑
  }
}
```

---

### 错误日志

#### 场景 12: 异常处理

```typescript
import { ExceptionFilter, Catch, ArgumentsHost, HttpException } from '@nestjs/common'
import { AppLogger } from '@oes/common/logging'

@Catch()
export class GlobalExceptionFilter implements ExceptionFilter {
  constructor(private readonly logger: AppLogger) {}

  catch(exception: unknown, host: ArgumentsHost): void {
    const ctx = host.switchToHttp()
    const request = ctx.getRequest()
    const response = ctx.getResponse()

    const status = exception instanceof HttpException ? exception.getStatus() : 500

    const message = exception instanceof Error ? exception.message : 'Unknown error'

    // 记录错误日志
    this.logger.error('Unhandled exception', {
      module: 'exception-filter',
      operation: 'catch',
      errorCode: `HTTP_${status}`,
      details: {
        path: request.url,
        method: request.method,
        message,
        stack: exception instanceof Error ? exception.stack : undefined
      }
    })

    response.status(status).json({
      statusCode: status,
      message,
      timestamp: new Date().toISOString(),
      path: request.url
    })
  }
}
```

#### 场景 13: 业务错误日志

```typescript
import { AppLogger } from '@oes/common/logging'

class PaymentService {
  constructor(private readonly logger: AppLogger) {}

  async processPayment(orderId: string, amount: number): Promise<void> {
    this.logger.info('Processing payment', {
      module: 'payment',
      operation: 'process',
      details: { orderId, amount }
    })

    try {
      const result = await this.paymentGateway.charge(amount)

      if (!result.success) {
        // 业务错误：支付被拒绝
        this.logger.warn('Payment declined', {
          module: 'payment',
          operation: 'process',
          errorCode: 'PAYMENT_DECLINED',
          details: {
            orderId,
            reason: result.declineReason,
            retryable: result.retryable
          }
        })
        throw new PaymentDeclinedException(result.declineReason)
      }

      this.logger.info('Payment successful', {
        module: 'payment',
        operation: 'process',
        details: { orderId, transactionId: result.transactionId }
      })
    } catch (error) {
      if (error instanceof PaymentDeclinedException) {
        throw error
      }

      // 系统错误：网关不可用
      this.logger.error('Payment gateway error', {
        module: 'payment',
        operation: 'process',
        errorCode: 'GATEWAY_ERROR',
        details: {
          orderId,
          error: error.message,
          stack: error.stack
        }
      })
      throw new PaymentGatewayException('Payment gateway unavailable')
    }
  }
}
```

---

## 配置选项

### PinoOtelLoggerOptions

| 选项          | 类型                      | 默认值                           | 描述                     |
| ------------- | ------------------------- | -------------------------------- | ------------------------ |
| `serviceName` | `string`                  | 必填                             | 服务名称，用于日志标识   |
| `level`       | `string`                  | `'info'` 或 `LOG_LEVEL` 环境变量 | 日志级别                 |
| `baseFields`  | `Record<string, unknown>` | `{}`                             | 每条日志都包含的基础字段 |
| `pinoOptions` | `Partial<LoggerOptions>`  | `{}`                             | Pino 原生配置选项        |

### 环境变量

| 变量                | 描述                 | 示例                             |
| ------------------- | -------------------- | -------------------------------- |
| `LOG_LEVEL`         | 日志级别             | `debug`, `info`, `warn`, `error` |
| `NODE_ENV`          | 运行环境             | `development`, `production`      |
| `OTEL_SERVICE_NAME` | OpenTelemetry 服务名 | `api-gateway`                    |
| `SERVICE_NAME`      | 服务名（备选）       | `user-service`                   |

---

## 注意事项

### ⚠️ 性能考虑

1. **避免在热路径中使用 DEBUG 级别**

   ```typescript
   // ❌ 不推荐：在循环中记录 debug 日志
   for (const item of items) {
     logger.debug('Processing item', { details: item })
   }

   // ✅ 推荐：批量记录或使用条件判断
   logger.debug('Processing items', { details: { count: items.length } })
   ```

2. **避免记录敏感信息**

   ```typescript
   // ❌ 不推荐：记录密码、token 等敏感信息
   logger.info('User login', { details: { password: user.password } })

   // ✅ 推荐：脱敏处理
   logger.info('User login', { details: { userId: user.id } })
   ```

3. **避免记录大对象**

   ```typescript
   // ❌ 不推荐：记录完整的请求/响应体
   logger.debug('API response', { details: { body: largeResponseBody } })

   // ✅ 推荐：记录摘要信息
   logger.debug('API response', {
     details: {
       statusCode: 200,
       bodySize: JSON.stringify(largeResponseBody).length
     }
   })
   ```

### ⚠️ 类型安全

1. **使用 LogMeta 而非 any**

   ```typescript
   // ❌ 不推荐
   logger.info('Event', { foo: 'bar' } as any)

   // ✅ 推荐
   logger.info('Event', { module: 'event', details: { foo: 'bar' } })
   ```

2. **使用 isLogMeta 类型守卫**

   ```typescript
   import { isLogMeta, LogMeta } from '@oes/common/logging'

   function logWithMeta(message: string, meta: unknown): void {
     if (isLogMeta(meta)) {
       logger.info(message, meta)
     } else {
       logger.info(message, { details: meta })
     }
   }
   ```

### ⚠️ OpenTelemetry 集成

1. **确保 OpenTelemetry SDK 已初始化**

   ```typescript
   // 在应用启动时初始化 OpenTelemetry
   import { NodeSDK } from '@opentelemetry/sdk-node'

   const sdk = new NodeSDK({
     // ... 配置
   })
   sdk.start()

   // 然后再创建 logger
   const logger = new AppLogger({ serviceName: 'my-service' })
   ```

2. **traceId 和 spanId 仅在活跃 span 中可用**

   ```typescript
   import { trace } from '@opentelemetry/api'

   // 在 span 外部，traceId 和 spanId 将为 undefined
   logger.info('Outside span') // 无 traceId

   // 在 span 内部，自动注入 traceId 和 spanId
   const tracer = trace.getTracer('my-tracer')
   tracer.startActiveSpan('my-operation', (span) => {
     logger.info('Inside span') // 包含 traceId 和 spanId
     span.end()
   })
   ```

### ⚠️ ConsoleLoggerAdapter 使用

1. **仅用于第三方 SDK**

   ```typescript
   // ✅ 正确：用于 SDK 集成
   const nacosClient = new NacosNamingClient({
     logger: new ConsoleLoggerAdapter(appLogger, 'nacos')
   })

   // ❌ 错误：不要在应用代码中使用
   const adapter = new ConsoleLoggerAdapter(appLogger)
   adapter.info('This is wrong') // 应直接使用 appLogger
   ```

2. **指定模块名称便于日志过滤**
   ```typescript
   // 推荐：指定模块名称
   new ConsoleLoggerAdapter(logger, 'nacos')
   new ConsoleLoggerAdapter(logger, 'redis')
   new ConsoleLoggerAdapter(logger, 'grpc')
   ```

---

## 最佳实践

### 1. 统一日志格式

```typescript
// 定义项目级别的日志约定
const LOG_MODULES = {
  AUTH: 'auth',
  USER: 'user',
  ORDER: 'order',
  PAYMENT: 'payment',
  HTTP: 'http'
} as const

const LOG_OPERATIONS = {
  CREATE: 'create',
  READ: 'read',
  UPDATE: 'update',
  DELETE: 'delete',
  LOGIN: 'login',
  LOGOUT: 'logout'
} as const

// 使用常量确保一致性
logger.info('User created', {
  module: LOG_MODULES.USER,
  operation: LOG_OPERATIONS.CREATE,
  details: { userId: '123' }
})
```

### 2. 错误代码规范

```typescript
// 定义错误代码枚举
enum ErrorCode {
  // 认证错误 (1xxx)
  AUTH_INVALID_TOKEN = 'AUTH_1001',
  AUTH_TOKEN_EXPIRED = 'AUTH_1002',

  // 用户错误 (2xxx)
  USER_NOT_FOUND = 'USER_2001',
  USER_ALREADY_EXISTS = 'USER_2002',

  // 支付错误 (3xxx)
  PAYMENT_DECLINED = 'PAYMENT_3001',
  PAYMENT_GATEWAY_ERROR = 'PAYMENT_3002'
}

logger.error('Payment failed', {
  module: 'payment',
  errorCode: ErrorCode.PAYMENT_DECLINED,
  details: { orderId: '456' }
})
```

### 3. 日志级别使用指南

| 级别    | 使用场景                         | 生产环境 |
| ------- | -------------------------------- | -------- |
| `debug` | 详细调试信息、变量值、流程跟踪   | 通常关闭 |
| `info`  | 正常业务操作、状态变更、关键事件 | 开启     |
| `warn`  | 潜在问题、降级操作、即将达到限制 | 开启     |
| `error` | 错误事件、异常、需要关注的问题   | 开启     |

### 4. 结构化日志查询

使用结构化日志便于在日志系统中查询：

```bash
# 在 Elasticsearch/Kibana 中查询
module: "payment" AND operation: "process" AND errorCode: "PAYMENT_DECLINED"

# 在 Loki/Grafana 中查询
{service="order-service"} |= "PAYMENT_DECLINED"

# 按 traceId 追踪完整请求链路
traceId: "abc123def456"
```

---

## 文件结构

```
src/common/src/logging/
├── index.ts                    # 公共 API 导出
├── oes-logger.interface.ts     # 接口定义
├── pino-otel.logger.ts         # Pino + OpenTelemetry 实现
├── app-logger.service.ts       # NestJS 服务封装
├── console-logger.adapter.ts   # Console 接口适配器
├── logging.module.ts           # NestJS 模块
└── README.md                   # 本文档
```

---

## 更新日志

### v1.0.0 (2026-02-20)

- 初始版本
- 支持结构化日志和可变参数日志
- OpenTelemetry trace context 自动注入
- NestJS LoggerService 兼容
- ConsoleLoggerAdapter 用于第三方 SDK 集成
