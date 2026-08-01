import { resolveExternalApiKeyContext } from './external-api-key-context.adapter'
jest.mock('@oes/common/authorization', () => ({ getAuthenticatedGrpcRequestContext: jest.fn(() => undefined) }))
describe('external API-key context adapter', () => { it('fails closed without authenticated runtime context', () => expect(resolveExternalApiKeyContext({})).toEqual({ trustedHuman: false, tenantId: '', operatorId: '', verifiedGatewayExchange: false })) })
