// @ts-nocheck
const { DispatchPriority, NotificationCategory } = require('@oes/common/generated/notification_service')
const { prepareAuthDispatch } = require('../../dist/application/commands/send-email.handler.js')

/** Reproduces the frozen profile probes before persistence or provider work is available. */
describe('Notification Auth dispatch profiles', () => {
  const request = { category: NotificationCategory.NOTIFICATION_CATEGORY_AUTH_OTP, templateKey: 'AUTH_OTP_EMAIL', recipient: { address: 'User@例子.测试' }, variables: [{ key: 'code', value: '123456' }, { key: 'ttlMinutes', value: '5' }, { key: 'maskedDestination', value: 'u***@example.test' }], idempotencyKey: 'otp-1', priority: DispatchPriority.DISPATCH_PRIORITY_HIGH }
  it('normalizes an IDNA email recipient and accepts the exact HIGH OTP profile', () => {
    expect(prepareAuthDispatch(request, 'EMAIL')).toMatchObject({ recipient: 'user@xn--fsqu00a.xn--0zwm56d' })
  })
  it.each([
    ['empty masked destination', { ...request, variables: [...request.variables.slice(0, 2), { key: 'maskedDestination', value: '' }] }, 'INVALID_TEMPLATE_VARIABLES'],
    ['whitespace subject', { ...request, subjectOverride: ' ' }, 'INVALID_DISPATCH_PROFILE'],
    ['invalid email domain', { ...request, recipient: { address: 'user@bad_domain' } }, 'INVALID_RECIPIENT']
  ])('rejects %s before dispatch acceptance', (_name, candidate, expected) => {
    expect(prepareAuthDispatch(candidate, 'EMAIL')).toBe(expected)
  })
})
