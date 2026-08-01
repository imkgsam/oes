import { IQuery } from '@nestjs/cqrs'
import { IsNotEmpty, IsString } from 'class-validator'

/** Requests Auth's narrow trusted snapshot of a tenant machine's external-safe grants. */
export class ResolveExternalMachineAuthorizationSnapshotQuery implements IQuery {
  @IsString() @IsNotEmpty() readonly integrationMachineId: string
  @IsString() @IsNotEmpty() readonly tenantId: string
  constructor(integrationMachineId: string, tenantId: string) { this.integrationMachineId = integrationMachineId; this.tenantId = tenantId }
}
