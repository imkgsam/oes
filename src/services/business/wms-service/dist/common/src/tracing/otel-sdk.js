"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.initOtelSdk = initOtelSdk;
const sdk_node_1 = require("@opentelemetry/sdk-node");
const auto_instrumentations_node_1 = require("@opentelemetry/auto-instrumentations-node");
const exporter_trace_otlp_http_1 = require("@opentelemetry/exporter-trace-otlp-http");
const resources_1 = require("@opentelemetry/resources");
const semantic_conventions_1 = require("@opentelemetry/semantic-conventions");
const tracing_config_1 = require("./tracing-config");
function initOtelSdk(serviceName) {
    const config = (0, tracing_config_1.resolveTracingConfig)(serviceName);
    process.env.OTEL_TRACES_SAMPLER = process.env.OTEL_TRACES_SAMPLER || 'parentbased_traceidratio';
    process.env.OTEL_TRACES_SAMPLER_ARG = process.env.OTEL_TRACES_SAMPLER_ARG || String(config.sampleRatio);
    const traceExporter = new exporter_trace_otlp_http_1.OTLPTraceExporter({
        url: `${config.otlpEndpoint}/v1/traces`
    });
    const resource = (0, resources_1.resourceFromAttributes)({
        [semantic_conventions_1.ATTR_SERVICE_NAME]: config.serviceName,
        [semantic_conventions_1.ATTR_SERVICE_VERSION]: config.serviceVersion
    });
    const sdk = new sdk_node_1.NodeSDK({
        resource,
        traceExporter,
        instrumentations: [
            (0, auto_instrumentations_node_1.getNodeAutoInstrumentations)({
                '@opentelemetry/instrumentation-http': {
                    ignoreIncomingRequestHook: (request) => {
                        return config.ignoreIncomingPaths.includes(request.url ?? '');
                    }
                },
                '@opentelemetry/instrumentation-fs': {
                    enabled: false
                }
            })
        ]
    });
    sdk.start();
    process.on('SIGTERM', () => {
        sdk
            .shutdown()
            .then(() => console.log('OpenTelemetry SDK shut down successfully'))
            .catch((error) => console.error('Error shutting down OpenTelemetry SDK', error))
            .finally(() => process.exit(0));
    });
    return sdk;
}
//# sourceMappingURL=otel-sdk.js.map