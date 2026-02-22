# Transport Module

> Inter-service communication layer for OES microservices.

## Overview

The `transport/` module provides a unified, production-ready abstraction for inter-service communication. It currently supports **gRPC** for synchronous RPC calls between internal services, with a pluggable architecture for future event-driven transports (Kafka, RabbitMQ).

### Architecture

```
transport/
├── grpc/                          # gRPC inter-service communication
│   ├── grpc-transport.module.ts   # NestJS DynamicModule (forRoot / forFeature)
│   ├── grpc-client.manager.ts     # Connection pool orchestrator
│   ├── grpc-connection-pool.ts    # Per-service connection pool
│   ├── grpc-client.decorator.ts   # @InjectGrpcClient() decorator
│   ├── grpc.interfaces.ts         # Type definitions & config interfaces
│   ├── grpc.constants.ts          # DI tokens
│   └── index.ts                   # Barrel exports
│
├── loadbalancer/                  # Load balancing strategies
│   ├── loadbalancer.interface.ts  # LoadBalancer contract
│   ├── round-robin.strategy.ts    # Simple round-robin
│   ├── weighted-round-robin.strategy.ts  # Weighted (Nginx-style)
│   └── index.ts
│
└── index.ts                       # Top-level barrel export
```

## Quick Start

### 1. Root Module Setup

Register `GrpcTransportModule.forRoot()` in your root `AppModule` with all service configurations:

```typescript
import { Module } from '@nestjs/common'
import { RegistryModule } from '@oes/common/registry'
import { GrpcTransportModule } from '@oes/common/transport/grpc'

@Module({
  imports: [
    // Nacos service discovery (required for dynamic endpoint resolution)
    RegistryModule,

    // gRPC transport with service definitions
    GrpcTransportModule.forRoot({
      services: {
        'permission-service': {
          serviceName: 'permission-service',
          protoPath: 'protos/permission_check.proto',
          packageName: 'permission_service'
        },
        'auth-service': {
          serviceName: 'auth-service',
          protoPath: 'protos/auth.proto',
          packageName: 'auth_service',
          // Static URL for development (bypasses Nacos discovery)
          url: 'localhost:50051'
        },
        'identity-service': {
          serviceName: 'identity-service',
          protoPath: 'protos/identity.proto',
          packageName: 'identity_service',
          // Custom pool config
          pool: {
            minSize: 2,
            maxSize: 5,
            idleTimeoutMs: 30000
          }
        }
      },
      // Default pool config for all services
      defaultPoolConfig: {
        minSize: 1,
        maxSize: 10,
        idleTimeoutMs: 60000,
        acquireTimeoutMs: 5000,
        healthCheckIntervalMs: 15000
      }
    })
  ]
})
export class AppModule {}
```

### 2. Feature Module Setup

In feature modules, use `GrpcTransportModule.forFeature()` to register the specific service clients you need:

```typescript
import { Module } from '@nestjs/common'
import { GrpcTransportModule } from '@oes/common/transport/grpc'
import { PermissionAdapter } from './permission.adapter'

@Module({
  imports: [GrpcTransportModule.forFeature(['permission-service'])],
  providers: [PermissionAdapter],
  exports: [PermissionAdapter]
})
export class PermissionModule {}
```

### 3. Injecting gRPC Clients

Use the `@InjectGrpcClient()` decorator to inject a `ClientGrpc` instance:

```typescript
import { Injectable, OnModuleInit } from '@nestjs/common'
import { ClientGrpc } from '@nestjs/microservices'
import { firstValueFrom } from 'rxjs'
import { InjectGrpcClient } from '@oes/common/transport/grpc'

// Generated from .proto file
interface PermissionCheckService {
  checkPermission(data: {
    accountId: string
    permissionCode: string
  }): Observable<{ pass: boolean }>
}

@Injectable()
export class PermissionAdapter implements OnModuleInit {
  private permissionSvc: PermissionCheckService

  constructor(
    @InjectGrpcClient('permission-service')
    private readonly client: ClientGrpc
  ) {}

  onModuleInit() {
    this.permissionSvc = this.client.getService<PermissionCheckService>('PermissionCheckService')
  }

  async checkPermission(accountId: string, permissionCode: string): Promise<boolean> {
    const response = await firstValueFrom(
      this.permissionSvc.checkPermission({ accountId, permissionCode })
    )
    return response.pass
  }
}
```

### 4. Async Configuration (from Nacos Config)

If your service configurations come from Nacos Config or another dynamic source:

```typescript
import { GrpcTransportModule } from '@oes/common/transport/grpc'
import { NacosConfigService } from '@oes/common/config/nacos.config.service'

GrpcTransportModule.forRootAsync({
  imports: [NacosConfigModule],
  useFactory: (nacosConfig: NacosConfigService) => {
    const grpcConfig = nacosConfig.get<GrpcModuleOptions>('grpc')
    return grpcConfig
  },
  inject: [NacosConfigService]
})
```

## Connection Pool

Each service gets its own connection pool managed by `GrpcClientManager`.

### Pool Configuration

| Option                  | Default | Description                                |
| ----------------------- | ------- | ------------------------------------------ |
| `minSize`               | `1`     | Minimum connections to maintain            |
| `maxSize`               | `10`    | Maximum connections allowed                |
| `idleTimeoutMs`         | `60000` | Idle connection eviction timeout (ms)      |
| `acquireTimeoutMs`      | `5000`  | Max wait time to acquire a connection (ms) |
| `healthCheckIntervalMs` | `15000` | Health check sweep interval (ms)           |

### Pool Behavior

1. **Acquire**: Load balancer selects an endpoint → reuse existing healthy connection or create new
2. **Health Check**: Periodic sweep removes unhealthy connections (3 consecutive failures)
3. **Idle Eviction**: Connections idle beyond `idleTimeoutMs` are removed (respects `minSize`)
4. **Instance Refresh**: When Nacos reports instance changes, stale connections are removed
5. **Graceful Shutdown**: All pools are drained on application shutdown

## Load Balancing

Two strategies are available:

### Round-Robin (Default)

Cycles through healthy endpoints sequentially. Simple and effective for homogeneous instances.

### Weighted Round-Robin

Distributes traffic proportionally based on endpoint weights. Uses the Nginx smooth weighted round-robin algorithm to avoid burst traffic.

```typescript
// Endpoints with different weights
const endpoints = [
  { ip: '10.0.0.1', port: 50051, weight: 3, healthy: true }, // 3x traffic
  { ip: '10.0.0.2', port: 50051, weight: 1, healthy: true } // 1x traffic
]
```

## gRPC Channel Options

You can configure gRPC channel options globally or per-service:

```typescript
GrpcTransportModule.forRoot({
  services: { ... },
  defaultChannelOptions: {
    'grpc.keepalive_time_ms': 10000,
    'grpc.keepalive_timeout_ms': 5000,
    'grpc.keepalive_permit_without_calls': 1,
    'grpc.max_receive_message_length': 4 * 1024 * 1024,  // 4MB
    'grpc.max_send_message_length': 4 * 1024 * 1024,
  },
})
```

## Monitoring

Access pool statistics via `GrpcClientManager.getPoolStats()`:

```typescript
@Injectable()
export class HealthService {
  constructor(private readonly grpcManager: GrpcClientManager) {}

  getGrpcPoolStats() {
    return this.grpcManager.getPoolStats()
    // Returns:
    // {
    //   'permission-service': {
    //     serviceName: 'permission-service',
    //     totalConnections: 3,
    //     healthyConnections: 3,
    //     maxSize: 10,
    //     minSize: 1,
    //   },
    //   ...
    // }
  }
}
```

## Migration from `clients/` Module

If you're migrating from the old `ClientModule` (TCP-based):

| Before (TCP)                                          | After (gRPC)                                             |
| ----------------------------------------------------- | -------------------------------------------------------- |
| `ClientModule.register([ServiceKeys.PERMISSION_TCP])` | `GrpcTransportModule.forFeature(['permission-service'])` |
| `@InjectServiceClient(ServiceKeys.PERMISSION_TCP)`    | `@InjectGrpcClient('permission-service')`                |
| `client.send('pattern', payload)`                     | `svc.rpcMethod(payload)` via `client.getService()`       |
| Hardcoded `service-map.ts`                            | Dynamic Nacos discovery or static URL config             |
| Global `Map` connection cache                         | IoC-managed connection pool with health checks           |
