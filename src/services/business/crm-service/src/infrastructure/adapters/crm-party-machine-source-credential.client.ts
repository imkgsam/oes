import { ClientGrpc, ClientProxyFactory, Transport } from '@nestjs/microservices'
import { Metadata } from '@grpc/grpc-js'
import { resolveCommonProtoPath } from '@oes/common/contracts'
import { MachineWorkloadSourceCredentialServiceClient } from '@oes/common/generated/auth_service'
import { createGrpcClientCredentials, safeGrpcCall } from '@oes/common/transport'

export class CrmPartyMachineSourceCredentialClient {
  private client?: ClientGrpc
  private service?: MachineWorkloadSourceCredentialServiceClient

  async issue(): Promise<string> {
    const machinePrincipalId = required('CRM_PARTY_MACHINE_PRINCIPAL_ID')
    const machineWorkloadBindingId = required('CRM_PARTY_MACHINE_WORKLOAD_BINDING_ID')
    const machineWorkloadBindingVersion = required('CRM_PARTY_MACHINE_WORKLOAD_BINDING_VERSION')
    const result = await safeGrpcCall(
      this.getService().issueMachineWorkloadSourceCredential(
        { machinePrincipalId, machineWorkloadBindingId, machineWorkloadBindingVersion },
        new Metadata()
      ),
      { caller: 'crm-service', method: 'IssueMachineWorkloadSourceCredential' }
    )
    if (result.tokenType !== 'Bearer' || !result.sourceCredential?.trim()) {
      throw new Error('PARTY_CALLER_SOURCE_CREDENTIAL_INVALID')
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
    this.service ??= this.client.getService<MachineWorkloadSourceCredentialServiceClient>(
      'MachineWorkloadSourceCredentialService'
    )
    return this.service
  }
}

function required(name: string): string {
  const value = process.env[name]?.trim()
  if (!value) throw new Error('PARTY_CALLER_FOUNDATION_UNAVAILABLE')
  return value
}

function authUrl(): string {
  return `${process.env.AUTH_SERVICE_HOST?.trim() || '127.0.0.1'}:${process.env.AUTH_SERVICE_PORT?.trim() || '50050'}`
}
