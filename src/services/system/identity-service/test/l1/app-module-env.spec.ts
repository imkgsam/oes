import { MODULE_METADATA } from '@nestjs/common/constants'
import { ConfigModule } from '@nestjs/config'
import { AppModule } from '../../src/app.module'

describe('AppModule environment wiring', () => {
  it('loads service environment before Prisma connects', async () => {
    const imports = Reflect.getMetadata(MODULE_METADATA.IMPORTS, AppModule) ?? []
    const resolvedImports = await Promise.all(imports)

    expect(resolvedImports).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          module: ConfigModule
        })
      ])
    )
  })
})
