import { ValidatingCommandBus, ValidatingQueryBus } from '@oes/common/cqrs'
import {
  AUTH_MANAGEMENT_PERMISSION_CODES,
  REQUIRE_PERMISSION_METADATA_KEY
} from '@oes/common/authorization'
import {
  GetTenantMfaPolicyResponse,
  LoginWithEmailPasswordResponse,
  MfaBindingType,
  RequestLoginMfaFactorChallengeResponse,
  RevokeTrustedDeviceResponse,
  StartStepUpMfaChallengeResponse,
  SubmitMfaChallengeResponse
} from '@oes/common/generated/auth_service'
import { AuthGrpcController } from './auth.grpc.controller'

describe('AuthGrpcController', () => {
  it('maps bootstrapOwnLoginMethods into the shared bootstrap command for self-service contact binding follow-up', async () => {
    const commandBus = {
      execute: jest.fn().mockResolvedValue({
        emailBootstrapped: true,
        phoneBootstrapped: false,
        passwordBootstrapped: false
      })
    } as unknown as ValidatingCommandBus
    const queryBus = {} as ValidatingQueryBus

    const controller = new AuthGrpcController(commandBus, queryBus)

    await expect(
      controller.bootstrapOwnLoginMethods({
        accountId: 'account-1',
        userId: 'user-1',
        email: 'user@example.com',
        __oesOperatorContext: {
          operatorContext: {
            operator_id: 'account-1'
          }
        }
      } as any)
    ).resolves.toEqual({
      emailBootstrapped: true,
      phoneBootstrapped: false,
      passwordBootstrapped: false
    })

    expect((commandBus.execute as jest.Mock).mock.calls[0][0]).toEqual(
      expect.objectContaining({
        userId: 'user-1',
        email: 'user@example.com'
      })
    )
  })

  it('rejects bootstrapOwnLoginMethods when the operator is not the authenticated account holder', async () => {
    const commandBus = {
      execute: jest.fn()
    } as unknown as ValidatingCommandBus
    const queryBus = {} as ValidatingQueryBus

    const controller = new AuthGrpcController(commandBus, queryBus)

    await expect(
      controller.bootstrapOwnLoginMethods({
        accountId: 'account-1',
        userId: 'user-1',
        email: 'user@example.com',
        __oesOperatorContext: {
          operatorContext: {
            operator_id: 'admin-account-1'
          }
        }
      } as any)
    ).rejects.toMatchObject({
      definition: {
        code: 'APP_AUTH_002'
      }
    })

    expect((commandBus.execute as jest.Mock)).not.toHaveBeenCalled()
  })

  it('keeps bootstrapUserLoginMethods marked with the admin bootstrap permission metadata', () => {
    expect(
      Reflect.getMetadata(
        REQUIRE_PERMISSION_METADATA_KEY,
        AuthGrpcController.prototype.bootstrapUserLoginMethods
      )
    ).toBe(AUTH_MANAGEMENT_PERMISSION_CODES.BOOTSTRAP_ACCOUNT_CREDENTIALS)
  })

  it('should map requestLoginMfaFactorChallenge requests into factor-specific otp responses', async () => {
    const commandBus = {
      execute: jest.fn().mockResolvedValue({
        factorChallengeId: 'factor-challenge-1',
        destination: 'a***@example.com',
        expiresAt: '2026-04-21T08:00:00.000Z'
      })
    } as unknown as ValidatingCommandBus
    const queryBus = {} as ValidatingQueryBus

    const controller = new AuthGrpcController(commandBus, queryBus)

    const response: RequestLoginMfaFactorChallengeResponse =
      await controller.requestLoginMfaFactorChallenge({
      challengeId: 'login-mfa-flow-token',
      factor: MfaBindingType.MFA_BINDING_TYPE_EMAIL_OTP
      } as any)

    expect((commandBus.execute as jest.Mock).mock.calls[0][0]).toEqual(
      expect.objectContaining({
        challengeId: 'login-mfa-flow-token',
        factor: 'EMAIL_OTP'
      })
    )
    expect(response).toEqual({
      challengeId: 'factor-challenge-1',
      destination: 'a***@example.com',
      expiresAt: '2026-04-21T08:00:00.000Z'
    })
  })

  it('should map selectAccount MFA_REQUIRED results into the enriched select-account response', async () => {
    const commandBus = {
      execute: jest.fn().mockResolvedValue({
        status: 'MFA_REQUIRED',
        userId: 'user-1',
        accountId: 'account-1',
        tenantId: 'tenant-1',
        scopeLevel: 'TENANT',
        displayName: 'Tenant Admin',
        challengeId: 'login-mfa-flow-token',
        scenario: 'LOGIN',
        defaultFactor: 'TOTP',
        availableFactors: [
          { type: 'TOTP', label: '认证器 App', priority: 1 },
          { type: 'EMAIL_OTP', label: '邮箱验证码', priority: 2 }
        ],
        factorChallengeId: '',
        destination: '',
        expiresAt: '',
        passwordSetupRequired: false
      })
    } as unknown as ValidatingCommandBus
    const queryBus = {} as ValidatingQueryBus

    const controller = new AuthGrpcController(commandBus, queryBus)

    const response = await controller.selectAccount({
      userId: 'user-1',
      accountId: 'account-1',
      loginMethod: 'EMAIL_PASSWORD'
    } as any)

    expect(response).toEqual(
      expect.objectContaining({
        status: 2,
        userId: 'user-1',
        accountId: 'account-1',
        tenantId: 'tenant-1',
        challengeId: 'login-mfa-flow-token',
        defaultMfaFactor: 3,
        availableFactors: [
          { type: 3, label: '认证器 App', priority: 1 },
          { type: 1, label: '邮箱验证码', priority: 2 }
        ]
      })
    )
  })

  it('should map submitMfaChallenge requests into the unified session-success response', async () => {
    const commandBus = {
      execute: jest.fn().mockResolvedValue({
        userId: 'user-1',
        accountId: 'account-1',
        tenantId: 'tenant-1',
        scopeLevel: 'TENANT',
        sessionId: 'session-1',
        accessToken: 'access-token',
        refreshToken: 'refresh-token',
        expiresIn: 900,
        loginMethod: 'EMAIL_PASSWORD',
        displayName: 'Tenant Admin',
        passwordSetupRequired: false
      })
    } as unknown as ValidatingCommandBus
    const queryBus = {} as ValidatingQueryBus

    const controller = new AuthGrpcController(commandBus, queryBus)

    const response: SubmitMfaChallengeResponse = await controller.submitMfaChallenge({
      challengeId: 'login-mfa-flow-token',
      factor: 3,
      code: '123456',
      loginMethod: 'EMAIL_PASSWORD',
      trustCurrentDevice: true
    } as any)

    expect((commandBus.execute as jest.Mock).mock.calls[0][0]).toEqual(
      expect.objectContaining({
        challengeId: 'login-mfa-flow-token',
        factor: 'TOTP',
        code: '123456',
        loginMethod: 'EMAIL_PASSWORD',
        trustCurrentDevice: true
      })
    )
    expect(response).toEqual(
      expect.objectContaining({
        status: 1,
        accessToken: 'access-token',
        refreshToken: 'refresh-token',
        expiresIn: '900'
      })
    )
  })

  it('should map trusted-device self-service queries into the trusted-device list response', async () => {
    const commandBus = {} as ValidatingCommandBus
    const queryBus = {
      execute: jest.fn().mockResolvedValue([
        {
          id: 'trusted-device-1',
          userId: 'user-1',
          tenantId: 'tenant-1',
          deviceId: 'browser-1',
          deviceName: 'Firefox on macOS',
          browser: 'Firefox',
          platform: 'macOS',
          trustedAt: new Date('2026-04-22T08:00:00.000Z'),
          lastSeenAt: new Date('2026-04-22T09:00:00.000Z'),
          expiresAt: new Date('2026-05-22T08:00:00.000Z'),
          revokedAt: null,
          createdAt: new Date('2026-04-22T08:00:00.000Z'),
          updatedAt: new Date('2026-04-22T09:00:00.000Z')
        }
      ])
    } as unknown as ValidatingQueryBus

    const controller = new AuthGrpcController(commandBus, queryBus)

    const response = await controller.listTrustedDevices({
      userId: 'user-1',
      tenantId: 'tenant-1',
      currentDeviceId: 'browser-1'
    } as any)

    expect((queryBus.execute as jest.Mock).mock.calls[0][0]).toEqual(
      expect.objectContaining({
        userId: 'user-1',
        tenantId: 'tenant-1'
      })
    )
    expect(response).toEqual({
      devices: [
        {
          id: 'trusted-device-1',
          deviceId: 'browser-1',
          deviceName: 'Firefox on macOS',
          browser: 'Firefox',
          platform: 'macOS',
          trustedAt: '2026-04-22T08:00:00.000Z',
          lastActiveAt: '2026-04-22T09:00:00.000Z',
          expiresAt: '2026-05-22T08:00:00.000Z',
          isCurrentDevice: true
        }
      ]
    })
  })

  it('should map trusted-device revocation commands without coupling them to session logout', async () => {
    const commandBus = {
      execute: jest
        .fn()
        .mockResolvedValueOnce({ success: true, deviceCount: 1 })
        .mockResolvedValueOnce({ success: true, deviceCount: 3 })
    } as unknown as ValidatingCommandBus
    const queryBus = {} as ValidatingQueryBus

    const controller = new AuthGrpcController(commandBus, queryBus)

    await expect(
      (controller.revokeTrustedDevice({
        userId: 'user-1',
        tenantId: 'tenant-1',
        trustedDeviceId: 'trusted-device-1'
      } as any) as Promise<RevokeTrustedDeviceResponse>)
    ).resolves.toEqual({
      success: true,
      deviceCount: '1'
    })

    await expect(
      controller.revokeOtherTrustedDevices({
        userId: 'user-1',
        tenantId: 'tenant-1',
        currentDeviceId: 'browser-1'
      } as any)
    ).resolves.toEqual({
      success: true,
      deviceCount: '3'
    })
  })

  it('should map password login device context into LoginWithEmailPasswordCommand', async () => {
    const commandBus = {
      execute: jest.fn().mockResolvedValue({
        userId: 'user-1',
        method: 'EMAIL_PASSWORD',
        nextStep: 'MFA_REQUIRED',
        accounts: [],
        challengeId: 'challenge-1'
      })
    } as unknown as ValidatingCommandBus
    const queryBus = {} as ValidatingQueryBus

    const controller = new AuthGrpcController(commandBus, queryBus)

    const response: LoginWithEmailPasswordResponse = await controller.loginWithEmailPassword({
      email: 'alice@example.com',
      password: 'secret-1',
      deviceName: 'Alice MacBook Pro',
      userAgent: 'Mozilla/5.0 Firefox/149.0',
      ipAddress: '127.0.0.1'
    } as any)

    expect((commandBus.execute as jest.Mock).mock.calls[0][0]).toEqual(
      expect.objectContaining({
        email: 'alice@example.com',
        password: 'secret-1',
        deviceName: 'Alice MacBook Pro',
        userAgent: 'Mozilla/5.0 Firefox/149.0',
        ipAddress: '127.0.0.1'
      })
    )
    expect(response).toEqual(
      expect.objectContaining({
        status: 2,
        challengeId: 'challenge-1',
        loginMethod: 'EMAIL_PASSWORD'
      })
    )
  })

  it('should map validateAccessToken requests into ValidateAccessTokenQuery', async () => {
    const commandBus = {} as ValidatingCommandBus
    const queryBus = {
      execute: jest.fn().mockResolvedValue({
        userId: 'user-1',
        accountId: 'account-1',
        tenantId: 'tenant-1',
        sessionId: 'session-1',
        scopeLevel: 'TENANT',
        passwordSetupRequired: true,
        roleIds: ['role-1']
      })
    } as unknown as ValidatingQueryBus

    const controller = new AuthGrpcController(commandBus, queryBus)

    const response = await controller.validateAccessToken({
      accessToken: 'token-1'
    } as any)

    expect((queryBus.execute as jest.Mock).mock.calls[0][0]).toEqual(
      expect.objectContaining({
        accessToken: 'token-1'
      })
    )
    expect(response).toEqual({
      userId: 'user-1',
      accountId: 'account-1',
      tenantId: 'tenant-1',
      sessionId: 'session-1',
      scopeLevel: 'TENANT',
      passwordSetupRequired: true,
      roleIds: ['role-1']
    })
  })

  it('should map getTenantMfaPolicy requests into the tenant-mfa query response', async () => {
    const commandBus = {} as ValidatingCommandBus
    const queryBus = {
      execute: jest.fn().mockResolvedValue({
        tenantId: 'tenant-1',
        loginRequired: true,
        scenarioRequirements: {
          LOGIN: true,
          CHANGE_PASSWORD: true,
          CHANGE_CONTACT: false,
          NEW_DEVICE_LOGIN: false
        },
        factors: [
          { factor: 'EMAIL_OTP', enabled: true, priority: 1 },
          { factor: 'TOTP', enabled: true, priority: 2 }
        ]
      })
    } as unknown as ValidatingQueryBus

    const controller = new AuthGrpcController(commandBus, queryBus)
    const getRequiredOperatorIdSpy = jest
      .spyOn(controller as any, 'getRequiredOperatorId')
      .mockReturnValue('operator-1')

    const response: GetTenantMfaPolicyResponse = await controller.getTenantMfaPolicy({
      tenantId: 'tenant-1'
    } as any)

    expect(getRequiredOperatorIdSpy).toHaveBeenCalled()
    expect((queryBus.execute as jest.Mock).mock.calls[0][0]).toEqual(
      expect.objectContaining({
        tenantId: 'tenant-1'
      })
    )
    expect(response).toEqual({
      tenantId: 'tenant-1',
      loginRequired: true,
      scenarioRequirements: [
        {
          scenario: 1,
          required: true
        },
        {
          scenario: 3,
          required: true
        },
        {
          scenario: 4,
          required: false
        },
        {
          scenario: 2,
          required: false
        }
      ],
      factors: [
        {
          factor: MfaBindingType.MFA_BINDING_TYPE_EMAIL_OTP,
          enabled: true,
          priority: 1
        },
        {
          factor: MfaBindingType.MFA_BINDING_TYPE_TOTP,
          enabled: true,
          priority: 2
        }
      ]
    })
  })

  it('should map updateTenantMfaPolicy requests into the tenant-mfa command response', async () => {
    const commandBus = {
      execute: jest.fn().mockResolvedValue({
        tenantId: 'tenant-1',
        loginRequired: true,
        scenarioRequirements: {
          LOGIN: true,
          CHANGE_PASSWORD: false,
          CHANGE_CONTACT: true,
          NEW_DEVICE_LOGIN: true
        },
        factors: [
          { factor: 'TOTP', enabled: true, priority: 1 },
          { factor: 'BACKUP_CODE', enabled: false, priority: 2 }
        ]
      })
    } as unknown as ValidatingCommandBus
    const queryBus = {} as ValidatingQueryBus

    const controller = new AuthGrpcController(commandBus, queryBus)
    const getRequiredOperatorIdSpy = jest
      .spyOn(controller as any, 'getRequiredOperatorId')
      .mockReturnValue('operator-1')

    const response = await controller.updateTenantMfaPolicy({
      tenantId: 'tenant-1',
      loginRequired: true,
      scenarioRequirements: [
        { scenario: 1, required: true },
        { scenario: 3, required: false },
        { scenario: 4, required: true },
        { scenario: 2, required: true }
      ],
      factors: [
        {
          factor: MfaBindingType.MFA_BINDING_TYPE_TOTP,
          enabled: true,
          priority: 1
        },
        {
          factor: MfaBindingType.MFA_BINDING_TYPE_BACKUP_CODE,
          enabled: false,
          priority: 2
        }
      ]
    } as any)

    expect(getRequiredOperatorIdSpy).toHaveBeenCalled()
    expect((commandBus.execute as jest.Mock).mock.calls[0][0]).toEqual(
      expect.objectContaining({
        tenantId: 'tenant-1',
        loginRequired: true,
        updatedBy: 'operator-1',
        factors: [
          { factor: 'TOTP', enabled: true, priority: 1 },
          { factor: 'BACKUP_CODE', enabled: false, priority: 2 }
        ]
      })
    )
    expect(response).toEqual({
      tenantId: 'tenant-1',
      loginRequired: true,
      scenarioRequirements: [
        {
          scenario: 1,
          required: true
        },
        {
          scenario: 3,
          required: false
        },
        {
          scenario: 4,
          required: true
        },
        {
          scenario: 2,
          required: true
        }
      ],
      factors: [
        {
          factor: MfaBindingType.MFA_BINDING_TYPE_TOTP,
          enabled: true,
          priority: 1
        },
        {
          factor: MfaBindingType.MFA_BINDING_TYPE_BACKUP_CODE,
          enabled: false,
          priority: 2
        }
      ]
    })
  })

  it('should map startStepUpMfaChallenge requests into one challenge payload when the scenario requires MFA', async () => {
    const commandBus = {
      execute: jest.fn().mockResolvedValue({
        required: true,
        challengeId: 'step-up-flow-token',
        scenario: 'CHANGE_PASSWORD',
        defaultFactor: 'TOTP',
        availableFactors: [
          { type: 'TOTP', label: '认证器 App', priority: 1 },
          { type: 'EMAIL_OTP', label: '邮箱验证码', priority: 2 }
        ]
      })
    } as unknown as ValidatingCommandBus
    const queryBus = {} as ValidatingQueryBus

    const controller = new AuthGrpcController(commandBus, queryBus)

    const response: StartStepUpMfaChallengeResponse = await controller.startStepUpMfaChallenge({
      userId: 'user-1',
      accountId: 'account-1',
      tenantId: 'tenant-1',
      scenario: 3
    } as any)

    expect((commandBus.execute as jest.Mock).mock.calls[0][0]).toEqual(
      expect.objectContaining({
        userId: 'user-1',
        accountId: 'account-1',
        tenantId: 'tenant-1',
        scenario: 'CHANGE_PASSWORD'
      })
    )
    expect(response).toEqual({
      required: true,
      challengeId: 'step-up-flow-token',
      scenario: 3,
      defaultMfaFactor: 3,
      availableFactors: [
        { type: 3, label: '认证器 App', priority: 1 },
        { type: 1, label: '邮箱验证码', priority: 2 }
      ],
      factorChallengeId: '',
      challengeDestination: '',
      challengeExpiresAt: ''
    })
  })

  it('should map completeStepUpMfaChallenge requests into one step-up grant response', async () => {
    const commandBus = {
      execute: jest.fn().mockResolvedValue({
        success: true,
        scenario: 'CHANGE_CONTACT',
        mfaGrantToken: 'step-up-grant-token',
        expiresAt: '2026-04-22T10:00:00.000Z'
      })
    } as unknown as ValidatingCommandBus
    const queryBus = {} as ValidatingQueryBus

    const controller = new AuthGrpcController(commandBus, queryBus)

    const response = await controller.completeStepUpMfaChallenge({
      challengeId: 'step-up-flow-token',
      factor: 3,
      code: '123456',
      factorChallengeId: 'otp-factor-1'
    } as any)

    expect((commandBus.execute as jest.Mock).mock.calls[0][0]).toEqual(
      expect.objectContaining({
        challengeId: 'step-up-flow-token',
        factor: 'TOTP',
        code: '123456',
        factorChallengeId: 'otp-factor-1'
      })
    )
    expect(response).toEqual({
      success: true,
      scenario: 4,
      mfaGrantToken: 'step-up-grant-token',
      expiresAt: '2026-04-22T10:00:00.000Z'
    })
  })

  it('should map logoutSession requests into LogoutSessionCommand', async () => {
    const commandBus = {
      execute: jest.fn().mockResolvedValue({ success: true })
    } as unknown as ValidatingCommandBus
    const queryBus = {} as ValidatingQueryBus

    const controller = new AuthGrpcController(commandBus, queryBus)

    const response = await controller.logoutSession({
      userId: 'user-1',
      currentSessionId: 'session-current',
      targetSessionId: 'session-target'
    } as any)

    expect((commandBus.execute as jest.Mock).mock.calls[0][0]).toEqual(
      expect.objectContaining({
        userId: 'user-1',
        currentSessionId: 'session-current',
        targetSessionId: 'session-target'
      })
    )
    expect(response).toEqual({ success: true })
  })

  it('should map adminDeleteAccountSessions requests into AdminDeleteAccountSessionsCommand', async () => {
    const commandBus = {
      execute: jest.fn().mockResolvedValue({ success: true, deletedSessionCount: 2 })
    } as unknown as ValidatingCommandBus
    const queryBus = {} as ValidatingQueryBus

    const controller = new AuthGrpcController(commandBus, queryBus)
    const getRequiredOperatorIdSpy = jest
      .spyOn(controller as any, 'getRequiredOperatorId')
      .mockReturnValue('operator-1')

    const response = await controller.adminDeleteAccountSessions({
      userId: 'user-1',
      accountId: 'account-1',
      reason: 'ACCOUNT_DISABLED'
    } as any)

    expect(getRequiredOperatorIdSpy).toHaveBeenCalled()
    expect((commandBus.execute as jest.Mock).mock.calls[0][0]).toEqual(
      expect.objectContaining({
        operatorId: 'operator-1',
        userId: 'user-1',
        accountId: 'account-1',
        reason: 'ACCOUNT_DISABLED'
      })
    )
    expect(response).toEqual({ success: true, deletedSessionCount: 2 })
  })

  it('should map listAuditEvents filters and response records', async () => {
    const commandBus = {} as ValidatingCommandBus
    const queryBus = {
      execute: jest.fn().mockResolvedValue({
        items: [
          {
            eventId: 'event-auth-1',
            service: 'auth-service',
            module: 'session',
            eventType: 'SESSION_REVOKED',
            occurredAt: new Date('2026-04-08T18:00:00.000Z'),
            result: 'SUCCEEDED',
            operatorId: 'a5da9d3b-f755-44b0-b080-2ff6b42cf2c8',
            operatorType: 'HUMAN',
            tenantId: '8fbdfbfd-a221-4494-a760-8d9d033ce61f',
            orgId: undefined,
            traceId: 'trace-auth-query',
            resourceType: 'session',
            resourceId: '0f71e092-4d96-4c36-ac8a-2a3f73a330c5',
            details: {
              reason: 'ADMIN_REVOKED'
            }
          }
        ],
        nextCursor: 'cursor-auth-1'
      })
    } as unknown as ValidatingQueryBus

    const controller = new AuthGrpcController(commandBus, queryBus)
    const getRequiredOperatorIdSpy = jest
      .spyOn(controller as any, 'getRequiredOperatorId')
      .mockReturnValue('operator-auth-1')

    const response = await controller.listAuditEvents({
      service: 'auth-service',
      module: 'session',
      eventType: 'SESSION_REVOKED',
      result: 'SUCCEEDED',
      operatorId: 'a5da9d3b-f755-44b0-b080-2ff6b42cf2c8',
      tenantId: '8fbdfbfd-a221-4494-a760-8d9d033ce61f',
      orgId: '',
      resourceType: 'session',
      resourceId: '0f71e092-4d96-4c36-ac8a-2a3f73a330c5',
      occurredAtFrom: '2026-04-08T00:00:00.000Z',
      occurredAtTo: '2026-04-08T23:59:59.000Z',
      cursor: 'cursor-prev',
      pageSize: 10
    })

    expect(getRequiredOperatorIdSpy).toHaveBeenCalled()
    expect((queryBus.execute as jest.Mock).mock.calls[0][0]).toEqual(
      expect.objectContaining({
        service: 'auth-service',
        module: 'session',
        eventType: 'SESSION_REVOKED',
        result: 'SUCCEEDED',
        operatorId: 'a5da9d3b-f755-44b0-b080-2ff6b42cf2c8',
        tenantId: '8fbdfbfd-a221-4494-a760-8d9d033ce61f',
        resourceType: 'session',
        resourceId: '0f71e092-4d96-4c36-ac8a-2a3f73a330c5',
        occurredAtFrom: '2026-04-08T00:00:00.000Z',
        occurredAtTo: '2026-04-08T23:59:59.000Z',
        cursor: 'cursor-prev',
        pageSize: 10
      })
    )
    expect(response).toEqual({
      items: [
        {
          eventId: 'event-auth-1',
          service: 'auth-service',
          module: 'session',
          eventType: 'SESSION_REVOKED',
          occurredAt: '2026-04-08T18:00:00.000Z',
          result: 'SUCCEEDED',
          operatorId: 'a5da9d3b-f755-44b0-b080-2ff6b42cf2c8',
          operatorType: 'HUMAN',
          tenantId: '8fbdfbfd-a221-4494-a760-8d9d033ce61f',
          orgId: '',
          traceId: 'trace-auth-query',
          resourceType: 'session',
          resourceId: '0f71e092-4d96-4c36-ac8a-2a3f73a330c5',
          detailsJson: '{"reason":"ADMIN_REVOKED"}'
        }
      ],
      nextCursor: 'cursor-auth-1'
    })
  })

  it('should map self login-history requests into ListLoginHistoryQuery and normalize payloads', async () => {
    const commandBus = {} as ValidatingCommandBus
    const queryBus = {
      execute: jest.fn().mockResolvedValue({
        items: [
          {
            occurredAt: new Date('2026-04-12T12:00:00.000Z'),
            outcome: 'FAILED',
            loginMethod: 'EMAIL_PASSWORD',
            ipAddress: '127.0.0.1',
            deviceName: 'MacBook Pro',
            platform: 'macOS',
            browser: 'Firefox',
            failureReason: 'INVALID_CREDENTIALS',
            traceId: 'trace-login-1'
          }
        ],
        nextCursor: 'cursor-login-1'
      })
    } as unknown as ValidatingQueryBus

    const controller = new AuthGrpcController(commandBus, queryBus)

    const response = await controller.listLoginHistory({
      userId: 'user-1',
      result: 'FAILED',
      occurredAtFrom: '2026-04-12T00:00:00.000Z',
      occurredAtTo: '2026-04-13T00:00:00.000Z',
      cursor: 'cursor-prev',
      pageSize: 10
    } as any)

    expect((queryBus.execute as jest.Mock).mock.calls[0][0]).toEqual(
      expect.objectContaining({
        userId: 'user-1',
        result: 'FAILED',
        occurredAtFrom: '2026-04-12T00:00:00.000Z',
        occurredAtTo: '2026-04-13T00:00:00.000Z',
        cursor: 'cursor-prev',
        pageSize: 10
      })
    )
    expect(response).toEqual({
      items: [
        {
          occurredAt: '2026-04-12T12:00:00.000Z',
          outcome: 'FAILED',
          loginMethod: 'EMAIL_PASSWORD',
          ipAddress: '127.0.0.1',
          deviceName: 'MacBook Pro',
          platform: 'macOS',
          browser: 'Firefox',
          failureReason: 'INVALID_CREDENTIALS',
          traceId: 'trace-login-1'
        }
      ],
      nextCursor: 'cursor-login-1'
    })
  })

  it('should map login-method list requests into ListLoginMethodsQuery', async () => {
    const commandBus = {} as ValidatingCommandBus
    const queryBus = {
      execute: jest.fn().mockResolvedValue({
        loginMethods: [
          {
            methodId: 'method-email',
            userId: 'user-1',
            type: 'EMAIL',
            identifier: 'alice@example.com',
            maskedIdentifier: 'a***@example.com',
            verified: true,
            enabled: true,
            hasPassword: true,
            createdAt: '2026-04-20T00:00:00.000Z',
            updatedAt: '2026-04-20T00:00:00.000Z'
          }
        ],
        passwordSetupRequired: false
      })
    } as unknown as ValidatingQueryBus

    const controller = new AuthGrpcController(commandBus, queryBus)

    const response = await controller.listLoginMethods({ userId: 'user-1' } as any)

    expect((queryBus.execute as jest.Mock).mock.calls[0][0]).toEqual(
      expect.objectContaining({ userId: 'user-1' })
    )
    expect(response).toEqual({
      loginMethods: [
        {
          methodId: 'method-email',
          userId: 'user-1',
          type: 'EMAIL',
          identifier: 'alice@example.com',
          maskedIdentifier: 'a***@example.com',
          verified: true,
          enabled: true,
          hasPassword: true,
          createdAt: '2026-04-20T00:00:00.000Z',
          updatedAt: '2026-04-20T00:00:00.000Z'
        }
      ],
      passwordSetupRequired: false
    })
  })

  it('should map password mutation requests into auth commands', async () => {
    const commandBus = {
      execute: jest
        .fn()
        .mockResolvedValueOnce({ success: true, passwordSetupRequired: false })
        .mockResolvedValueOnce({ success: true, passwordSetupRequired: true })
    } as unknown as ValidatingCommandBus
    const queryBus = {} as ValidatingQueryBus

    const controller = new AuthGrpcController(commandBus, queryBus)
    const getRequiredOperatorIdSpy = jest
      .spyOn(controller as any, 'getRequiredOperatorId')
      .mockReturnValue('admin-1')

    const selfResponse = await controller.changeOwnPassword({
      userId: 'user-1',
      accountId: 'account-1',
      tenantId: 'tenant-1',
      currentPassword: 'old-password',
      newPassword: 'new-password',
      mfaGrantToken: 'step-up-grant-1'
    } as any)
    const adminResponse = await controller.requirePasswordSetup({
      userId: 'user-2',
      reason: '管理员要求重设密码',
      revokeSessions: true
    } as any)

    expect((commandBus.execute as jest.Mock).mock.calls[0][0]).toEqual(
      expect.objectContaining({
        userId: 'user-1',
        accountId: 'account-1',
        tenantId: 'tenant-1',
        currentPassword: 'old-password',
        newPassword: 'new-password',
        mfaGrantToken: 'step-up-grant-1'
      })
    )
    expect(getRequiredOperatorIdSpy).toHaveBeenCalled()
    expect((commandBus.execute as jest.Mock).mock.calls[1][0]).toEqual(
      expect.objectContaining({
        userId: 'user-2',
        requiredBy: 'admin-1',
        reason: '管理员要求重设密码',
        revokeSessions: true
      })
    )
    expect(selfResponse).toEqual({ success: true, passwordSetupRequired: false })
    expect(adminResponse).toEqual({ success: true, passwordSetupRequired: true })
  })

  it('should use the request user id for authenticated self-service user mutations', async () => {
    const commandBus = {
      execute: jest
        .fn()
        .mockResolvedValueOnce({
          challengeId: 'email-binding-challenge',
          expiresAt: new Date('2026-04-21T12:00:00.000Z'),
          destination: 'a***@example.com'
        })
        .mockResolvedValueOnce({
          success: true,
          type: 'EMAIL',
          identifier: 'alice@example.com'
        })
        .mockResolvedValueOnce({
          challengeId: 'phone-binding-challenge',
          expiresAt: new Date('2026-04-21T12:05:00.000Z'),
          destination: '+86******0000'
        })
        .mockResolvedValueOnce({
          success: true,
          type: 'PHONE',
          identifier: '+8613800138000'
        })
        .mockResolvedValueOnce({ completed: true })
    } as unknown as ValidatingCommandBus
    const queryBus = {} as ValidatingQueryBus

    const controller = new AuthGrpcController(commandBus, queryBus)
    jest.spyOn(controller as any, 'getRequiredOperatorId').mockReturnValue('account-1')

    await controller.requestEmailBindingChallenge({
      userId: 'user-1',
      email: 'alice@example.com'
    } as any)
    await controller.verifyEmailBinding({
      userId: 'user-1',
      accountId: 'account-1',
      tenantId: 'tenant-1',
      email: 'alice@example.com',
      otp: '123456',
      mfaGrantToken: 'step-up-grant-1'
    } as any)
    await controller.requestPhoneBindingChallenge({
      userId: 'user-1',
      phone: '+8613800138000'
    } as any)
    await controller.verifyPhoneBinding({
      userId: 'user-1',
      accountId: 'account-1',
      tenantId: 'tenant-1',
      phone: '+8613800138000',
      otp: '654321',
      mfaGrantToken: 'step-up-grant-2'
    } as any)

    const response = await controller.completeFirstLoginPasswordSetup({
      userId: 'user-1',
      newPassword: 'new-password'
    } as any)

    expect((commandBus.execute as jest.Mock).mock.calls[0][0]).toEqual(
      expect.objectContaining({
        userId: 'user-1',
        email: 'alice@example.com'
      })
    )
    expect((commandBus.execute as jest.Mock).mock.calls[1][0]).toEqual(
      expect.objectContaining({
        userId: 'user-1',
        accountId: 'account-1',
        tenantId: 'tenant-1',
        email: 'alice@example.com',
        otp: '123456',
        mfaGrantToken: 'step-up-grant-1'
      })
    )
    expect((commandBus.execute as jest.Mock).mock.calls[2][0]).toEqual(
      expect.objectContaining({
        userId: 'user-1',
        phone: '+8613800138000'
      })
    )
    expect((commandBus.execute as jest.Mock).mock.calls[3][0]).toEqual(
      expect.objectContaining({
        userId: 'user-1',
        accountId: 'account-1',
        tenantId: 'tenant-1',
        phone: '+8613800138000',
        otp: '654321',
        mfaGrantToken: 'step-up-grant-2'
      })
    )
    expect((commandBus.execute as jest.Mock).mock.calls[4][0]).toEqual(
      expect.objectContaining({
        userId: 'user-1',
        newPassword: 'new-password'
      })
    )
    expect(response).toEqual({ completed: true })
  })

  it('should map login-method enablement requests into SetLoginMethodEnabledCommand', async () => {
    const commandBus = {
      execute: jest.fn().mockResolvedValue({
        success: true,
        loginMethod: {
          methodId: 'method-email',
          userId: 'user-1',
          type: 'EMAIL',
          identifier: 'alice@example.com',
          maskedIdentifier: 'a***@example.com',
          verified: true,
          enabled: false,
          hasPassword: true,
          createdAt: '2026-04-20T00:00:00.000Z',
          updatedAt: '2026-04-20T00:00:00.000Z'
        }
      })
    } as unknown as ValidatingCommandBus
    const queryBus = {} as ValidatingQueryBus

    const controller = new AuthGrpcController(commandBus, queryBus)
    const getRequiredOperatorIdSpy = jest
      .spyOn(controller as any, 'getRequiredOperatorId')
      .mockReturnValue('admin-1')

    const response = await controller.setLoginMethodEnabled({
      userId: 'user-1',
      methodId: 'method-email',
      enabled: false,
      reason: '管理员停用'
    } as any)

    expect(getRequiredOperatorIdSpy).toHaveBeenCalled()
    expect((commandBus.execute as jest.Mock).mock.calls[0][0]).toEqual(
      expect.objectContaining({
        userId: 'user-1',
        methodId: 'method-email',
        enabled: false,
        operatorId: 'admin-1',
        reason: '管理员停用'
      })
    )
    expect(response).toEqual({
      success: true,
      loginMethod: {
        methodId: 'method-email',
        userId: 'user-1',
        type: 'EMAIL',
        identifier: 'alice@example.com',
        maskedIdentifier: 'a***@example.com',
        verified: true,
        enabled: false,
        hasPassword: true,
        createdAt: '2026-04-20T00:00:00.000Z',
        updatedAt: '2026-04-20T00:00:00.000Z'
      }
    })
  })

  it('should map self login-method enablement requests into SetLoginMethodEnabledCommand without admin permission metadata', async () => {
    const commandBus = {
      execute: jest.fn().mockResolvedValue({
        success: true,
        loginMethod: {
          methodId: 'method-email:PASSWORD',
          userId: 'user-1',
          type: 'EMAIL',
          identifier: 'alice@example.com',
          maskedIdentifier: 'a***@example.com',
          verified: true,
          enabled: false,
          hasPassword: true,
          createdAt: '2026-04-20T00:00:00.000Z',
          updatedAt: '2026-04-20T00:00:00.000Z'
        }
      })
    } as unknown as ValidatingCommandBus
    const queryBus = {} as ValidatingQueryBus

    const controller = new AuthGrpcController(commandBus, queryBus)
    const getRequiredOperatorIdSpy = jest
      .spyOn(controller as any, 'getRequiredOperatorId')
      .mockReturnValue('account-1')

    const response = await (controller as any).setOwnLoginMethodEnabled({
      userId: 'user-1',
      methodId: 'method-email:PASSWORD',
      enabled: false
    })

    expect(getRequiredOperatorIdSpy).toHaveBeenCalled()
    expect((commandBus.execute as jest.Mock).mock.calls[0][0]).toEqual(
      expect.objectContaining({
        userId: 'user-1',
        methodId: 'method-email:PASSWORD',
        enabled: false,
        operatorId: 'account-1'
      })
    )
    expect(response).toEqual({
      success: true,
      loginMethod: {
        methodId: 'method-email:PASSWORD',
        userId: 'user-1',
        type: 'EMAIL',
        identifier: 'alice@example.com',
        maskedIdentifier: 'a***@example.com',
        verified: true,
        enabled: false,
        hasPassword: true,
        createdAt: '2026-04-20T00:00:00.000Z',
        updatedAt: '2026-04-20T00:00:00.000Z'
      }
    })
  })

  it('should map password recovery requests into the new recovery commands', async () => {
    const commandBus = {
      execute: jest
        .fn()
        .mockResolvedValueOnce({
          accepted: true,
          challengeId: 'challenge-1',
          expiresAt: new Date('2026-04-20T00:05:00.000Z'),
          maskedDestination: 'u***@example.com'
        })
        .mockResolvedValueOnce({
          verified: true,
          resetToken: 'reset-token-1'
        })
        .mockResolvedValueOnce({
          success: true,
          sessionsRevoked: true
        })
    } as unknown as ValidatingCommandBus
    const queryBus = {} as ValidatingQueryBus
    const controller = new AuthGrpcController(commandBus, queryBus)

    const challengeResponse = await controller.requestPasswordRecoveryChallenge({
      channel: 1,
      identifier: 'user@example.com'
    } as any)
    const verifyResponse = await controller.verifyPasswordRecoveryChallenge({
      challengeId: 'challenge-1',
      otp: '123456'
    } as any)
    const completeResponse = await controller.completePasswordRecovery({
      resetToken: 'reset-token-1',
      newPassword: 'NewSecret123!'
    } as any)

    expect((commandBus.execute as jest.Mock).mock.calls[0][0]).toEqual(
      expect.objectContaining({
        channel: 'EMAIL',
        identifier: 'user@example.com'
      })
    )
    expect((commandBus.execute as jest.Mock).mock.calls[1][0]).toEqual(
      expect.objectContaining({
        challengeId: 'challenge-1',
        otp: '123456'
      })
    )
    expect((commandBus.execute as jest.Mock).mock.calls[2][0]).toEqual(
      expect.objectContaining({
        resetToken: 'reset-token-1',
        newPassword: 'NewSecret123!'
      })
    )
    expect(challengeResponse).toEqual({
      accepted: true,
      challengeId: 'challenge-1',
      expiresAt: '2026-04-20T00:05:00.000Z',
      maskedDestination: 'u***@example.com'
    })
    expect(verifyResponse).toEqual({
      verified: true,
      resetToken: 'reset-token-1'
    })
    expect(completeResponse).toEqual({
      success: true,
      sessionsRevoked: true
    })
  })

  it('should map password recovery channel inspection into the new recovery query', async () => {
    const commandBus = {} as ValidatingCommandBus
    const queryBus = {
      execute: jest.fn().mockResolvedValue({
        channels: [
          { channel: 'EMAIL', maskedDestination: 'u***@example.com' },
          { channel: 'PHONE', maskedDestination: '+15****0100' }
        ]
      })
    } as unknown as ValidatingQueryBus
    const controller = new AuthGrpcController(commandBus, queryBus)

    const response = await controller.inspectPasswordRecoveryChannels({
      identifier: 'user@example.com'
    } as any)

    expect((queryBus.execute as jest.Mock).mock.calls[0][0]).toEqual(
      expect.objectContaining({
        identifier: 'user@example.com'
      })
    )
    expect(response).toEqual({
      channels: [
        {
          channel: 1,
          maskedDestination: 'u***@example.com'
        },
        {
          channel: 2,
          maskedDestination: '+15****0100'
        }
      ],
      defaultChannel: 0
    })
  })

  it('should stop forwarding tenantName in account-selection login responses', async () => {
    const commandBus = {
      execute: jest.fn().mockResolvedValue({
        nextStep: 'ACCOUNT_SELECTION_REQUIRED',
        userId: 'user-1',
        method: 'EMAIL_PASSWORD',
        accounts: [
          {
            accountId: 'account-1',
            tenantId: 'tenant-1',
            tenantName: 'Tenant One',
            scopeLevel: 'TENANT',
            displayName: 'Tenant Account'
          }
        ]
      })
    } as unknown as ValidatingCommandBus
    const queryBus = {} as ValidatingQueryBus

    const controller = new AuthGrpcController(commandBus, queryBus)

    await expect(
      controller.loginWithEmailPassword({
        email: 'user@example.com',
        password: 'correct-password'
      } as any)
    ).resolves.toEqual({
      status: 3,
      userId: 'user-1',
      challengeId: '',
      accessToken: '',
      refreshToken: '',
      expiresIn: '0',
      loginMethod: 'EMAIL_PASSWORD',
      accounts: [
        {
          accountId: 'account-1',
          tenantId: 'tenant-1',
          displayName: 'Tenant Account',
          scopeLevel: 'TENANT'
        }
      ],
      passwordSetupRequired: false
    })
  })
})
