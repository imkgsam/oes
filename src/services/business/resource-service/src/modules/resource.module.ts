import { Module } from '@nestjs/common'
import { PrismaModule } from 'src/infrastructure/prisma/prisma.module'

// Application Services
import { DomainService } from 'src/application/services/domain.service'
import { DomainVerificationService } from 'src/application/services/domain-verification.service'

// Infrastructure Repositories
import { DomainRepositoryImpl } from 'src/infrastructure/repositories/domain.repository.impl'
import { DomainRecordRepositoryImpl } from 'src/infrastructure/repositories/domain-record.repository.impl'

// Infrastructure Adapters
import { DnsVerificationAdapter } from 'src/infrastructure/adapters/dns-verification.adapter'
import { EventBusAdapter } from 'src/infrastructure/adapters/event-bus.adapter'
import { ChallengeGeneratorAdapter } from 'src/infrastructure/adapters/challenge-generator.adapter'
import { IdentityServiceAdapter } from 'src/infrastructure/adapters/identity-service.adapter'
import { PermissionServiceAdapter } from 'src/infrastructure/adapters/permission-service.adapter'

// Interface Controllers
import { DomainManagementRpcController } from 'src/interface/rpc/domain-management.rpc.controller'
import { AdminManagementRpcController } from 'src/interface/rpc/admin-management.rpc.controller'
import { TestRpcController } from 'src/interface/rpc/test.controller'

// Domain Ports
import {
  IDomainRepository,
  IDomainRecordRepository
} from 'src/domain/repositories/domain.repository'
import { IDomainVerificationPort, IDomainEventPort } from 'src/domain/ports/domain.ports'
import { IDomainChallengeGeneratorPort } from 'src/domain/ports/domain-challenge-generator.port'

// Application Ports
import { IIdentityServicePort } from 'src/application/ports/identity-service.port'
import { IPermissionServicePort } from 'src/application/ports/permission-service.port'

/**
 * 资源服务模块
 *
 * 职责：
 * 1. 整合所有层的组件
 * 2. 配置依赖注入
 * 3. 提供统一的模块入口
 * 4. 管理服务间的依赖关系
 *
 * 架构层次：
 * - Interface层：RPC控制器
 * - Application层：业务服务
 * - Domain层：领域模型和端口
 * - Infrastructure层：仓储和适配器实现
 */
@Module({
  imports: [PrismaModule],
  providers: [
    // Application Services
    DomainService,
    DomainVerificationService,

    // Infrastructure Repositories
    {
      provide: 'IDomainRepository',
      useClass: DomainRepositoryImpl
    },
    {
      provide: 'IDomainRecordRepository',
      useClass: DomainRecordRepositoryImpl
    },

    // Infrastructure Adapters
    {
      provide: 'IDomainVerificationPort',
      useClass: DnsVerificationAdapter
    },
    {
      provide: 'IDomainEventPort',
      useClass: EventBusAdapter
    },
    {
      provide: 'IDomainChallengeGeneratorPort',
      useClass: ChallengeGeneratorAdapter
    },
    {
      provide: 'IIdentityServicePort',
      useClass: IdentityServiceAdapter
    },
    {
      provide: 'IPermissionServicePort',
      useClass: PermissionServiceAdapter
    }
  ],
  controllers: [DomainManagementRpcController, AdminManagementRpcController, TestRpcController],
  exports: [DomainService, DomainVerificationService]
})
export class ResourceModule {}
