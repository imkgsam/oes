import { plainToInstance } from 'class-transformer'
import { validateSync } from 'class-validator'
import {
  ListTerminalDeviceEnrollmentsQueryDto,
  ListTerminalDevicesQueryDto,
  TerminalDeviceAuditEventsQueryDto
} from './terminal-device-admin.dto'

describe('terminal device admin query DTOs', () => {
  it('converts browser query pagination strings into numbers', () => {
    const deviceQuery = plainToInstance(ListTerminalDevicesQueryDto, {
      page: '1',
      pageSize: '20',
      terminalDeviceType: 'PDA'
    })
    const enrollmentQuery = plainToInstance(ListTerminalDeviceEnrollmentsQueryDto, {
      page: '1',
      pageSize: '20',
      terminalDeviceType: 'PDA'
    })
    const auditQuery = plainToInstance(TerminalDeviceAuditEventsQueryDto, {
      page: '1',
      pageSize: '20'
    })

    expect(validateSync(deviceQuery)).toEqual([])
    expect(validateSync(enrollmentQuery)).toEqual([])
    expect(validateSync(auditQuery)).toEqual([])
    expect(deviceQuery.page).toBe(1)
    expect(deviceQuery.pageSize).toBe(20)
    expect(enrollmentQuery.page).toBe(1)
    expect(enrollmentQuery.pageSize).toBe(20)
    expect(auditQuery.page).toBe(1)
    expect(auditQuery.pageSize).toBe(20)
  })
})
