import { Module } from '@nestjs/common'
import { LoggingModule } from '@oes/common/logging'
import { CollaborationTaskModule } from './modules/collaboration-task.module'

/** AppModule wires collaboration-service modules into the Nest runtime. */
@Module({
  imports: [
    LoggingModule.forRoot({ serviceName: 'collaboration-service' }),
    CollaborationTaskModule
  ]
})
export class AppModule {}
