import { Module } from '@nestjs/common'
import { InMemoryPdaDeviceDiagnosticLogStore } from './infrastructure/in-memory-pda-device-diagnostic-log.store'

@Module({
  providers: [InMemoryPdaDeviceDiagnosticLogStore],
  exports: [InMemoryPdaDeviceDiagnosticLogStore]
})
// Shares the gateway-local PDA diagnostic log buffer without importing PDA HTTP controllers.
export class PdaDiagnosticsModule {}
