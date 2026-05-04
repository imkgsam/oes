import { SpanContext } from '@opentelemetry/api';
import { Metadata } from '@grpc/grpc-js';
/** This helper writes the active OTel span context into gRPC metadata using W3C trace headers. */
export declare function injectGrpcTraceContext(metadata: Metadata, sourceContext?: import("@opentelemetry/api").Context): void;
/** This helper rebuilds an OTel context from gRPC metadata so tests and future interceptors can restore distributed tracing. */
export declare function extractGrpcTraceContext(metadata: Metadata, baseContext?: import("@opentelemetry/api").Context): import("@opentelemetry/api").Context;
/** This helper parses W3C trace headers from gRPC metadata into an OTel span context. */
export declare function parseGrpcTraceContext(metadata: Metadata): SpanContext | undefined;
