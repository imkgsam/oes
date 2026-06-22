import { Module } from '@nestjs/common'
import { ClientsModule, Transport } from '@nestjs/microservices'
import type { ClientProviderOptions } from '@nestjs/microservices/module/interfaces'
import { AuthorizationModule } from '@oes/common/authorization'
import { resolveCommonProtoPath } from '@oes/common/contracts'
import { ANNOTATION_AUDIT_PORT } from '../application/ports/annotation-audit.port'
import { ANNOTATION_PERMISSION_PORT } from '../application/ports/annotation-permission.port'
import { OBJECT_REFERENCE_PORT } from '../application/ports/object-reference.port'
import { AnnotationCommandService } from '../application/services/annotation-command.service'
import { AnnotationQueryService } from '../application/services/annotation-query.service'
import { ANNOTATION_REPOSITORY } from '../domain/repositories/annotation.repository'
import {
  ANNOTATION_PERMISSION_GRPC_CLIENT,
  AnnotationPermissionGrpcAdapter
} from '../infrastructure/adapters/annotation-permission.grpc.adapter'
import {
  CRM_OBJECT_REFERENCE_GRPC_CLIENT,
  CrmObjectReferenceGrpcAdapter
} from '../infrastructure/adapters/crm-object-reference.grpc.adapter'
import { LocalAnnotationAuditRepository } from '../infrastructure/audit/local-annotation-audit.repository'
import { PrismaModule } from '../infrastructure/prisma/prisma.module'
import { PrismaAnnotationRepository } from '../infrastructure/repositories/prisma-annotation.repository'
import { AnnotationCommandGrpcController } from '../interfaces/grpc/annotation-command.grpc.controller'
import { AnnotationQueryGrpcController } from '../interfaces/grpc/annotation-query.grpc.controller'

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

/** buildCollaborationAnnotationGrpcClients declares downstream clients used by Annotation P1 checks. */
export function buildCollaborationAnnotationGrpcClients(): ClientProviderOptions[] {
  return [
    {
      name: CRM_OBJECT_REFERENCE_GRPC_CLIENT,
      transport: Transport.GRPC,
      options: {
        package: 'crm_service',
        protoPath: [resolveCommonProtoPath('crm_service/crm.proto')],
        url: resolveDownstreamGrpcUrl('GRPC_SERVICE_CRM_URL', 'CRM_GRPC_URL', '127.0.0.1:50060')
      }
    },
    {
      name: ANNOTATION_PERMISSION_GRPC_CLIENT,
      transport: Transport.GRPC,
      options: {
        package: 'permission_service',
        protoPath: [resolveCommonProtoPath('permission_service/permission_access_summary.proto')],
        url: resolveDownstreamGrpcUrl('GRPC_SERVICE_PERMISSION_URL', 'PERMISSION_GRPC_URL', '127.0.0.1:50051')
      }
    }
  ]
}

/** CollaborationAnnotationModule wires Annotation P1 command/query, persistence, audit, and gRPC surfaces. */
@Module({
  imports: [
    AuthorizationModule,
    PrismaModule,
    ClientsModule.register(buildCollaborationAnnotationGrpcClients())
  ],
  controllers: [AnnotationCommandGrpcController, AnnotationQueryGrpcController],
  providers: [
    AnnotationCommandService,
    AnnotationQueryService,
    {
      provide: ANNOTATION_REPOSITORY,
      useClass: PrismaAnnotationRepository
    },
    {
      provide: ANNOTATION_AUDIT_PORT,
      useClass: LocalAnnotationAuditRepository
    },
    {
      provide: OBJECT_REFERENCE_PORT,
      useClass: CrmObjectReferenceGrpcAdapter
    },
    {
      provide: ANNOTATION_PERMISSION_PORT,
      useClass: AnnotationPermissionGrpcAdapter
    }
  ],
  exports: [AnnotationCommandService, AnnotationQueryService]
})
export class CollaborationAnnotationModule {}
