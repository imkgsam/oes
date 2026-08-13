import { Module } from '@nestjs/common'
import { ClientsModule, Transport } from '@nestjs/microservices'
import type { ClientProviderOptions } from '@nestjs/microservices/module/interfaces'
import { AuthorizationModule } from '@oes/common/authorization'
import { resolveCommonProtoPath } from '@oes/common/contracts'
import {
  NatsJetStreamModule,
  NatsJetStreamPublisher,
  NatsJetStreamRuntimeConfig
} from '@oes/common/events'
import { ACCOUNT_REFERENCE_PORT } from '../application/ports/account-reference.port'
import { TASK_COMMAND_TRANSACTION_PORT } from '../application/ports/task-command-transaction.port'
import { TASK_PERMISSION_PORT } from '../application/ports/task-permission.port'
import { TaskCommandService } from '../application/services/task-command.service'
import { TaskQueryService } from '../application/services/task-query.service'
import { TASK_REPOSITORY } from '../domain/repositories/task.repository'
import {
  IDENTITY_GRPC_CLIENT,
  IdentityAccountReferenceGrpcAdapter
} from '../infrastructure/adapters/identity-account-reference.grpc.adapter'
import {
  PERMISSION_GRPC_CLIENT,
  TaskPermissionGrpcAdapter
} from '../infrastructure/adapters/task-permission.grpc.adapter'
import { PrismaModule } from '../infrastructure/prisma/prisma.module'
import { PrismaTaskCommandTransaction } from '../infrastructure/prisma/prisma-task-command-transaction.repository'
import {
  COLLABORATION_PUBLIC_EVENT_PUBLISHER,
  COLLABORATION_TASK_OUTBOX_STORE,
  CollaborationTaskOutboxRelay
} from '../infrastructure/events/collaboration-task-outbox.relay'
import { PrismaCollaborationTaskOutboxStore } from '../infrastructure/events/prisma-collaboration-task-outbox.store'
import { PrismaTaskRepository } from '../infrastructure/repositories/prisma-task.repository'
import { TaskCommandGrpcController } from '../interfaces/grpc/task-command.grpc.controller'
import { TaskQueryGrpcController } from '../interfaces/grpc/task-query.grpc.controller'
import { CollaborationTrustedExecutionModule } from './collaboration-trusted-execution.module'

/** resolveDownstreamGrpcUrl resolves standard downstream URLs while preserving local development defaults. */
function resolveDownstreamGrpcUrl(
  standardEnvKey: string,
  legacyEnvKey: string,
  fallbackUrl: string
): string | undefined {
  const standardUrl = process.env[standardEnvKey]?.trim()
  if (standardUrl) return standardUrl
  const legacyUrl = process.env[legacyEnvKey]?.trim()
  if (legacyUrl) return legacyUrl
  return (process.env.NODE_ENV ?? 'development') !== 'production' ? fallbackUrl : undefined
}

/** buildCollaborationTaskGrpcClients declares downstream clients used by Task P1 precondition checks. */
export function buildCollaborationTaskGrpcClients(): ClientProviderOptions[] {
  return [
    {
      name: IDENTITY_GRPC_CLIENT,
      transport: Transport.GRPC,
      options: {
        package: 'identity_service',
        protoPath: [resolveCommonProtoPath('identity_service/identity_query.proto')],
        url: resolveDownstreamGrpcUrl('GRPC_SERVICE_IDENTITY_URL', 'IDENTITY_GRPC_URL', '127.0.0.1:50052')
      }
    },
    {
      name: PERMISSION_GRPC_CLIENT,
      transport: Transport.GRPC,
      options: {
        package: 'permission_service',
        protoPath: [resolveCommonProtoPath('permission_service/permission_access_summary.proto')],
        url: resolveDownstreamGrpcUrl('GRPC_SERVICE_PERMISSION_URL', 'PERMISSION_GRPC_URL', '127.0.0.1:50051')
      }
    }
  ]
}

/** CollaborationTaskModule wires Task commands and the owner-local relay to the shared ACL-scoped JetStream runtime. */
@Module({
  imports: [
    AuthorizationModule,
    CollaborationTrustedExecutionModule,
    PrismaModule,
    NatsJetStreamModule.forRoot(NatsJetStreamRuntimeConfig.fromEnvironment(process.env)),
    ClientsModule.register(buildCollaborationTaskGrpcClients())
  ],
  controllers: [TaskCommandGrpcController, TaskQueryGrpcController],
  providers: [
    TaskCommandService,
    TaskQueryService,
    {
      provide: TASK_REPOSITORY,
      useClass: PrismaTaskRepository
    },
    {
      provide: TASK_COMMAND_TRANSACTION_PORT,
      useClass: PrismaTaskCommandTransaction
    },
    {
      provide: COLLABORATION_TASK_OUTBOX_STORE,
      useClass: PrismaCollaborationTaskOutboxStore
    },
    {
      provide: COLLABORATION_PUBLIC_EVENT_PUBLISHER,
      useExisting: NatsJetStreamPublisher
    },
    CollaborationTaskOutboxRelay,
    {
      provide: ACCOUNT_REFERENCE_PORT,
      useClass: IdentityAccountReferenceGrpcAdapter
    },
    {
      provide: TASK_PERMISSION_PORT,
      useClass: TaskPermissionGrpcAdapter
    }
  ],
  exports: [TaskCommandService, TaskQueryService]
})
export class CollaborationTaskModule {}
