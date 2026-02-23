# config 模块

基于 Nacos 的分布式配置中心封装，提供配置拉取、本地缓存、热更新及事件通知能力。

## 目录结构

| 文件                      | 职责                                                                                              |
| ------------------------- | ------------------------------------------------------------------------------------------------- |
| `config.interface.ts`     | 定义 `ConfigService` 接口（`get<T>(key)` / `getAll()`），便于替换实现                             |
| `config.events.ts`        | 定义 `ConfigChangedEvent`，配置变更时通过 `EventEmitter2` 广播                                    |
| `nacos.config.service.ts` | `NacosConfigService`——接口的 Nacos 实现：连接 Nacos、拉取并缓存配置、订阅变更、模块销毁时关闭连接 |
| `nacos.config.module.ts`  | `NacosConfigModule`——全局模块，注册 `EventEmitterModule` 与 `NacosConfigService`                  |

## 设计要点

1. **接口抽象**：业务层依赖 `ConfigService` 接口，不耦合 Nacos SDK，可按需替换为本地/Apollo 等实现。
2. **事件驱动**：配置变更时发布 `config.changed` 事件，下游模块通过 `@OnEvent('config.changed')` 响应，无需轮询。
3. **全局单例**：`@Global()` 装饰，导入一次即全局可用。

## 环境变量

| 变量                | 说明           |
| ------------------- | -------------- |
| `NACOS_SERVER_ADDR` | Nacos 服务地址 |
| `NACOS_NAMESPACE`   | 命名空间       |
| `NACOS_DATA_ID`     | 配置 Data ID   |
| `NACOS_GROUP`       | 配置分组       |

## 用法示例

### 1. 导入模块

```typescript
import { NacosConfigModule } from '@app/common/config/nacos.config.module'

@Module({
  imports: [NacosConfigModule]
})
export class AppModule {}
```

### 2. 注入并读取配置

```typescript
import { NacosConfigService } from '@app/common/config/nacos.config.service'

@Injectable()
export class SomeService {
  constructor(private readonly config: NacosConfigService) {}

  getDbHost(): string {
    return this.config.get<string>('db.host')
  }
}
```

### 3. 监听配置变更

```typescript
import { OnEvent } from '@nestjs/event-emitter'
import { ConfigChangedEvent } from '@app/common/config/config.events'

@Injectable()
export class SomeListener {
  @OnEvent('config.changed')
  handleConfigChanged(event: ConfigChangedEvent) {
    console.log('新配置:', event.newConfig)
  }
}
```
