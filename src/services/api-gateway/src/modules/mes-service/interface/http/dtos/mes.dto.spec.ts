import { ArgumentMetadata, ValidationPipe } from '@nestjs/common'
import {
  CreateProductionSpecDto,
  InstallToolingDto,
  ListCurrentMoldsByWorkCenterDto,
  ListMasterMoldsDto,
  ListMoldDesignsDto,
  ListProductionMoldsByDesignDto,
  ListProductionMoldsDto,
  ListProductionSpecsDto,
  MoveToolingDto,
  PrintDailyMoldChecklistDto
} from './mes.dto'

const pipe = new ValidationPipe({
  transform: true,
  whitelist: true,
  forbidNonWhitelisted: true,
  forbidUnknownValues: true
})

// Verifies MES query DTOs carry validation metadata accepted by api-gateway's global ValidationPipe.
describe('MES HTTP DTOs', () => {
  async function transformQuery<T>(metatype: new () => T, value: Record<string, unknown>) {
    const metadata: ArgumentMetadata = {
      type: 'query',
      metatype,
      data: ''
    }

    return pipe.transform(value, metadata)
  }

  async function transformBody<T>(metatype: new () => T, value: Record<string, unknown>) {
    const metadata: ArgumentMetadata = {
      type: 'body',
      metatype,
      data: ''
    }

    return pipe.transform(value, metadata)
  }

  it('accepts and transforms ProductionSpec list query filters', async () => {
    await expect(
      transformQuery(ListProductionSpecsDto, {
        includeRetired: 'false',
        itemId: 'item-1',
        page: '1',
        pageSize: '50',
        status: 'ACTIVE'
      })
    ).resolves.toMatchObject({
      includeRetired: false,
      itemId: 'item-1',
      page: 1,
      pageSize: 50,
      status: 'ACTIVE'
    })
  })

  it('accepts ProductionSpec creation commands under gateway whitelist validation', async () => {
    await expect(
      transformBody(CreateProductionSpecDto, {
        commandId: 'cmd-1',
        itemRef: { itemId: 'item-1' },
        name: 'Spec A',
        orgId: 'org-1',
        reason: 'runtime check',
        revisionCode: 'R1',
        specCode: 'SPEC-001'
      })
    ).resolves.toMatchObject({
      commandId: 'cmd-1',
      itemRef: { itemId: 'item-1' },
      name: 'Spec A',
      orgId: 'org-1',
      reason: 'runtime check',
      revisionCode: 'R1',
      specCode: 'SPEC-001'
    })
  })

  it('accepts and transforms MoldDesign list query filters', async () => {
    await expect(
      transformQuery(ListMoldDesignsDto, {
        itemModelId: 'item-model-1',
        page: '1',
        pageSize: '20',
        productionSpecId: 'spec-1',
        status: 'ACTIVE'
      })
    ).resolves.toMatchObject({
      itemModelId: 'item-model-1',
      page: 1,
      pageSize: 20,
      productionSpecId: 'spec-1',
      status: 'ACTIVE'
    })
  })

  it('accepts and transforms MasterMold list query filters', async () => {
    await expect(
      transformQuery(ListMasterMoldsDto, {
        moldDesignId: 'design-1',
        page: '1',
        pageSize: '20',
        status: 'AVAILABLE'
      })
    ).resolves.toMatchObject({
      moldDesignId: 'design-1',
      page: 1,
      pageSize: 20,
      status: 'AVAILABLE'
    })
  })

  it('accepts and transforms ProductionMold list query filters', async () => {
    await expect(
      transformQuery(ListProductionMoldsDto, {
        moldDesignId: 'design-1',
        page: '1',
        pageSize: '50',
        warningLevel: 'WARNING'
      })
    ).resolves.toMatchObject({
      moldDesignId: 'design-1',
      page: 1,
      pageSize: 50,
      warningLevel: 'WARNING'
    })
  })

  it('accepts and transforms MoldDesign-scoped ProductionMold query filters', async () => {
    await expect(
      transformQuery(ListProductionMoldsByDesignDto, {
        page: '1',
        pageSize: '50',
        status: 'INSTALLED'
      })
    ).resolves.toMatchObject({
      page: 1,
      pageSize: 50,
      status: 'INSTALLED'
    })
  })

  it('accepts current work-center mold query filters without WorkCenter CRUD fields', async () => {
    await expect(
      transformQuery(ListCurrentMoldsByWorkCenterDto, {
        workUnitId: 'wu-1'
      })
    ).resolves.toMatchObject({
      workUnitId: 'wu-1'
    })
  })

  it('accepts tooling installation commands with work refs and mold detail fields', async () => {
    await expect(
      transformBody(InstallToolingDto, {
        moldPosition: 'A1',
        workCenterRef: { workCenterId: 'wc-1' }
      })
    ).resolves.toMatchObject({
      moldPosition: 'A1',
      workCenterRef: { workCenterId: 'wc-1' }
    })
  })

  it('accepts tooling movement commands with command envelope fields', async () => {
    await expect(
      transformBody(MoveToolingDto, {
        commandId: 'cmd-move-1',
        movementReason: 'ready',
        orgId: 'org-1',
        reason: 'runtime check',
        toolingType: 'MOLD',
        toStorageResourceRef: { storageResourceId: 'storage-1' }
      })
    ).resolves.toMatchObject({
      commandId: 'cmd-move-1',
      movementReason: 'ready',
      orgId: 'org-1',
      reason: 'runtime check',
      toolingType: 'MOLD',
      toStorageResourceRef: { storageResourceId: 'storage-1' }
    })
  })

  it('accepts daily mold checklist query filters', async () => {
    await expect(
      transformQuery(PrintDailyMoldChecklistDto, {
        checklistDate: '2026-05-06',
        workCenterId: 'wc-1'
      })
    ).resolves.toMatchObject({
      checklistDate: '2026-05-06',
      workCenterId: 'wc-1'
    })
  })

  it('rejects unknown MES query fields under gateway whitelist validation', async () => {
    await expect(
      transformQuery(ListProductionSpecsDto, {
        page: '1',
        unexpected: 'nope'
      })
    ).rejects.toMatchObject({
      response: expect.objectContaining({
        message: expect.arrayContaining(['property unexpected should not exist'])
      })
    })
  })
})
