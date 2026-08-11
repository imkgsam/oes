// @ts-nocheck
const { DispatchPriority, NotificationCategory } = require('@oes/common/generated/notification_service')
const { prepareAuthDispatch } = require('../../dist/application/commands/send-email.handler.js')

/** Reproduces the frozen profile probes before persistence or provider work is available. */
describe('Notification Auth dispatch profiles', () => {
  const otpEmail = { category: NotificationCategory.NOTIFICATION_CATEGORY_AUTH_OTP, templateKey: 'AUTH_OTP_EMAIL', recipient: { address: 'User@例子.测试' }, variables: [{ key: 'code', value: '123456' }, { key: 'ttlMinutes', value: '5' }, { key: 'maskedDestination', value: 'u***@example.test' }], idempotencyKey: 'otp-email', priority: DispatchPriority.DISPATCH_PRIORITY_HIGH }
  const otpSms = { category: NotificationCategory.NOTIFICATION_CATEGORY_AUTH_OTP, templateKey: 'AUTH_OTP_SMS', recipient: { address: '+1 (234) 567-8901' }, variables: [{ key: 'code', value: '123456' }, { key: 'ttlMinutes', value: '5' }, { key: 'maskedDestination', value: '+1 (***) ***-8901' }], idempotencyKey: 'otp-sms', priority: DispatchPriority.DISPATCH_PRIORITY_HIGH }
  const invitationEmail = { category: NotificationCategory.NOTIFICATION_CATEGORY_AUTH_SECURITY_ALERT, templateKey: 'ACCOUNT_INVITATION_EMAIL', recipient: { address: 'User@例子.测试' }, variables: [{ key: 'recipient', value: 'User@例子.测试' }, { key: 'loginMode', value: 'OTP_FIRST' }], idempotencyKey: 'invite-email', priority: DispatchPriority.DISPATCH_PRIORITY_HIGH }
  const invitationSms = { category: NotificationCategory.NOTIFICATION_CATEGORY_AUTH_SECURITY_ALERT, templateKey: 'ACCOUNT_INVITATION_SMS', recipient: { address: '+1 (234) 567-8901' }, variables: [{ key: 'recipient', value: '+1 (234) 567-8901' }, { key: 'loginMode', value: 'OTP_FIRST' }], idempotencyKey: 'invite-sms', priority: DispatchPriority.DISPATCH_PRIORITY_HIGH }
  const spacedInvitationEmail = { ...invitationEmail, recipient: { address: '  User@例子.测试  ' }, variables: [{ key: 'recipient', value: '  User@例子.测试  ' }, { key: 'loginMode', value: 'OTP_FIRST' }] }
  const spacedInvitationSms = { ...invitationSms, recipient: { address: '  +1 (234) 567-8901  ' }, variables: [{ key: 'recipient', value: '  +1 (234) 567-8901  ' }, { key: 'loginMode', value: 'OTP_FIRST' }] }
  it.each([
    ['OTP email', otpEmail, 'EMAIL', 'user@xn--fsqu00a.xn--0zwm56d'],
    ['OTP SMS', otpSms, 'SMS', '+12345678901'],
    ['invitation email', invitationEmail, 'EMAIL', 'user@xn--fsqu00a.xn--0zwm56d'],
    ['invitation SMS', invitationSms, 'SMS', '+12345678901']
  ])('accepts and canonically normalizes %s', (_name, request, channel, recipient) => {
    expect(prepareAuthDispatch(request, channel)).toMatchObject({ recipient })
  })
  it.each([
    ['Email request and variable', spacedInvitationEmail, 'EMAIL', 'user@xn--fsqu00a.xn--0zwm56d'],
    ['SMS request and variable', spacedInvitationSms, 'SMS', '+12345678901']
  ])('normalizes surrounding whitespace for invitation %s before equality', (_name, request, channel, recipient) => {
    expect(prepareAuthDispatch(request, channel)).toMatchObject({ recipient, variables: { recipient } })
  })
  it.each([
    ['OTP email empty masked destination', { ...otpEmail, variables: [...otpEmail.variables.slice(0, 2), { key: 'maskedDestination', value: '' }] }, 'EMAIL', 'INVALID_TEMPLATE_VARIABLES'],
    ['OTP SMS wrong category', { ...otpSms, category: NotificationCategory.NOTIFICATION_CATEGORY_AUTH_SECURITY_ALERT }, 'SMS', 'INVALID_DISPATCH_PROFILE'],
    ['invitation email mismatched recipient', { ...invitationEmail, variables: [{ key: 'recipient', value: 'other@example.com' }, { key: 'loginMode', value: 'OTP_FIRST' }] }, 'EMAIL', 'INVALID_TEMPLATE_VARIABLES'],
    ['invitation SMS wrong login mode', { ...invitationSms, variables: [{ key: 'recipient', value: '+1 (234) 567-8901' }, { key: 'loginMode', value: 'PASSWORD' }] }, 'SMS', 'INVALID_TEMPLATE_VARIABLES'],
    ['whitespace subject', { ...otpEmail, subjectOverride: ' ' }, 'EMAIL', 'INVALID_DISPATCH_PROFILE'],
    ['invalid email domain', { ...otpEmail, recipient: { address: 'user@bad_domain' } }, 'EMAIL', 'INVALID_RECIPIENT']
  ])('rejects %s before dispatch acceptance', (_name, candidate, channel, expected) => {
    expect(prepareAuthDispatch(candidate, channel)).toBe(expected)
  })
})
