import { Controller, Inject, UseGuards } from '@nestjs/common'
import { GrpcWorkloadIdentityProvider } from '@oes/common/transport'
import { ValidatingCommandBus } from '@oes/common/cqrs'
import { RequirePermissions, AUTH_MANAGEMENT_PERMISSION_CODES, InternalServiceGuard, AuthenticatedOperatorGuard, PermissionGuard, getAuthenticatedGrpcRequestContext } from '@oes/common/authorization'
import { MachineWorkloadSourceCredentialServiceController, MachineWorkloadSourceCredentialServiceControllerMethods, IssueMachineWorkloadSourceCredentialRequest, IssueMachineWorkloadSourceCredentialResponse, RevokeMachineWorkloadSourceCredentialRequest, RevokeMachineWorkloadSourceCredentialResponse } from '@oes/common/generated/auth_service'
import { IssueMachineWorkloadSourceCredentialCommand, RevokeMachineWorkloadSourceCredentialCommand } from '../../application/commands/auth'
import { MachineWorkloadSourceCredentialEntity } from '../../domain/entities/machine-workload-source-credential.entity'

/** Maps only frozen non-secret selectors to Auth application commands while deriving all certificate facts from the verified transport call. */
@Controller()
@MachineWorkloadSourceCredentialServiceControllerMethods()
export class MachineWorkloadSourceCredentialGrpcController implements MachineWorkloadSourceCredentialServiceController {
  constructor(private readonly commandBus: ValidatingCommandBus, @Inject(GrpcWorkloadIdentityProvider) private readonly workloadIdentityProvider: GrpcWorkloadIdentityProvider) {}

  /** Issues one short-lived source credential from the caller's verified mTLS leaf rather than request authority. */
  async issueMachineWorkloadSourceCredential(request: IssueMachineWorkloadSourceCredentialRequest, _metadata?: unknown, call?: unknown): Promise<IssueMachineWorkloadSourceCredentialResponse> {
    const workloadIdentity = await this.workloadIdentityProvider.getVerifiedWorkloadIssuanceIdentity(call)
    const result = await this.commandBus.execute(new IssueMachineWorkloadSourceCredentialCommand({ machinePrincipalId: request.machinePrincipalId!, bindingId: request.machineWorkloadBindingId!, bindingVersion: BigInt(request.machineWorkloadBindingVersion!), workloadIdentity }))
    const credential: MachineWorkloadSourceCredentialEntity = result.credential
    return { sourceCredential: result.sourceCredential, credentialId: credential.id, tokenType: 'Bearer', issuedAtUnixSeconds: Math.floor(credential.issuedAt.getTime() / 1_000).toString(), expiresAtUnixSeconds: Math.floor(credential.expiresAt.getTime() / 1_000).toString(), machinePrincipalId: credential.machinePrincipalId, machineWorkloadBindingId: credential.machineWorkloadBindingId, machineWorkloadBindingVersion: credential.machineWorkloadBindingVersion.toString(), auditCorrelationId: credential.auditId, supersedesCredentialId: result.supersedesCredentialId }
  }

  /** Revokes one credential through the normal protected management identity path. */
  @RequirePermissions({ all: [AUTH_MANAGEMENT_PERMISSION_CODES.REVOKE_MACHINE_WORKLOAD_SOURCE_CREDENTIAL] })
  @UseGuards(InternalServiceGuard, AuthenticatedOperatorGuard, PermissionGuard)
  async revokeMachineWorkloadSourceCredential(request: RevokeMachineWorkloadSourceCredentialRequest): Promise<RevokeMachineWorkloadSourceCredentialResponse> {
    if (!MACHINE_SOURCE_REVOCATION_REASONS.has(request.reasonCode ?? '')) throw new Error('EXECUTION_MACHINE_SOURCE_CREDENTIAL_INVALID')
    const operatorId = getAuthenticatedGrpcRequestContext(request)?.operatorContext?.operator_id
    if (!operatorId) throw new Error('operator context is required')
    const result = await this.commandBus.execute(new RevokeMachineWorkloadSourceCredentialCommand({ credentialId: request.credentialId!, reasonCode: request.reasonCode!, operatorId }))
    return { credentialId: result.credential.id, status: result.credential.status, revokedAtUnixSeconds: Math.floor(result.credential.revokedAt.getTime() / 1_000).toString(), alreadyRevoked: result.alreadyRevoked, auditCorrelationId: `machine-source-revoke:${result.credential.id}` }
  }
}

/** Restricts lifecycle revocation to the frozen non-enumerating management reason vocabulary. */
const MACHINE_SOURCE_REVOCATION_REASONS = new Set(['COMPROMISED', 'OPERATOR_REQUEST', 'BINDING_DISABLED'])
