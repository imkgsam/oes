import { Module } from '@nestjs/common'
import { SERVICE_NAMES } from '@oes/common/constants'
import { GrpcTransportModule } from '@oes/common/transport'
import { IdentityQueryGrpcAdapter } from '../auth-bff/infrastructure/downstream/identity-service/identity-query-grpc.adapter'
import { TaskCommandGrpcAdapter } from './adapters/task-command-grpc.adapter'
import { TaskQueryGrpcAdapter } from './adapters/task-query-grpc.adapter'
import { TaskBffService } from './application/task-bff.service'
import { TaskController } from './interface/http/controllers/task.controller'

/** CollaborationServiceProxyModule wires Task P1 BFF routes to collaboration-service gRPC. */
@Module({
  imports: [GrpcTransportModule.forFeature([SERVICE_NAMES.COLLABORATION, SERVICE_NAMES.IDENTITY])],
  controllers: [TaskController],
  providers: [TaskCommandGrpcAdapter, TaskQueryGrpcAdapter, IdentityQueryGrpcAdapter, TaskBffService]
})
export class CollaborationServiceProxyModule {}
