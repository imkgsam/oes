import { IsNotEmpty, IsOptional, IsString } from 'class-validator'

export class ListSessionsQuery {
  @IsString()
  @IsNotEmpty()
  readonly userId: string

  @IsOptional()
  @IsString()
  readonly currentSessionId?: string

  constructor(userId: string, currentSessionId?: string) {
    this.userId = userId
    this.currentSessionId = currentSessionId || undefined
  }
}
