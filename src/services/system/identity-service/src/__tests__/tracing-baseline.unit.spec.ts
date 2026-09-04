import {
  filterAllowedTraceAttributes,
  TRACE_ATTRIBUTE_KEYS,
  resolveTraceSampleRatio,
  resolveTracingConfig
} from '@oes/common/tracing'

describe('tracing baseline', () => {
  it('should use environment-based default trace sample ratio', () => {
    expect(resolveTraceSampleRatio({ NODE_ENV: 'development' } as NodeJS.ProcessEnv)).toBe(1)
    expect(resolveTraceSampleRatio({ NODE_ENV: 'staging' } as NodeJS.ProcessEnv)).toBe(1)
    expect(resolveTraceSampleRatio({ NODE_ENV: 'production' } as NodeJS.ProcessEnv)).toBe(0.2)
  })

  it('should clamp explicit trace sample ratio into valid range', () => {
    expect(resolveTraceSampleRatio({ OTEL_TRACES_SAMPLER_ARG: '2' } as NodeJS.ProcessEnv)).toBe(1)
    expect(resolveTraceSampleRatio({ OTEL_TRACES_SAMPLER_ARG: '-1' } as NodeJS.ProcessEnv)).toBe(0)
    expect(resolveTraceSampleRatio({ OTEL_TRACES_SAMPLER_ARG: '0.35' } as NodeJS.ProcessEnv)).toBe(0.35)
  })

  it('should resolve tracing config with custom ignore paths', () => {
    const config = resolveTracingConfig('identity-service', {
      OTEL_EXPORTER_OTLP_ENDPOINT: 'http://otel-collector:4318',
      OTEL_HTTP_IGNORE_INCOMING_PATHS: '/health,/internal/ready'
    } as NodeJS.ProcessEnv)

    expect(config.serviceName).toBe('identity-service')
    expect(config.otlpEndpoint).toBe('http://otel-collector:4318')
    expect(config.ignoreIncomingPaths).toEqual(['/health', '/internal/ready'])
  })

  it('should keep only allowed trace attributes', () => {
    expect(
      filterAllowedTraceAttributes({
        [TRACE_ATTRIBUTE_KEYS.tenantId]: 'tenant-1',
        [TRACE_ATTRIBUTE_KEYS.resourceId]: 'account-1',
        token: 'should-not-pass',
        details: { nested: true }
      })
    ).toEqual({
      [TRACE_ATTRIBUTE_KEYS.tenantId]: 'tenant-1',
      [TRACE_ATTRIBUTE_KEYS.resourceId]: 'account-1'
    })
  })
})
