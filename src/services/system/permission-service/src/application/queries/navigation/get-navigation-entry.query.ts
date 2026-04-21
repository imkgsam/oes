import { IQuery } from '@nestjs/cqrs'
import { IsNotEmpty, IsString } from 'class-validator'

export class GetNavigationEntryQuery implements IQuery {
  @IsString()
  @IsNotEmpty()
  readonly entryKey: string

  constructor(entryKey: string) {
    this.entryKey = entryKey
  }
}
