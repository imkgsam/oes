# Registry Module

> Nacos-based service registration and discovery for OES microservices.

## Overview

The `registry/` module provides service registration and discovery via [Nacos](https://nacos.io/). It is used by the `transport/grpc` module to dynamically resolve service endpoints, enabling zero-configuration service-to-service communication.

### Architecture

```
registry/
├── registry.module.ts              # Global NestJS module
├── nacos-naming-client.provider.ts  # Shared NacosNamingClient (singleton)
├── nacos-discovery.service.ts       # Service discovery (subscribe + cache)
├── nacos-registry.service.ts        # Service registration (register + deregister)
├── interfaces/
│   ├── discovery.interface.ts       # ServiceDiscovery contract
│   └── registry.interface.ts        # ServiceRegistry contract
├── index.ts                         # Barrel exports
└── README.md                        # This file
```

### Key Design Decisions

1. **Shared NacosNamingClient**: A single `NacosNamingClient` connection is shared between discovery and registration, reducing resource usage and connection overhead.

2. **Interface-driven**: Both `ServiceDiscovery` and `ServiceRegistry` are defined as interfaces, making it easy to swap Nacos for another registry (Consul, etcd, etc.).

3. **Global Module**: `RegistryModule` is decorated with `@Global()`, so it only needs to be imported once in the root module.

4. **Graceful Degradation**: If `NACOS_SERVER` is not set, the module logs a warning and continues without Nacos. This allows local development without a Nacos instance.

## Quick Start

### 1. Import RegistryModule

Add `RegistryModule` to your root `AppModule`:

```typescript
import { Module } from '@nestjs/common'
import { RegistryModule } from '@oes/common/registry'

@Module({
  imports: [RegistryModule]
})
export class AppModule {}
```

### 2. Environment Variables

| Variable          | Required | Default     | Description                                           |
| ----------------- | -------- | ----------- | ----------------------------------------------------- |
| `NACOS_SERVER`    | Yes\*    | —           | Nacos server address (e.g., `localhost:8848`)         |
| `NACOS_NAMESPACE` | No       | `public`    | Nacos namespace for isolation                         |
| `MODULE_NAME`     | Yes\*    | —           | Service name to register (e.g., `permission-service`) |
| `SERVICE_IP`      | No       | Auto-detect | IP address to register                                |
| `SERVICE_PORT`    | Yes\*    | —           | Port number to register                               |

\* Required for Nacos integration. Without `NACOS_SERVER`, the module operates in degraded mode.

### 3. Service Registration (Automatic)

When `RegistryModule` is imported and the required environment variables are set, the service automatically:

- **Registers** itself with Nacos on startup (`onModuleInit`)
- **Deregisters** itself on shutdown (`onModuleDestroy`)

No additional code is needed.

### 4. Service Discovery

Use `NacosDiscoveryService` to discover other services:

```typescript
import { Injectable, OnModuleInit } from '@nestjs/common'
import { NacosDiscoveryService } from '@oes/common/registry'

@Injectable()
export class GatewayService implements OnModuleInit {
  constructor(private readonly discovery: NacosDiscoveryService) {}

  async onModuleInit() {
    // Subscribe to instance changes
    await this.discovery.subscribe('permission-service')
    await this.discovery.subscribe('auth-service')
  }

  getServiceUrl(serviceName: string): string {
    const instances = this.discovery.getInstances(serviceName)
    if (instances.length === 0) {
      throw new Error(`No instances available for ${serviceName}`)
    }
    // Simple selection (use transport/loadbalancer for production)
    const instance = instances[0]
    return `${instance.ip}:${instance.port}`
  }
}
```

## Integration with gRPC Transport

The `registry/` module is designed to work seamlessly with `transport/grpc`:

```typescript
import { Module } from '@nestjs/common'
import { RegistryModule } from '@oes/common/registry'
import { GrpcTransportModule } from '@oes/common/transport/grpc'

@Module({
  imports: [
    RegistryModule, // Provides NacosDiscoveryService
    GrpcTransportModule.forRoot({
      services: {
        'permission-service': {
          serviceName: 'permission-service',
          protoPath: 'protos/permission_check.proto',
          packageName: 'permission_service'
          // No 'url' → uses Nacos discovery automatically
        }
      }
    })
  ]
})
export class AppModule {}
```

When `GrpcClientManager` needs to resolve endpoints for a service:

1. It checks if a static `url` is configured → use it directly
2. Otherwise, it queries `NacosDiscoveryService.getInstances()` for live endpoints
3. The load balancer selects one endpoint from the list
4. A connection is acquired from the pool for that endpoint

## Local Development (Without Nacos)

For local development, you can bypass Nacos by:

1. **Not setting `NACOS_SERVER`**: The module will log a warning and skip initialization
2. **Using static URLs in gRPC config**:

```typescript
GrpcTransportModule.forRoot({
  services: {
    'permission-service': {
      serviceName: 'permission-service',
      protoPath: 'protos/permission_check.proto',
      packageName: 'permission_service',
      url: 'localhost:50051' // Static URL, no Nacos needed
    }
  }
})
```

## API Reference

### NacosDiscoveryService

| Method                                                 | Description                                 |
| ------------------------------------------------------ | ------------------------------------------- |
| `subscribe(serviceName: string): Promise<void>`        | Subscribe to instance changes for a service |
| `getInstances(serviceName: string): ServiceInstance[]` | Get cached healthy instances                |

### NacosRegistryService

| Method                        | Description                                            |
| ----------------------------- | ------------------------------------------------------ |
| `register(): Promise<void>`   | Register the current instance (called automatically)   |
| `deregister(): Promise<void>` | Deregister the current instance (called automatically) |

### ServiceInstance

```typescript
interface ServiceInstance {
  ip: string
  port: number
  metadata?: Record<string, string>
}
```

## Comparison with Old Registry

| Aspect               | Old (`registry/`)        | New (`registry/`)                           |
| -------------------- | ------------------------ | ------------------------------------------- |
| NacosNamingClient    | Two separate instances   | Single shared instance                      |
| Module encapsulation | No NestJS module         | `RegistryModule` with `@Global()`           |
| Error handling       | Throws on missing config | Graceful degradation with warnings          |
| IP detection         | Throws if no IPv4 found  | Falls back to `127.0.0.1`                   |
| gRPC pool            | Simple `Map` cache       | Removed (moved to `transport/grpc`)         |
| Load balancer        | Inline `RoundRobin`      | Removed (moved to `transport/loadbalancer`) |
