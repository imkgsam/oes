import { Metadata } from '@grpc/grpc-js'
import { ClientGrpc, ClientProxyFactory, Transport } from '@nestjs/microservices'
import { resolveCommonProtoPath } from '@oes/common/contracts'
import { MachineWorkloadSourceCredentialServiceClient } from '@oes/common/generated/auth_service'
import { createGrpcClientCredentials, safeGrpcCall } from '@oes/common/transport'

/** Obtains MES's deployment-owned MACHINE source credential from Auth. */
export class MesItemMasterMachineSourceCredentialClient {
  private client?: ClientGrpc
  private service?: MachineWorkloadSourceCredentialServiceClient

  async issue(): Promise<string> {
    const result = await safeGrpcCall(
      this.getService().issueMachineWorkloadSourceCredential(
        {
          machinePrincipalId: required('MES_ITEM_MASTER_MACHINE_PRINCIPAL_ID'),
          machineWorkloadBindingId: required('MES_ITEM_MASTER_MACHINE_WORKLOAD_BINDING_ID'),
          machineWorkloadBindingVersion: required(
            'MES_ITEM_MASTER_MACHINE_WORKLOAD_BINDING_VERSION'
          )
        },
        new Metadata()
      ),
      { caller: 'mes-service', method: 'IssueMachineWorkloadSourceCredential' }
    )
    if (result.tokenType !== 'Bearer' || !result.sourceCredential?.trim()) {
      throw new Error('ITEM_MASTER_CALLER_SOURCE_CREDENTIAL_INVALID')
    }
    return result.sourceCredential
  }

  private getService(): MachineWorkloadSourceCredentialServiceClient {
    this.client ??= ClientProxyFactory.create({
      transport: Transport.GRPC,
      options: {
        package: 'auth_service',
        protoPath: resolveCommonProtoPath('auth_service/machine_workload_source_credential.proto'),
        url: authUrl(),
        credentials: createGrpcClientCredentials()
      }
    }) as unknown as ClientGrpc
    return (this.service ??= this.client.getService<MachineWorkloadSourceCredentialServiceClient>(
      'MachineWorkloadSourceCredentialService'
    ))
  }
}

/** Requires exact deployment facts without manufacturing caller authority. */
function required(name: string): string {
  const value = process.env[name]?.trim()
  if (!value) throw new Error('ITEM_MASTER_CALLER_FOUNDATION_UNAVAILABLE')
  return value
}

/** Resolves the Auth mTLS endpoint for MES credential and token exchange calls. */
function authUrl(): string {
  return `${process.env.AUTH_SERVICE_HOST?.trim() || '127.0.0.1'}:${process.env.AUTH_SERVICE_PORT?.trim() || '50050'}`
}
