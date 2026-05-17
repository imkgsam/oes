import { LoginStatus } from '@oes/common/generated/auth_service'
import { toAuthResponseViewModel } from './auth-response.mapper'

describe('auth response mapper', () => {
  it('keeps terminal device session context on successful PDA login responses', () => {
    const result = toAuthResponseViewModel({
      status: LoginStatus.LOGIN_STATUS_SUCCESS,
      accessToken: 'access-token',
      refreshToken: 'refresh-token',
      expiresIn: '900',
      terminal: 'PDA',
      allowedTerminals: ['PDA', 'WEB'],
      terminalDeviceId: 'terminal-device-1',
      deviceBoundTenantId: 'tenant-1'
    })

    expect(result.session).toEqual(
      expect.objectContaining({
        terminal: 'PDA',
        terminalDeviceId: 'terminal-device-1',
        deviceBoundTenantId: 'tenant-1'
      })
    )
  })
})
