import { Module } from '@nestjs/common'
import { LoggingModule } from '@oes/common/logging'
import { CollaborationAnnotationModule } from './modules/collaboration-annotation.module'
import { CollaborationTaskModule } from './modules/collaboration-task.module'
import { CollaborationTrustedExecutionModule } from './modules/collaboration-trusted-execution.module'

/** AppModule wires collaboration-service modules into the Nest runtime. */
@Module({
  imports: [
    LoggingModule.forRoot({ serviceName: 'collaboration-service' }),
    CollaborationAnnotationModule,
    CollaborationTaskModule,
    CollaborationTrustedExecutionModule
  ]
})
export class AppModule {}
