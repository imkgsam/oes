import test from 'node:test'
import assert from 'node:assert/strict'

import { createSmokeSeed, runCrmP1SmokeFlow } from '../../../scripts/crm-smoke-lib.mjs'

// Verifies the CRM P1 smoke flow creates a Lead, lists it, formalizes it, and reads back the Prospect Customer account.
test('crm p1 smoke flow / should create, list, formalize, and read one crm account', async () => {
  const calls = []
  const seed = createSmokeSeed(1700000000003)

  const result = await runCrmP1SmokeFlow(
    {
      crm: {
        query: {
          listCrmAccounts: async (request) => {
            calls.push(['listCrmAccounts', request])

            return {
              crmAccounts: [
                {
                  crmAccountId: 'crm-account-1',
                  tenantId: seed.tenantId,
                  tenantPartyId: calls.some(([name]) => name === 'convertLeadToProspectCustomer')
                    ? 'tenant-party-1'
                    : '',
                  recordStatus: 'ACTIVE',
                  lifecycleStage: calls.some(([name]) => name === 'convertLeadToProspectCustomer')
                    ? 'PROSPECT_CUSTOMER'
                    : 'LEAD',
                  partyTypeHint: 'ORGANIZATION',
                  displayName: seed.displayName,
                  leadCompanyName: seed.partyCanonicalName,
                  leadDomain: seed.leadDomain,
                  leadEmail: seed.leadEmail,
                  leadCountry: seed.partyRegisteredCountry,
                  leadIdentifiers: [
                    {
                      identifierType: seed.partyIdentifierType,
                      normalizedValue: seed.partyIdentifierValue,
                      rawValue: seed.partyIdentifierValue,
                      issuerCountryOrRegion: seed.partyRegisteredCountry
                    }
                  ],
                  ownerAccountId: seed.operatorAccountId,
                  priority: 'A',
                  createdBy: seed.operatorAccountId
                }
              ],
              total: 1,
              page: request.page,
              pageSize: request.pageSize
            }
          },
          getCrmAccount: async (request) => {
            calls.push(['getCrmAccount', request])
            return {
              crmAccount: {
                crmAccountId: request.crmAccountId,
                tenantId: seed.tenantId,
                tenantPartyId: 'tenant-party-1',
                recordStatus: 'ACTIVE',
                lifecycleStage: 'PROSPECT_CUSTOMER',
                partyTypeHint: 'ORGANIZATION',
                displayName: seed.displayName,
                leadCompanyName: seed.partyCanonicalName,
                leadDomain: seed.leadDomain,
                leadEmail: seed.leadEmail,
                leadCountry: seed.partyRegisteredCountry,
                leadIdentifiers: [],
                ownerAccountId: seed.operatorAccountId,
                priority: 'A',
                createdBy: seed.operatorAccountId
              }
            }
          }
        },
        management: {
          createLead: async (request) => {
            calls.push(['createLead', request])
            return {
              resultType: 'CREATED',
              crmAccount: {
                crmAccountId: 'crm-account-1',
                tenantId: seed.tenantId,
                tenantPartyId: '',
                recordStatus: 'ACTIVE',
                lifecycleStage: 'LEAD',
                partyTypeHint: request.partyTypeHint,
                displayName: request.displayName,
                leadCompanyName: request.leadCompanyName,
                leadDomain: request.leadDomain,
                leadEmail: request.leadEmail,
                leadCountry: request.leadCountry,
                leadIdentifiers: request.leadIdentifiers,
                ownerAccountId: seed.operatorAccountId,
                priority: request.priority,
                createdBy: seed.operatorAccountId
              },
              duplicateResult: {
                resultType: 'NO_DUPLICATE',
                candidates: []
              }
            }
          },
          convertLeadToProspectCustomer: async (request) => {
            calls.push(['convertLeadToProspectCustomer', request])
            return {
              resultType: 'CONVERTED',
              crmAccount: {
                crmAccountId: request.crmAccountId,
                tenantId: seed.tenantId,
                tenantPartyId: 'tenant-party-1',
                recordStatus: 'ACTIVE',
                lifecycleStage: 'PROSPECT_CUSTOMER',
                partyTypeHint: 'ORGANIZATION',
                displayName: seed.displayName,
                leadCompanyName: seed.partyCanonicalName,
                leadDomain: seed.leadDomain,
                leadEmail: seed.leadEmail,
                leadCountry: seed.partyRegisteredCountry,
                leadIdentifiers: [],
                ownerAccountId: seed.operatorAccountId,
                priority: 'A',
                createdBy: seed.operatorAccountId
              },
              candidates: [],
              existingCrmAccountId: ''
            }
          }
        }
      }
    },
    seed
  )

  assert.equal(result.crmAccountId, 'crm-account-1')
  assert.equal(result.conversionResultType, 'CONVERTED')
  assert.equal(result.tenantPartyId, 'tenant-party-1')
  assert.equal(result.listTotals.afterCreate, 1)
  assert.equal(result.listTotals.afterConvert, 1)
  assert.deepEqual(
    calls.map(([name]) => name),
    [
      'createLead',
      'listCrmAccounts',
      'convertLeadToProspectCustomer',
      'listCrmAccounts',
      'getCrmAccount'
    ]
  )
})
