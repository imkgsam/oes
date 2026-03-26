import { IQuery } from '@nestjs/cqrs'
import { IsUUID } from 'class-validator'

export class GetServiceAccountByIdQuery implements IQuery {
  @IsUUID()
  readonly serviceAccountId: string

  constructor(serviceAccountId: string) {
    this.serviceAccountId = serviceAccountId
  }
}
