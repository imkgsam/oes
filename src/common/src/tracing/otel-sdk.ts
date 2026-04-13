import { NodeSDK } from '@opentelemetry/sdk-node'
import { getNodeAutoInstrumentations } from '@opentelemetry/auto-instrumentations-node'
import { OTLPTraceExporter } from '@opentelemetry/exporter-trace-otlp-http'
import { resourceFromAttributes } from '@opentelemetry/resources'
import { ATTR_SERVICE_NAME, ATTR_SERVICE_VERSION } from '@opentelemetry/semantic-conventions'
import { resolveTracingConfig } from './tracing-config'

export function initOtelSdk(serviceName: string) {
  const config = resolveTracingConfig(serviceName)
  process.env.OTEL_TRACES_SAMPLER = process.env.OTEL_TRACES_SAMPLER || 'parentbased_traceidratio'
  process.env.OTEL_TRACES_SAMPLER_ARG = process.env.OTEL_TRACES_SAMPLER_ARG || String(config.sampleRatio)

  const traceExporter = new OTLPTraceExporter({
    url: `${config.otlpEndpoint}/v1/traces`
  })

  const resource = resourceFromAttributes({
    [ATTR_SERVICE_NAME]: config.serviceName,
    [ATTR_SERVICE_VERSION]: config.serviceVersion
  })

  const sdk = new NodeSDK({
    resource,
    traceExporter,
    instrumentations: [
      getNodeAutoInstrumentations({
        '@opentelemetry/instrumentation-http': {
          ignoreIncomingRequestHook: (request) => {
            return config.ignoreIncomingPaths.includes(request.url ?? '')
          }
        },
        '@opentelemetry/instrumentation-fs': {
          enabled: false
        }
      })
    ]
  })

  sdk.start()

  process.on('SIGTERM', () => {
    sdk
      .shutdown()
      .then(() => console.log('OpenTelemetry SDK shut down successfully'))
      .catch((error) => console.error('Error shutting down OpenTelemetry SDK', error))
      .finally(() => process.exit(0))
  })

  return sdk
}
