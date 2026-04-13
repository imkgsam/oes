import { ACCESS_DENIED } from '@oes/common/exceptions'
import { CheckResourceService } from '../../src/application/authorization'

// Verifies tenant-bound resource checks allow in-tenant reads and reject cross-tenant reads.
describe('CheckResourceService', () => {
  it('应允许 tenant scope 读取同租户 account', () => {
    const service = new CheckResourceService()

    expect(() =>
      service.checkAccount(
        {
          operatorId: 'operator-0',
          tenantId: 'tenant-a',
          isSystemScope: false
        },
        {
          resourceId: 'account-1',
          tenantId: 'tenant-a'
        }
      )
    ).not.toThrow()
  })

  it('应允许 system scope 读取任意 service account', () => {
    const service = new CheckResourceService()

    expect(() =>
      service.checkServiceAccount(
        {
          operatorId: 'system-1',
          isSystemScope: true
        },
        {
          resourceId: 'service-account-1',
          tenantId: 'tenant-1'
        }
      )
    ).not.toThrow()
  })

  it('应拒绝 tenant scope 读取跨租户 api key', () => {
    const service = new CheckResourceService()

    expect(() =>
      service.checkApiKey(
        {
          operatorId: 'operator-1',
          tenantId: 'tenant-a',
          isSystemScope: false
        },
        {
          resourceId: 'api-key-1',
          tenantId: 'tenant-b'
        }
      )
    ).toThrow(
      expect.objectContaining({
        definition: expect.objectContaining({
          code: ACCESS_DENIED.code
        })
      })
    )
  })

  it('应拒绝 tenant scope 读取其他 tenant detail', () => {
    const service = new CheckResourceService()

    expect(() =>
      service.checkTenant(
        {
          operatorId: 'operator-2',
          tenantId: 'tenant-a',
          isSystemScope: false
        },
        {
          resourceId: 'tenant-b',
          tenantId: 'tenant-b'
        }
      )
    ).toThrow(
      expect.objectContaining({
        definition: expect.objectContaining({
          code: ACCESS_DENIED.code
        })
      })
    )
  })
})
