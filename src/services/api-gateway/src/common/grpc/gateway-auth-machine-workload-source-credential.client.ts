import { ClientGrpc, ClientProxyFactory, Transport } from '@nestjs/microservices'
import { Metadata } from '@grpc/grpc-js'
import { resolveCommonProtoPath } from '@oes/common/contracts'
import { MachineWorkloadSourceCredentialServiceClient } from '@oes/common/generated/auth_service'
import { createGrpcClientCredentials, safeGrpcCall } from '@oes/common/transport'

/** GatewayAuthMachineWorkloadSourceCredentialClient requests opaque MACHINE roots using configured selectors only. */
export class GatewayAuthMachineWorkloadSourceCredentialClient {
  private client?: ClientGrpc
  private service?: MachineWorkloadSourceCredentialServiceClient
  async issue(): Promise<string> {
    const principal = process.env.GATEWAY_MACHINE_PRINCIPAL_ID?.trim(); const binding = process.env.GATEWAY_MACHINE_WORKLOAD_BINDING_ID?.trim(); const version = process.env.GATEWAY_MACHINE_WORKLOAD_BINDING_VERSION?.trim()
    if (!principal || !binding || !version) throw new Error('MACHINE_WORKLOAD_SOURCE_CONFIGURATION_REQUIRED')
    const response = await safeGrpcCall(this.getService().issueMachineWorkloadSourceCredential({ machinePrincipalId: principal, machineWorkloadBindingId: binding, machineWorkloadBindingVersion: version }, new Metadata()), { caller: 'api-gateway', method: 'auth.issueMachineWorkloadSourceCredential' })
    if (!response.sourceCredential?.trim() || response.tokenType !== 'Bearer') throw new Error('MACHINE_SOURCE_CREDENTIAL_INVALID')
    return response.sourceCredential
  }
  private getService(): MachineWorkloadSourceCredentialServiceClient {
    if (!this.service) { this.client = ClientProxyFactory.create({ transport: Transport.GRPC, options: { package: 'auth_service', protoPath: resolveCommonProtoPath('auth_service/machine_workload_source_credential.proto'), url: `${process.env.AUTH_SERVICE_HOST ?? '127.0.0.1'}:${process.env.AUTH_SERVICE_PORT ?? '50050'}`, credentials: createGrpcClientCredentials() } }) as unknown as ClientGrpc; this.service = this.client.getService<MachineWorkloadSourceCredentialServiceClient>('MachineWorkloadSourceCredentialService') }
    return this.service
  }
}
