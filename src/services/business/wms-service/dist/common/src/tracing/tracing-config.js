"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.resolveTraceSampleRatio = resolveTraceSampleRatio;
exports.resolveIgnoreIncomingPaths = resolveIgnoreIncomingPaths;
exports.resolveTracingConfig = resolveTracingConfig;
const DEFAULT_OTLP_ENDPOINT = 'http://localhost:4318';
const DEFAULT_IGNORE_INCOMING_PATHS = ['/health', '/metrics'];
const DEFAULT_DEV_SAMPLE_RATIO = 1;
const DEFAULT_STAGING_SAMPLE_RATIO = 1;
const DEFAULT_PROD_SAMPLE_RATIO = 0.2;
function resolveTraceSampleRatio(env = process.env) {
    const raw = env.OTEL_TRACES_SAMPLER_ARG?.trim();
    if (raw) {
        const parsed = Number(raw);
        if (Number.isFinite(parsed)) {
            return clampSampleRatio(parsed);
        }
    }
    const nodeEnv = env.NODE_ENV?.trim().toLowerCase();
    switch (nodeEnv) {
        case 'production':
        case 'prod':
            return DEFAULT_PROD_SAMPLE_RATIO;
        case 'staging':
            return DEFAULT_STAGING_SAMPLE_RATIO;
        default:
            return DEFAULT_DEV_SAMPLE_RATIO;
    }
}
function resolveIgnoreIncomingPaths(env = process.env) {
    const raw = env.OTEL_HTTP_IGNORE_INCOMING_PATHS?.trim();
    if (!raw) {
        return [...DEFAULT_IGNORE_INCOMING_PATHS];
    }
    const parsed = raw
        .split(',')
        .map((item) => item.trim())
        .filter(Boolean);
    return parsed.length > 0 ? parsed : [...DEFAULT_IGNORE_INCOMING_PATHS];
}
function resolveTracingConfig(serviceName, env = process.env) {
    return {
        serviceName: serviceName.trim(),
        serviceVersion: env.npm_package_version || '1.0.0',
        otlpEndpoint: env.OTEL_EXPORTER_OTLP_ENDPOINT || DEFAULT_OTLP_ENDPOINT,
        sampleRatio: resolveTraceSampleRatio(env),
        ignoreIncomingPaths: resolveIgnoreIncomingPaths(env)
    };
}
function clampSampleRatio(input) {
    if (input <= 0)
        return 0;
    if (input >= 1)
        return 1;
    return input;
}
//# sourceMappingURL=tracing-config.js.map