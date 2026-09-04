import { Reflector } from '@nestjs/core'
import { GATEWAY_ROUTE_SESSION_TERMINALS_METADATA_KEY } from '../constants'
import { AdmitGatewaySessionTerminals } from './admit-gateway-session-terminals.decorator'

describe('AdmitGatewaySessionTerminals', () => {
  it('writes one exact frozen route terminal declaration', () => {
    @AdmitGatewaySessionTerminals('WEB', 'BROWSER_EXTENSION')
    class ExtensionController {}

    const declaration = new Reflector().get(
      GATEWAY_ROUTE_SESSION_TERMINALS_METADATA_KEY,
      ExtensionController
    )
    expect(declaration).toEqual(['WEB', 'BROWSER_EXTENSION'])
    expect(Object.isFrozen(declaration)).toBe(true)
  })

  it('rejects duplicate or non-canonical route terminal declarations', () => {
    expect(() => AdmitGatewaySessionTerminals('WEB', 'WEB')).toThrow(
      'Gateway route session terminals must be unique canonical values'
    )
    expect(() => AdmitGatewaySessionTerminals('KIOSK' as never)).toThrow(
      'Gateway route session terminals must be unique canonical values'
    )
  })
})
