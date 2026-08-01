import { IQuery } from '@nestjs/cqrs'
import { IsNotEmpty, IsString } from 'class-validator'

/** Requests the narrow Auth-only resolution of an Integration Machine's owner facts. */
export class ResolveIntegrationMachineForAuthQuery implements IQuery {
  @IsString()
  @IsNotEmpty()
  readonly integrationMachineId: string

  constructor(integrationMachineId: string) {
    this.integrationMachineId = integrationMachineId
  }
}
