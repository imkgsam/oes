import { describe, expect, it } from 'vitest'

import mesRoutes from './routes'

// Verifies the MES module exposes mold-management pages through one stable navigation entry.
describe('tenant MES routes', () => {
  it('binds mold management, mold design detail, and production mold management to the mes.mold-management entry', () => {
    const mesRoute = mesRoutes.find((route) => route.name === 'TenantMes')
    const moldRoute = mesRoute?.children?.find((route) => route.name === 'TenantMesMoldManagement')
    const moldDesignDetailRoute = mesRoute?.children?.find((route) => route.name === 'TenantMesMoldDesignDetail')
    const productionMoldRoute = mesRoute?.children?.find(
      (route) => route.name === 'TenantMesProductionMoldManagement'
    )

    expect(mesRoute?.path).toBe('/mes')
    expect(moldRoute?.path).toBe('/mes/mold-management')
    expect(moldRoute?.meta?.entryKey).toBe('mes.mold-management')
    expect(moldRoute?.meta?.fullPathKey).toBe(false)
    expect(moldRoute?.component).toBeTypeOf('function')
    expect(moldDesignDetailRoute?.path).toBe('/mes/mold-designs/:moldDesignId')
    expect(moldDesignDetailRoute?.meta?.activePath).toBe('/mes/mold-management')
    expect(moldDesignDetailRoute?.meta?.entryKey).toBe('mes.mold-management')
    expect(moldDesignDetailRoute?.meta?.hideInMenu).toBe(true)
    expect(moldDesignDetailRoute?.component).toBeTypeOf('function')
    expect(productionMoldRoute?.path).toBe('/mes/production-molds')
    expect(productionMoldRoute?.meta?.activePath).toBe('/mes/mold-management')
    expect(productionMoldRoute?.meta?.entryKey).toBe('mes.mold-management')
    expect(productionMoldRoute?.meta?.hideInMenu).toBe(true)
    expect(productionMoldRoute?.component).toBeTypeOf('function')
  })
})
