# Auth Module

`common/src/auth` — 公共认证模块，为部分模块提供统一的 JWT 签发、验证与路由守卫能力。

## 目录结构

```
auth/
├── configs/
│   ├── authKey.config.ts   # RSA 密钥路径配置
│   └── token.config.ts     # Token 有效期 / issuer / audience 配置
├── decorators/
│   └── is-public.decorator.ts  # @Public() 装饰器，标记公开路由
├── guards/
│   └── gateway-jwt-auth.guard.ts  # API Gateway 层 JWT 认证守卫
├── jwt/
│   ├── jwt.module.ts       # CommonJwtModule，聚合配置与服务
│   ├── jwt.service.ts      # CommonJwtService，封装签发/验证/解码
│   ├── jwtOptions.factory.ts  # JwtOptionsFactory，读取 RSA 密钥并配置 RS256
│   └── token.type.ts       # Token payload 类型定义
└── keys/
    ├── private.key          # RSA 私钥（仅开发环境，生产应通过环境变量指定路径）
    └── public.key           # RSA 公钥
```

## 设计概要

| 关注点     | 方案                                                                          |
| ---------- | ----------------------------------------------------------------------------- |
| 签名算法   | **RS256**（非对称），公钥验签、私钥签发                                       |
| 配置管理   | `@nestjs/config` 的 `registerAs` 命名空间，支持环境变量覆盖                   |
| Token 类型 | Access Token + Refresh Token，有效期独立配置                                  |
| 守卫策略   | `GatewayJwtAuthGuard` 实现 `CanActivate`，结合 `@Public()` 装饰器跳过公开路由 |
| 模块化     | `CommonJwtModule` 封装所有依赖，外部只需 `imports` 即可使用                   |

### 核心流程

```
Request → GatewayJwtAuthGuard
            ├─ @Public() → 放行
            └─ Bearer token → CommonJwtService.verifyAsync()
                                ├─ 成功 → payload 注入 req.user
                                └─ 失败 → 抛出 SystemException
```

## 环境变量

| 变量名                       | 说明                       | 默认值              |
| ---------------------------- | -------------------------- | ------------------- |
| `AUTH_PUBLIC_KEY_PATH`       | 公钥文件相对路径           | `keys/public.key`   |
| `AUTH_PRIVATE_KEY_PATH`      | 私钥文件相对路径           | `keys/private.key`  |
| `ACCESS_TOKEN_VALIDITY_SEC`  | Access Token 有效期（秒）  | `0`（回退到 `15m`） |
| `REFRESH_TOKEN_VALIDITY_SEC` | Refresh Token 有效期（秒） | `0`（回退到 `7d`）  |
| `TOKEN_ISSUER`               | JWT `iss` 字段             | `''`                |
| `TOKEN_AUDIENCE`             | JWT `aud` 字段             | `''`                |

## 使用方式

### 1. 导入模块

```typescript
import { CommonJwtModule } from '@common/auth/jwt/jwt.module'

@Module({
  imports: [CommonJwtModule]
})
export class YourServiceModule {}
```

### 2. 签发 Token

```typescript
import { CommonJwtService } from '@common/auth/jwt/jwt.service'

@Injectable()
export class AuthService {
  constructor(private readonly jwt: CommonJwtService) {}

  issueTokens(userId: string) {
    const payload = { sub: userId, typ: AccountType.USER }
    return {
      accessToken: this.jwt.signAccessToken(payload),
      refreshToken: this.jwt.signRefreshToken(payload)
    }
  }
}
```

### 3. 启用路由守卫

在 Gateway 或需要鉴权的服务中全局注册守卫：

```typescript
import { GatewayJwtAuthGuard } from '@common/auth/guards/gateway-jwt-auth.guard'

@Module({
  providers: [{ provide: APP_GUARD, useClass: GatewayJwtAuthGuard }]
})
export class AppModule {}
```

### 4. 标记公开路由

```typescript
import { Public } from '@common/auth/decorators/is-public.decorator'

@Public()
@Get('health')
healthCheck() {
  return { status: 'ok' }
}
```

### 5. 获取当前用户

守卫验证通过后，payload 会被注入到 `req.user`：

```typescript
@Get('profile')
getProfile(@Req() req: Request) {
  const user = req['user'] as UserAccountContext
  // user.holderId, user.userId, user.tenantId ...
}
```

## 注意事项

- `keys/` 目录下的密钥仅供开发使用，**生产环境必须通过环境变量指定安全路径**。
- `jwtOptions.factory.ts` 中密钥路径基于 `__dirname` 拼接，部署时需确保编译产物与密钥文件的相对位置正确。
- Token payload 类型定义（`token.type.ts`）当前为草稿状态，按需扩展 `payloadBase` 接口。
