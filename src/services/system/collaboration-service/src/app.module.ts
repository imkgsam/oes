import { Module } from '@nestjs/common'
import { LoggingModule } from '@oes/common/logging'
import { CollaborationAnnotationModule } from './modules/collaboration-annotation.module'
import { CollaborationTaskModule } from './modules/collaboration-task.module'

/** AppModule wires collaboration-service modules into the Nest runtime. */
@Module({
  imports: [
    LoggingModule.forRoot({ serviceName: 'collaboration-service' }),
    CollaborationAnnotationModule,
    CollaborationTaskModule
  ]
})
export class AppModule {}
