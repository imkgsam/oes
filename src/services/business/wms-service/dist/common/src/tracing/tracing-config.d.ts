export interface ResolvedTracingConfig {
    serviceName: string;
    serviceVersion: string;
    otlpEndpoint: string;
    sampleRatio: number;
    ignoreIncomingPaths: string[];
}
export declare function resolveTraceSampleRatio(env?: NodeJS.ProcessEnv): number;
export declare function resolveIgnoreIncomingPaths(env?: NodeJS.ProcessEnv): string[];
export declare function resolveTracingConfig(serviceName: string, env?: NodeJS.ProcessEnv): ResolvedTracingConfig;
