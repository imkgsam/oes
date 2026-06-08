import { Inject, Injectable, OnModuleInit, Optional } from '@nestjs/common'
import { ClientGrpc } from '@nestjs/microservices'
import {
  GRPC_METADATA_PROPAGATION_FACTORY,
  GrpcMetadataPropagationFactory
} from '@oes/common/authorization'
import {
  CheckPermissionResponse,
  PERMISSION_CHECK_SERVICE_NAME,
  PermissionCheckServiceClient
} from '@oes/common/generated/permission_service'
import { safeGrpcCall } from '@oes/common/transport'
import { firstValueFrom, Observable } from 'rxjs'
import {
  BusinessCardAuthorizationPort,
  BusinessCardQueryScope
} from '../../application/ports/business-card.ports'
import {
  BusinessCardResourceFacts,
  OperatorContext
} from '../../domain/types/business-card.types'

export const PUBLIC_ENTRY_PERMISSION_GRPC_CLIENT = Symbol('PUBLIC_ENTRY_PERMISSION_GRPC_CLIENT')

type PermissionClientLike = {
  checkPermission(request: {
    accountId: string
    permissionCode: string
    tenantId?: string
  }, ...rest: unknown[]): Observable<CheckPermissionResponse>
}

// PermissionBusinessCardAuthorizationAdapter enforces Phase 1 tenant-wide admin scope through permission-service RBAC.
@Injectable()
export class PermissionBusinessCardAuthorizationAdapter
  implements BusinessCardAuthorizationPort, OnModuleInit
{
  private permissionClient!: PermissionClientLike

  constructor(
    @Inject(PUBLIC_ENTRY_PERMISSION_GRPC_CLIENT)
    private readonly client: ClientGrpc | PermissionClientLike,
    @Optional()
    @Inject(GRPC_METADATA_PROPAGATION_FACTORY)
    private readonly metadataFactory?: GrpcMetadataPropagationFactory
  ) {
    if (isPermissionClientLike(client)) {
      this.permissionClient = client
    }
  }

  onModuleInit(): void {
    if (!this.permissionClient && isClientGrpc(this.client)) {
      this.permissionClient = this.client.getService<PermissionCheckServiceClient>(
        PERMISSION_CHECK_SERVICE_NAME
      )
    }
  }

  async checkPermission(input: {
    tenantId: string
    permissionCode: string
    operatorContext: OperatorContext
  }): Promise<boolean> {
    return this.checkRbac(input)
  }

  async buildQueryScope(input: {
    tenantId: string
    permissionCode: string
    operatorContext: OperatorContext
  }): Promise<BusinessCardQueryScope> {
    const allowed = await this.checkRbac(input)
    if (!allowed) throw new Error('Permission denied')
    return { tenantId: input.tenantId }
  }

  async checkResource(input: {
    tenantId: string
    permissionCode: string
    resource: BusinessCardResourceFacts
    operatorContext: OperatorContext
  }): Promise<boolean> {
    if (input.resource.tenantId !== input.tenantId) return false
    return this.checkRbac(input)
  }

  private async checkRbac(input: {
    tenantId: string
    permissionCode: string
    operatorContext: OperatorContext
  }): Promise<boolean> {
    if (!this.permissionClient) return false
    try {
      const request = {
        tenantId: input.tenantId,
        accountId: input.operatorContext.operatorAccountId,
        permissionCode: input.permissionCode
      }
      const metadata = this.metadataFactory?.createInternalCallMetadata({
        callerServiceName: 'public-entry-service',
        traceId: input.operatorContext.traceId
      })
      const response = await safePermissionCall(
        metadata
          ? this.permissionClient.checkPermission(request, metadata)
          : this.permissionClient.checkPermission(request)
      )
      return Boolean(response.allowed)
    } catch {
      return false
    }
  }
}

// safePermissionCall wraps tests and runtime calls without exposing transport details to application code.
async function safePermissionCall(call: Observable<CheckPermissionResponse>) {
  try {
    return await safeGrpcCall<CheckPermissionResponse>(call, {
      caller: 'public-entry-service',
      method: 'PermissionCheckService.checkPermission'
    })
  } catch (error) {
    if ((error as Error).message === 'safeGrpcCall unavailable') {
      return firstValueFrom(call)
    }
    throw error
  }
}

// isPermissionClientLike detects direct fake/generated permission clients used by tests.
function isPermissionClientLike(value: unknown): value is PermissionClientLike {
  return Boolean(value && typeof (value as PermissionClientLike).checkPermission === 'function')
}

// isClientGrpc detects Nest gRPC clients for runtime service lookup.
function isClientGrpc(value: unknown): value is ClientGrpc {
  return Boolean(value && typeof (value as ClientGrpc).getService === 'function')
}
