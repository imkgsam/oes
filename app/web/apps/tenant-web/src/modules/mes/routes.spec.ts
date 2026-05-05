import { describe, expect, it } from 'vitest'

import mesRoutes from './routes'

// Verifies the MES module exposes the mold-management workspace through one stable navigation entry.
describe('tenant MES routes', () => {
  it('binds mold management to the mes.mold-management entry without splitting Stitch screens into routes', () => {
    const mesRoute = mesRoutes.find((route) => route.name === 'TenantMes')
    const moldRoute = mesRoute?.children?.find((route) => route.name === 'TenantMesMoldManagement')

    expect(mesRoute?.path).toBe('/mes')
    expect(moldRoute?.path).toBe('/mes/mold-management')
    expect(moldRoute?.meta?.entryKey).toBe('mes.mold-management')
    expect(moldRoute?.meta?.fullPathKey).toBe(false)
    expect(moldRoute?.component).toBeTypeOf('function')
  })
})
