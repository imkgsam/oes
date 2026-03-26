import { IsOptional, IsString, IsUUID } from 'class-validator'

export class ListSessionsQuery {
  @IsString()
  @IsUUID()
  readonly userId: string

  @IsOptional()
  @IsString()
  @IsUUID()
  readonly currentSessionId?: string

  constructor(userId: string, currentSessionId?: string) {
    this.userId = userId
    this.currentSessionId = currentSessionId || undefined
  }
}
