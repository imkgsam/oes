import { randomUUID } from 'node:crypto'
import { Inject, Injectable } from '@nestjs/common'
import { CommandHandler, ICommandHandler } from '@nestjs/cqrs'
import { ExceptionFactory } from '@oes/common/exceptions'
import { TOKENS } from '../../common/constants/tokens'
import { SALES_NOT_FOUND } from '../../common/errors/sales.errors'
import {
  CustomerPriceAgreementLineDraftInput,
  CustomerPriceAgreementVersionRecord
} from '../../domain/models/pricing-records'
import { CustomerPriceAgreementRepository } from '../../domain/repositories/customer-price-agreement.repository'
import {
  buildAgreementLineRecords,
  normalizeBrandKey
} from '../support/pricing-support'
import { assertRequiredString } from '../support/sales-assertions'
import { UpdateCustomerPriceAgreementDraftCommand } from './update-customer-price-agreement-draft.command'

/** UpdateCustomerPriceAgreementDraftHandler mutates the current draft or forks the next draft from active before applying changes. */
@Injectable()
@CommandHandler(UpdateCustomerPriceAgreementDraftCommand)
export class UpdateCustomerPriceAgreementDraftHandler
  implements ICommandHandler<UpdateCustomerPriceAgreementDraftCommand, CustomerPriceAgreementVersionRecord>
{
  constructor(
    @Inject(TOKENS.CUSTOMER_PRICE_AGREEMENT_REPOSITORY)
    private readonly repository: CustomerPriceAgreementRepository
  ) {}

  async execute(
    command: UpdateCustomerPriceAgreementDraftCommand
  ): Promise<CustomerPriceAgreementVersionRecord> {
    assertRequiredString(command.input.tenantId, 'tenantId')
    assertRequiredString(command.input.customerPriceAgreementId, 'customerPriceAgreementId')

    const head = await this.repository.findHeadVersion(
      command.input.tenantId,
      command.input.customerPriceAgreementId
    )
    if (!head) {
      throw ExceptionFactory.domain(SALES_NOT_FOUND, {
        customerPriceAgreementId: command.input.customerPriceAgreementId
      })
    }

    const baseVersion =
      head.status === 'DRAFT'
        ? head
        : {
            ...head,
            id: randomUUID(),
            versionNo: head.versionNo + 1,
            status: 'DRAFT' as const,
            publishedAt: null
          }

    const mutated = applyMutation(baseVersion, command.input.draftMutation.upserts, command.input.draftMutation.removals)
    return this.repository.saveVersion(mutated)
  }
}

function applyMutation(
  baseVersion: CustomerPriceAgreementVersionRecord,
  upserts: CustomerPriceAgreementLineDraftInput[],
  removals: Array<{ itemId: string; brandKey?: string | null }>
): CustomerPriceAgreementVersionRecord {
  const retained = baseVersion.lines.filter(
    (line) =>
      !removals.some(
        (removal) =>
          removal.itemId === line.itemId &&
          normalizeBrandKey(removal.brandKey) === normalizeBrandKey(line.brandKey)
      )
  )

  const upsertMap = new Map(
    upserts.map((line) => [`${line.itemId}::${normalizeBrandKey(line.brandKey)}`, line] as const)
  )
  const baseWithoutUpserts = retained.filter(
    (line) => !upsertMap.has(`${line.itemId}::${normalizeBrandKey(line.brandKey)}`)
  )
  const mergedDraftInputs: CustomerPriceAgreementLineDraftInput[] = [
    ...baseWithoutUpserts.map((line) => ({
      itemId: line.itemId,
      brandKey: line.brandKey,
      unitPriceAmount: line.priceSnapshot.unitPriceAmount,
      moqQuantity: line.moqSnapshot.moqQuantity,
      quantityUomCode: line.moqSnapshot.quantityUomCode
    })),
    ...upserts
  ]

  return {
    ...baseVersion,
    lines: buildAgreementLineRecords({
      customerPriceAgreementId: baseVersion.customerPriceAgreementId,
      currencyCode: baseVersion.currencyCode,
      versionNo: baseVersion.versionNo,
      lines: mergedDraftInputs
    })
  }
}
