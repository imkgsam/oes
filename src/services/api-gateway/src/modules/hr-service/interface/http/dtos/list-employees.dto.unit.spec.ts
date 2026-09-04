import { plainToInstance } from 'class-transformer'
import { validateSync } from 'class-validator'
import { ListEmployeesDto } from './list-employees.dto'

describe('list employees dto validation', () => {
  it('accepts string query pagination after HTTP query transformation', () => {
    const dto = plainToInstance(ListEmployeesDto, {
      lifecycleStatus: 'ACTIVE',
      page: '1',
      pageSize: '20'
    })

    const errors = validateSync(dto)

    expect(errors).toEqual([])
    expect(dto.page).toBe(1)
    expect(dto.pageSize).toBe(20)
  })
})
