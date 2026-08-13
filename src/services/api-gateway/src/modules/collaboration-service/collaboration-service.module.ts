import { Module } from '@nestjs/common'
import { SERVICE_NAMES } from '@oes/common/constants'
import { GrpcTransportModule } from '@oes/common/transport'
import { GatewayCollaborationGrpcClient, GatewayTrustedGrpcExecutionProducer } from '../../common/grpc'
import { IdentityQueryGrpcAdapter } from '../auth-bff/infrastructure/downstream/identity-service/identity-query-grpc.adapter'
import { AnnotationCommandGrpcAdapter } from './adapters/annotation-command-grpc.adapter'
import { AnnotationQueryGrpcAdapter } from './adapters/annotation-query-grpc.adapter'
import { TaskCommandGrpcAdapter } from './adapters/task-command-grpc.adapter'
import { TaskQueryGrpcAdapter } from './adapters/task-query-grpc.adapter'
import { AnnotationBffService } from './application/annotation-bff.service'
import { TaskBffService } from './application/task-bff.service'
import { AnnotationController } from './interface/http/controllers/annotation.controller'
import { TaskController } from './interface/http/controllers/task.controller'

/** CollaborationServiceProxyModule wires Collaboration BFF routes to collaboration-service gRPC. */
@Module({
  imports: [GrpcTransportModule.forFeature([SERVICE_NAMES.IDENTITY])],
  controllers: [TaskController, AnnotationController],
  providers: [
    TaskCommandGrpcAdapter,
    TaskQueryGrpcAdapter,
    AnnotationCommandGrpcAdapter,
    AnnotationQueryGrpcAdapter,
    IdentityQueryGrpcAdapter,
    TaskBffService,
    AnnotationBffService
  ]
})
export class CollaborationServiceProxyModule {}
