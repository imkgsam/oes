import { Reflector } from '@nestjs/core'
import { plainToInstance } from 'class-transformer'
import { validate } from 'class-validator'
import {
  CRM_MANAGEMENT_PERMISSION_CODES,
  GATEWAY_ROUTE_SESSION_TERMINALS_METADATA_KEY,
  REQUIRE_PERMISSIONS_METADATA_KEY
} from '@oes/common/authorization'
import { ExtensionCrmWorkspaceController } from './extension-crm-workspace.controller'
import { ExtensionLeadInputDto } from '../dtos/extension-crm-workspace.dto'

describe('ExtensionCrmWorkspaceController', () => {
  const service = {
    checkDuplicate: jest.fn(),
    claimPoolLead: jest.fn(),
    createActiveLead: jest.fn(),
    createDraftLead: jest.fn(),
    getAccountSummary: jest.fn(),
    resolvePageContext: jest.fn(),
    resolveSearchResults: jest.fn()
  }
  const controller = new ExtensionCrmWorkspaceController(service as any)

  beforeEach(() => {
    jest.clearAllMocks()
  })

  it('declares CRM permissions on extension workspace endpoints', () => {
    const reflector = new Reflector()

    expect(
      reflector.get(GATEWAY_ROUTE_SESSION_TERMINALS_METADATA_KEY, ExtensionCrmWorkspaceController)
    ).toEqual(['WEB', 'BROWSER_EXTENSION'])

    expect(
      reflector.get(
        REQUIRE_PERMISSIONS_METADATA_KEY,
        ExtensionCrmWorkspaceController.prototype.resolvePageContext
      )
    ).toEqual({ all: [CRM_MANAGEMENT_PERMISSION_CODES.READ_CRM_ACCOUNT] })
    expect(
      reflector.get(
        REQUIRE_PERMISSIONS_METADATA_KEY,
        ExtensionCrmWorkspaceController.prototype.resolveSearchResults
      )
    ).toEqual({ all: [CRM_MANAGEMENT_PERMISSION_CODES.READ_CRM_ACCOUNT] })
    expect(
      reflector.get(
        REQUIRE_PERMISSIONS_METADATA_KEY,
        ExtensionCrmWorkspaceController.prototype.checkDuplicate
      )
    ).toEqual({ all: [CRM_MANAGEMENT_PERMISSION_CODES.READ_CRM_ACCOUNT] })
    expect(
      reflector.get(
        REQUIRE_PERMISSIONS_METADATA_KEY,
        ExtensionCrmWorkspaceController.prototype.createDraftLead
      )
    ).toEqual({ all: [CRM_MANAGEMENT_PERMISSION_CODES.CREATE_CRM_ACCOUNT] })
    expect(
      reflector.get(
        REQUIRE_PERMISSIONS_METADATA_KEY,
        ExtensionCrmWorkspaceController.prototype.createActiveLead
      )
    ).toEqual({ all: [CRM_MANAGEMENT_PERMISSION_CODES.CREATE_CRM_ACCOUNT] })
    expect(
      reflector.get(
        REQUIRE_PERMISSIONS_METADATA_KEY,
        ExtensionCrmWorkspaceController.prototype.claimPoolLead
      )
    ).toEqual({ all: [CRM_MANAGEMENT_PERMISSION_CODES.CLAIM_CRM_ACCOUNT] })
    expect(
      reflector.get(
        REQUIRE_PERMISSIONS_METADATA_KEY,
        ExtensionCrmWorkspaceController.prototype.getAccountSummary
      )
    ).toEqual({ all: [CRM_MANAGEMENT_PERMISSION_CODES.READ_CRM_ACCOUNT] })
  })

  it('forwards extension CRM requests to the workspace service', async () => {
    const source = { requestId: 'req-1' }
    service.resolvePageContext.mockResolvedValue({ status: 'UNKNOWN' })
    service.resolveSearchResults.mockResolvedValue({ results: [] })
    service.checkDuplicate.mockResolvedValue({ duplicateResult: { resultType: 'NO_DUPLICATE' } })
    service.createDraftLead.mockResolvedValue({ crmAccount: { crmAccountId: 'draft-1' } })
    service.createActiveLead.mockResolvedValue({ crmAccount: { crmAccountId: 'lead-1' } })
    service.claimPoolLead.mockResolvedValue({ crmAccount: { crmAccountId: 'pool-1' } })
    service.getAccountSummary.mockResolvedValue({ crmAccount: { crmAccountId: 'lead-1' } })

    const pageBody = {
      page: {
        capturedAt: '2026-06-23T00:00:00.000Z',
        domain: 'serrano.example',
        pageKind: 'OFFICIAL_SITE',
        title: 'Serrano',
        url: 'https://serrano.example'
      }
    } as any

    await controller.resolvePageContext(pageBody, source as any)
    await controller.resolveSearchResults(
      {
        capturedAt: '2026-06-23T00:00:00.000Z',
        query: 'serrano',
        results: [],
        searchEngine: 'GOOGLE'
      } as any,
      source as any
    )
    await controller.checkDuplicate({ displayName: 'Serrano' } as any, source as any)
    await controller.createDraftLead({ displayName: 'Serrano' } as any, source as any)
    await controller.createActiveLead({ displayName: 'Serrano' } as any, source as any)
    await controller.claimPoolLead('crm-1', source as any)
    await controller.getAccountSummary('crm-1', source as any)

    expect(service.resolvePageContext).toHaveBeenCalledWith(pageBody, source)
    expect(service.resolveSearchResults).toHaveBeenCalledWith(expect.any(Object), source)
    expect(service.checkDuplicate).toHaveBeenCalledWith(expect.any(Object), source)
    expect(service.createDraftLead).toHaveBeenCalledWith(expect.any(Object), source)
    expect(service.createActiveLead).toHaveBeenCalledWith(expect.any(Object), source)
    expect(service.claimPoolLead).toHaveBeenCalledWith('crm-1', source)
    expect(service.getAccountSummary).toHaveBeenCalledWith('crm-1', source)
  })

  it('forwards the standard browser capture payload when creating draft leads', async () => {
    const source = { requestId: 'req-1' }
    const body = {
      capture: {
        browserContext: { entryPoint: 'CONTEXT_MENU', workspace: 'CRM' },
        capturedAt: '2026-06-23T00:00:00.000Z',
        captureKind: 'CURRENT_PAGE',
        companyNameCandidates: ['Serrano Fixtures'],
        sourcePageTitle: 'Serrano Fixtures',
        sourcePageUrl: 'https://serrano.example',
        targetDomain: 'serrano.example',
        targetTitle: 'Serrano Fixtures',
        targetUrl: 'https://serrano.example',
        visibleEmails: ['imports@serrano.example'],
        visiblePhones: []
      },
      displayName: 'Serrano Fixtures'
    }
    service.createDraftLead.mockResolvedValue({ crmAccount: { crmAccountId: 'draft-1' } })

    await controller.createDraftLead(body as any, source as any)

    expect(service.createDraftLead).toHaveBeenCalledWith(body, source)
  })

  it('validates the standard browser capture payload shape', async () => {
    const valid = plainToInstance(ExtensionLeadInputDto, {
      capture: {
        browserContext: { entryPoint: 'CONTEXT_MENU', workspace: 'CRM' },
        capturedAt: '2026-06-23T00:00:00.000Z',
        captureKind: 'LINK',
        companyNameCandidates: ['Serrano Fixtures'],
        sourcePageTitle: 'Google',
        sourcePageUrl: 'https://www.google.com/search?q=serrano',
        targetDomain: 'serrano.example',
        targetTitle: 'serrano.example',
        targetUrl: 'https://serrano.example',
        visibleEmails: [],
        visiblePhones: []
      },
      displayName: 'Serrano Fixtures'
    })
    const invalid = plainToInstance(ExtensionLeadInputDto, {
      capture: {
        browserContext: { entryPoint: 'CONTEXT_MENU', workspace: 'CRM' },
        capturedAt: '2026-06-23T00:00:00.000Z',
        captureKind: 'SELECTION',
        sourcePageTitle: 'Google',
        sourcePageUrl: 'https://www.google.com/search?q=serrano',
        targetDomain: 'serrano.example',
        targetTitle: 'serrano.example'
      },
      displayName: 'Serrano Fixtures'
    })

    await expect(validate(valid)).resolves.toHaveLength(0)
    await expect(validate(invalid)).resolves.not.toHaveLength(0)
  })
})
