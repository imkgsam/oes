# Proto Contracts

本目录包含所有 gRPC 服务的 Protocol Buffer 定义文件。

## 目录结构

```
contracts/
├── buf.yaml              # Buf 模块配置（lint、breaking change 检测）
├── buf.gen.yaml          # 代码生成配置
├── README.md             # 本文档
├── auth_service/         # 认证服务
├── identity_service/     # 身份服务
├── party_service/        # 主体服务
├── permission_service/   # 权限服务
│   └── permission_check.proto
└── resource_service/     # 资源服务
```

## 快速开始

### 1. 安装 Buf CLI

```bash
# Windows (使用 scoop)
scoop install buf

# macOS
brew install bufbuild/buf/buf

# 或使用 npm
npm install -g @bufbuild/buf
```

### 2. 生成代码

```bash
# 在项目根目录执行
pnpm proto:gen
```

生成的 TypeScript 代码将输出到 `src/common/src/generated/` 目录。

### 3. 其他命令

```bash
# 检查 proto 文件格式
pnpm proto:lint

# 格式化 proto 文件
pnpm proto:format

# 检查 breaking changes（需要 git 历史）
pnpm proto:breaking
```

## Proto 文件规范

### 命名约定

1. **包名**: 使用 `<service>_service` 格式（snake_case）

   ```protobuf
   package permission_service;
   ```

2. **服务名**: 使用 PascalCase，以 `Service` 结尾

   ```protobuf
   service PermissionCheckService { ... }
   ```

3. **消息名**: 使用 PascalCase，请求以 `Request` 结尾，响应以 `Response` 结尾

   ```protobuf
   message CheckPermissionRequest { ... }
   message CheckPermissionResponse { ... }
   ```

4. **字段名**: 使用 snake_case

   ```protobuf
   string account_id = 1;
   ```

5. **枚举值**: 使用 SCREAMING_SNAKE_CASE，必须以类型名为前缀
   ```protobuf
   enum PermissionScopeType {
     PERMISSION_SCOPE_TYPE_UNSPECIFIED = 0;
     PERMISSION_SCOPE_TYPE_TENANT = 1;
   }
   ```

### 必要的选项

```protobuf
syntax = "proto3";

package <service>_service;

option java_multiple_files = true;
option java_package = "com.oes.<service>.v1";
```

### 注释规范

所有服务、方法、消息和字段都应添加注释：

```protobuf
// 权限检查服务
service PermissionCheckService {
  // 检查用户是否拥有指定权限
  rpc CheckPermission(CheckPermissionRequest) returns (CheckPermissionResponse);
}

// 权限检查请求
message CheckPermissionRequest {
  // 账户ID
  string account_id = 1;
}
```

## 使用生成的代码

### 导入方式

```typescript
// 导入生成的类型和接口
import {
  CheckPermissionRequest,
  CheckPermissionResponse,
  PermissionCheckServiceController,
  PermissionCheckServiceControllerMethods,
  PERMISSION_CHECK_SERVICE_NAME,
  PermissionScopeType
} from '@oes/common/generated/permission_service/permission_check'
```

### 实现 gRPC 服务端 (NestJS Controller)

```typescript
import { Controller } from '@nestjs/common'
import { GrpcMethod, Metadata } from '@nestjs/microservices'
import {
  CheckPermissionRequest,
  CheckPermissionResponse,
  PermissionCheckServiceController,
  PermissionCheckServiceControllerMethods,
  PERMISSION_CHECK_SERVICE_NAME
} from '@oes/common/generated/permission_service/permission_check'

@Controller()
@PermissionCheckServiceControllerMethods() // 自动应用 @GrpcMethod 装饰器
export class PermissionController implements PermissionCheckServiceController {
  async checkPermission(
    request: CheckPermissionRequest,
    metadata: Metadata
  ): Promise<CheckPermissionResponse> {
    // 实现权限检查逻辑
    return {
      pass: true,
      scopes: []
    }
  }

  async checkPermissionScope(
    request: CheckPermissionRequest,
    metadata: Metadata
  ): Promise<CheckPermissionResponse> {
    return {
      pass: true,
      scopes: [
        {
          type: PermissionScopeType.PERMISSION_SCOPE_TYPE_TENANT,
          value: 'tenant-123'
        }
      ]
    }
  }
}
```

### 配置 gRPC 微服务 (main.ts)

```typescript
import { NestFactory } from '@nestjs/core'
import { MicroserviceOptions, Transport } from '@nestjs/microservices'
import { join } from 'path'
import { AppModule } from './app.module'

async function bootstrap() {
  const app = await NestFactory.createMicroservice<MicroserviceOptions>(AppModule, {
    transport: Transport.GRPC,
    options: {
      package: 'permission_service',
      protoPath: join(
        __dirname,
        '../common/src/contracts/permission_service/permission_check.proto'
      ),
      url: '0.0.0.0:50051'
    }
  })
  await app.listen()
}
bootstrap()
```

### 创建 gRPC 客户端

```typescript
// permission-client.module.ts
import { Module } from '@nestjs/common'
import { ClientsModule, Transport } from '@nestjs/microservices'
import { join } from 'path'
import { PERMISSION_CHECK_SERVICE_NAME } from '@oes/common/generated/permission_service/permission_check'

@Module({
  imports: [
    ClientsModule.register([
      {
        name: PERMISSION_CHECK_SERVICE_NAME,
        transport: Transport.GRPC,
        options: {
          package: 'permission_service',
          protoPath: join(
            __dirname,
            '../../common/src/contracts/permission_service/permission_check.proto'
          ),
          url: 'localhost:50051'
        }
      }
    ])
  ],
  exports: [ClientsModule]
})
export class PermissionClientModule {}
```

### 使用 gRPC 客户端

```typescript
import { Injectable, Inject, OnModuleInit } from '@nestjs/common'
import { ClientGrpc } from '@nestjs/microservices'
import {
  PermissionCheckServiceClient,
  PERMISSION_CHECK_SERVICE_NAME,
  CheckPermissionRequest
} from '@oes/common/generated/permission_service/permission_check'
import { firstValueFrom } from 'rxjs'

@Injectable()
export class PermissionService implements OnModuleInit {
  private permissionClient: PermissionCheckServiceClient

  constructor(
    @Inject(PERMISSION_CHECK_SERVICE_NAME)
    private readonly client: ClientGrpc
  ) {}

  onModuleInit() {
    this.permissionClient = this.client.getService<PermissionCheckServiceClient>(
      PERMISSION_CHECK_SERVICE_NAME
    )
  }

  async checkPermission(accountId: string, permissionCode: string) {
    const request: CheckPermissionRequest = {
      accountId,
      permissionCode
    }
    return firstValueFrom(this.permissionClient.checkPermission(request))
  }
}
```

## 使用 Guard 和 Interceptor

NestJS 原生 gRPC 支持完整的 Guard、Interceptor 和 Decorator：

```typescript
import { Controller, UseGuards, UseInterceptors } from '@nestjs/common'
import { AuthGuard } from './guards/auth.guard'
import { LoggingInterceptor } from './interceptors/logging.interceptor'

@Controller()
@UseGuards(AuthGuard)
@UseInterceptors(LoggingInterceptor)
@PermissionCheckServiceControllerMethods()
export class PermissionController implements PermissionCheckServiceController {
  // ...
}
```

## 版本管理

- 使用语义化版本 (v1, v2, ...)
- 新版本应创建新的包（如 `permission_service_v2`）
- 旧版本保持向后兼容，直到正式废弃

## CI/CD 集成

建议在 CI 流程中添加以下检查：

```yaml
# .github/workflows/proto.yml
name: Proto Check

on: [push, pull_request]

jobs:
  proto:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: bufbuild/buf-setup-action@v1
      - name: Lint
        run: pnpm proto:lint
      - name: Breaking Changes
        run: pnpm proto:breaking
        if: github.event_name == 'pull_request'
```
