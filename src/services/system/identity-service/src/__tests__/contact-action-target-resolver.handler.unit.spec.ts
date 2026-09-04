import { ResolveContactActionTargetsHandler } from '../application/queries/contact/resolve-contact-action-targets.handler'
import { ResolveContactActionTargetsQuery } from '../application/queries/contact/resolve-contact-action-targets.query'
import { AccountContactAssetEntity } from '../domain/entities/account-contact-asset.entity'
import { AccountContactAssetRepository } from '../domain/repositories/account-contact-asset.repository'

describe('ResolveContactActionTargetsHandler', () => {
  const activePhone = new AccountContactAssetEntity(
    'asset-phone',
    'tenant-1',
    'account-1',
    'user-1',
    'employee-1',
    'WORK_PHONE',
    null,
    '+1 (312) 847-1928',
    'Desk phone',
    'COMPANY_CONTROLLED',
    ['BUSINESS_CARD', 'VCARD_CANDIDATE'],
    'ACTIVE',
    true,
    new Date('2026-06-08T02:20:00.000Z'),
    null
  )
  const disabledEmail = new AccountContactAssetEntity(
    'asset-email-disabled',
    'tenant-1',
    'account-1',
    'user-1',
    'employee-1',
    'WORK_EMAIL',
    null,
    'sales@example.com',
    'Sales email',
    'COMPANY_CONTROLLED',
    ['BUSINESS_CARD'],
    'DISABLED',
    false,
    new Date('2026-06-08T02:20:00.000Z'),
    null
  )
  const employeeOwnedWechat = new AccountContactAssetEntity(
    'asset-wechat',
    'tenant-1',
    'account-1',
    'user-1',
    'employee-1',
    'WECHAT',
    null,
    'wxid_mira_work',
    'Mira WeChat',
    'EMPLOYEE_OWNED',
    ['BUSINESS_CARD'],
    'ACTIVE',
    false,
    new Date('2026-06-08T02:20:00.000Z'),
    null
  )
  const otherAccountWhatsapp = new AccountContactAssetEntity(
    'asset-whatsapp-other',
    'tenant-1',
    'account-2',
    'user-2',
    'employee-2',
    'WHATSAPP',
    null,
    '+44 20 7946 0321',
    'Regional WhatsApp',
    'COMPANY_CONTROLLED',
    ['BUSINESS_CARD'],
    'ACTIVE',
    false,
    new Date('2026-06-08T02:20:00.000Z'),
    null
  )

  function createHandler(assets: AccountContactAssetEntity[]) {
    const repository = {
      listByIds: jest.fn(async (assetIds: string[]) =>
        assets.filter((asset) => assetIds.includes(asset.id))
      )
    } as unknown as AccountContactAssetRepository

    return {
      handler: new ResolveContactActionTargetsHandler(repository),
      repository
    }
  }

  it('resolves only active tenant/account/employee matching Contact Assets into public-safe values', async () => {
    const { handler, repository } = createHandler([
      activePhone,
      disabledEmail,
      employeeOwnedWechat,
      otherAccountWhatsapp
    ])

    const result = await handler.execute(
      new ResolveContactActionTargetsQuery({
        tenantId: 'tenant-1',
        accountId: 'account-1',
        employeeId: 'employee-1',
        targetRefs: [
          {
            contactActionType: 'CALL_PHONE',
            targetRefType: 'CONTACT_ASSET',
            targetRefId: 'asset-phone'
          },
          {
            contactActionType: 'SEND_EMAIL',
            targetRefType: 'CONTACT_ASSET',
            targetRefId: 'asset-email-disabled'
          },
          {
            contactActionType: 'ADD_WECHAT',
            targetRefType: 'CONTACT_ASSET',
            targetRefId: 'asset-wechat'
          },
          {
            contactActionType: 'OPEN_WHATSAPP',
            targetRefType: 'CONTACT_ASSET',
            targetRefId: 'asset-whatsapp-other'
          },
          {
            contactActionType: 'SAVE_VCARD',
            targetRefType: 'NONE',
            targetRefId: null
          }
        ]
      })
    )

    expect(repository.listByIds).toHaveBeenCalledWith([
      'asset-phone',
      'asset-email-disabled',
      'asset-wechat',
      'asset-whatsapp-other'
    ])
    expect(result.targets).toEqual([
      {
        contactActionType: 'CALL_PHONE',
        targetRefType: 'CONTACT_ASSET',
        targetRefId: 'asset-phone',
        renderable: true,
        hiddenReason: null,
        publicValueSummary: {
          type: 'WORK_PHONE',
          provider: null,
          label: 'Desk phone',
          displayValue: '+1 (312) 847-1928',
          actionValue: '+13128471928',
          actionUri: 'tel:+13128471928',
          includeInVCardAllowed: true
        }
      },
      {
        contactActionType: 'SEND_EMAIL',
        targetRefType: 'CONTACT_ASSET',
        targetRefId: 'asset-email-disabled',
        renderable: false,
        hiddenReason: 'CONTACT_ASSET_NOT_ACTIVE',
        publicValueSummary: null
      },
      {
        contactActionType: 'ADD_WECHAT',
        targetRefType: 'CONTACT_ASSET',
        targetRefId: 'asset-wechat',
        renderable: true,
        hiddenReason: null,
        publicValueSummary: {
          type: 'WECHAT',
          provider: null,
          label: 'Mira WeChat',
          displayValue: 'wxid_mira_work',
          actionValue: 'wxid_mira_work',
          actionUri: 'weixin://contacts/profile/wxid_mira_work',
          includeInVCardAllowed: false
        }
      },
      {
        contactActionType: 'OPEN_WHATSAPP',
        targetRefType: 'CONTACT_ASSET',
        targetRefId: 'asset-whatsapp-other',
        renderable: false,
        hiddenReason: 'CONTACT_ASSET_SCOPE_MISMATCH',
        publicValueSummary: null
      },
      {
        contactActionType: 'SAVE_VCARD',
        targetRefType: 'NONE',
        targetRefId: null,
        renderable: false,
        hiddenReason: 'TARGET_REF_TYPE_UNSUPPORTED',
        publicValueSummary: null
      }
    ])
  })
})
