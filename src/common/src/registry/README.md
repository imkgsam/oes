# registry 模块

基于 Nacos 的服务注册与发现封装，提供实例注册、自动注销、服务订阅及健康实例缓存能力。通过 `CommonModule` 全局导出。

## 目录结构

| 文件                                | 职责                                                                               |
| ----------------------------------- | ---------------------------------------------------------------------------------- |
| `interfaces/discovery.interface.ts` | 定义 `ServiceDiscovery` 接口与 `ServiceInstance` 类型                              |
| `interfaces/registry.interface.ts`  | 定义 `ServiceRegistry` 接口（`register()` / `deregister()`）                       |
| `nacos-naming-client.provider.ts`   | `NacosNamingClientProvider`——共享的 Nacos 命名客户端，模块初始化时连接、销毁时关闭 |
| `nacos-discovery.service.ts`        | `NacosDiscoveryService`——订阅服务变更，本地缓存健康实例                            |
| `nacos-registry.service.ts`         | `NacosRegistryService`——模块启动时自动注册当前实例，销毁时自动注销                 |
| `registry.module.ts`                | `RegistryModule`——全局模块，组装上述 Provider 并导出 Discovery/Registry 服务       |
| `index.ts`                          | 统一导出入口                                                                       |

## 设计要点

1. **接口抽象**：业务层依赖 `ServiceDiscovery` / `ServiceRegistry` 接口，可替换为 Consul、etcd 等实现。
2. **共享连接**：`NacosNamingClientProvider` 维护单一 `NacosNamingClient`，Discovery 和 Registry 共用，减少资源开销。
3. **生命周期自动化**：注册/注销绑定 `OnModuleInit` / `OnModuleDestroy`，无需手动管理。
4. **优雅降级**：未配置 `NACOS_SERVER` 时仅打印警告，不阻塞启动。

## 环境变量

| 变量              | 说明                   | 默认值            |
| ----------------- | ---------------------- | ----------------- |
| `NACOS_SERVER`    | Nacos 服务地址（必填） | —                 |
| `NACOS_NAMESPACE` | 命名空间               | `public`          |
| `MODULE_NAME`     | 当前服务名（用于注册） | —                 |
| `SERVICE_IP`      | 注册 IP                | 自动获取本机 IPv4 |
| `SERVICE_PORT`    | 注册端口（必填）       | —                 |

## 用法示例

### 1. 导入模块

`RegistryModule` 已通过 `CommonModule` 全局导出，根模块导入 `CommonModule` 即可：

```typescript
import { CommonModule } from '@app/common'

@Module({
  imports: [CommonModule]
})
export class AppModule {}
```

### 2. 服务发现

```typescript
import { NacosDiscoveryService } from '@app/common/registry'

@Injectable()
export class GatewayService implements OnModuleInit {
  constructor(private readonly discovery: NacosDiscoveryService) {}

  async onModuleInit() {
    await this.discovery.subscribe('user-service')
  }

  getEndpoint(): string {
    const [inst] = this.discovery.getInstances('user-service')
    return inst ? `${inst.ip}:${inst.port}` : ''
  }
}
```

### 3. 服务注册

`NacosRegistryService` 在模块初始化时自动注册，无需手动调用。确保设置 `MODULE_NAME` 和 `SERVICE_PORT` 环境变量即可。
