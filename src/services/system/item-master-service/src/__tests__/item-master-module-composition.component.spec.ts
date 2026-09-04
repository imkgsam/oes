import { Test, type TestingModule } from '@nestjs/testing'
import { Controller, UseGuards } from '@nestjs/common'
import { ExecutionTokenVerifier } from '@oes/common/authorization'
import { GrpcWorkloadIdentityProvider } from '@oes/common/transport'
import {
  ItemMasterTrustedExecutionGuard,
  ItemMasterTrustedExecutionModule,
  ItemMasterTrustedInternalExecutionGuard
} from '../modules/item-master-trusted-execution.module'

/** Minimal consumer that proves exported guards resolve through Nest's controller enhancer path. */
@Controller()
@UseGuards(ItemMasterTrustedExecutionGuard, ItemMasterTrustedInternalExecutionGuard)
class TrustedGuardConsumerController {}

/** Proves feature modules can resolve Item Master's exact audience-bound trusted guards at application startup. */
describe('Item Master trusted execution module composition', () => {
  let module: TestingModule

  afterEach(async () => {
    await module?.close()
  })

  it('exports the verifier, peer identity, audience, and both exact guard providers to importing controllers', async () => {
    module = await Test.createTestingModule({
      imports: [ItemMasterTrustedExecutionModule],
      controllers: [TrustedGuardConsumerController]
    }).compile()

    expect(module.get(ExecutionTokenVerifier)).toBeDefined()
    expect(module.get(GrpcWorkloadIdentityProvider)).toBeDefined()
    expect(module.get(String)).toBe('urn:oes:service:item-master-service')
    expect(module.get(ItemMasterTrustedExecutionGuard)).toBeInstanceOf(
      ItemMasterTrustedExecutionGuard
    )
    expect(module.get(ItemMasterTrustedInternalExecutionGuard)).toBeInstanceOf(
      ItemMasterTrustedInternalExecutionGuard
    )
  })
})
