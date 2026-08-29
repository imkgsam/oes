import { Module } from '@nestjs/common'
import { PublicEntryTrustedExecutionGuard } from '../interfaces/grpc/public-entry-trusted-execution.guard'

/** Composes Public Entry's single token-only gRPC guard and exact target audience. */
@Module({
  providers: [PublicEntryTrustedExecutionGuard],
  exports: [PublicEntryTrustedExecutionGuard]
})
export class PublicEntryTrustedExecutionModule {}
