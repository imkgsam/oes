import { Global, Module } from '@nestjs/common'
import { CqrsModule } from '@nestjs/cqrs'
import { ValidatingCommandBus } from './validating-command-bus'
import { ValidatingQueryBus } from './validating-query-bus'

@Global()
@Module({
  imports: [CqrsModule],
  providers: [ValidatingCommandBus, ValidatingQueryBus],
  exports: [ValidatingCommandBus, ValidatingQueryBus]
})
export class CqrsValidationModule {}
