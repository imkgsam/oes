# transport 模块

gRPC 客户端通信层，集成连接池、负载均衡与 Nacos 服务发现，提供声明式的跨服务调用能力。

## 目录结构

```
transport/
├── grpc/
│   ├── grpc.interfaces.ts          # 类型定义：GrpcServiceConfig、GrpcPoolConfig、GrpcModuleOptions
│   ├── grpc.constants.ts           # 注入 Token（GRPC_MODULE_OPTIONS）与 Token 生成函数
│   ├── grpc-transport.module.ts    # DynamicModule：forRoot() 全局注册 / forFeature() 按模块注入 / forRootAsync() 异步配置
│   ├── grpc-client.manager.ts      # GrpcClientManager：连接池编排、Nacos 订阅、周期健康检查
│   ├── grpc-connection-pool.ts     # GrpcConnectionPool：单服务连接池（min/max、空闲淘汰、故障摘除）
│   ├── grpc-client.decorator.ts    # @InjectGrpcClient() 参数装饰器
│   └── index.ts                    # grpc 子模块统一导出
├── loadbalancer/
│   ├── loadbalancer.interface.ts   # LoadBalancer / ServiceEndpoint 接口
│   ├── round-robin.strategy.ts     # 轮询策略
│   ├── weighted-round-robin.strategy.ts  # 加权平滑轮询策略（Nginx 算法）
│   └── index.ts                    # loadbalancer 子模块统一导出
└── index.ts                        # 顶层统一导出
```

## 核心设计

1. **DynamicModule 模式**：`forRoot()` 全局注册配置与 Manager；`forFeature()` 按需为功能模块创建服务级注入 Token。
2. **连接池**：每个服务独立池，支持 min/max 容量、空闲超时淘汰、连续失败摘除。
3. **负载均衡**：可插拔策略接口，内置 RoundRobin 和 WeightedRoundRobin（Nginx 平滑算法）。
4. **Nacos 集成**：自动订阅服务实例变更，动态刷新端点；也支持 `url` 静态地址回退（开发/测试用）。
5. **生命周期**：启动时订阅 + 建池，运行中周期健康检查，销毁时优雅 drain。

## 连接池默认参数

| 参数                    | 默认值 | 说明              |
| ----------------------- | ------ | ----------------- |
| `minSize`               | 1      | 最小连接数        |
| `maxSize`               | 10     | 最大连接数        |
| `idleTimeoutMs`         | 60000  | 空闲淘汰时间 (ms) |
| `acquireTimeoutMs`      | 5000   | 获取连接超时 (ms) |
| `healthCheckIntervalMs` | 15000  | 健康检查间隔 (ms) |

## 用法示例

### 1. 根模块注册

```typescript
import { GrpcTransportModule } from '@app/common/transport'

@Module({
  imports: [
    RegistryModule,
    GrpcTransportModule.forRoot({
      services: {
        'permission-service': {
          serviceName: 'permission-service',
          protoPath: 'protos/permission_check.proto',
          packageName: 'permission_service'
        }
      },
      defaultPoolConfig: { minSize: 2, maxSize: 10 }
    })
  ]
})
export class AppModule {}
```

### 2. 功能模块引入

```typescript
import { GrpcTransportModule } from '@app/common/transport'

@Module({
  imports: [GrpcTransportModule.forFeature(['permission-service'])]
})
export class PermissionModule {}
```

### 3. 装饰器注入调用

```typescript
import { InjectGrpcClient } from '@app/common/transport'
import { ClientGrpc } from '@nestjs/microservices'

@Injectable()
export class PermissionAdapter implements OnModuleInit {
  private svc: PermissionCheckService

  constructor(
    @InjectGrpcClient('permission-service')
    private readonly client: ClientGrpc
  ) {}

  onModuleInit() {
    this.svc = this.client.getService<PermissionCheckService>('PermissionCheckService')
  }

  check(userId: string, resource: string) {
    return firstValueFrom(this.svc.checkPermission({ userId, resource }))
  }
}
```

### 4. 通过 Manager 直接获取

```typescript
import { GrpcClientManager } from '@app/common/transport'

@Injectable()
export class SomeService {
  constructor(private readonly grpc: GrpcClientManager) {}

  async call() {
    const client = await this.grpc.getClient('permission-service')
    const svc = client.getService<PermissionCheckService>('PermissionCheckService')
    return firstValueFrom(svc.checkPermission({ userId: '1', resource: 'orders' }))
  }
}
```
