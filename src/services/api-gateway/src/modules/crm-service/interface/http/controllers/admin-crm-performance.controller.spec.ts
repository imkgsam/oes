import { Reflector } from '@nestjs/core'
import {
  CRM_MANAGEMENT_PERMISSION_CODES,
  REQUIRE_PERMISSIONS_METADATA_KEY
} from '@oes/common/authorization'
import { AdminCrmPerformanceController } from './admin-crm-performance.controller'

describe('AdminCrmPerformanceController', () => {
  const service = {
    getOverview: jest.fn()
  }
  const controller = new AdminCrmPerformanceController(service as any)
  const source = { user: { aid: 'admin-1', tid: 'tenant-1' } }

  beforeEach(() => {
    jest.clearAllMocks()
  })

  it('guards the overview endpoint with CRM read permission', () => {
    const reflector = new Reflector()

    expect(
      reflector.get(REQUIRE_PERMISSIONS_METADATA_KEY, AdminCrmPerformanceController.prototype.getOverview)
    ).toEqual({ all: [CRM_MANAGEMENT_PERMISSION_CODES.READ_CRM_ACCOUNT] })
  })

  it('forwards query and downstream source to the admin performance service', async () => {
    service.getOverview.mockResolvedValue({ employees: [] })

    await expect(
      controller.getOverview(
        {
          employeeAccountId: 'sales-1',
          period: 'LAST_7_DAYS',
          sourceType: 'BROWSER_EXTENSION'
        },
        source as any
      )
    ).resolves.toEqual({ employees: [] })

    expect(service.getOverview).toHaveBeenCalledWith(
      {
        employeeAccountId: 'sales-1',
        period: 'LAST_7_DAYS',
        sourceType: 'BROWSER_EXTENSION'
      },
      source
    )
  })
})
