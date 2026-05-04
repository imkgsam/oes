/**
 * EventTraceContext carries the active trace identifiers into local or future async event payloads.
 */
export interface EventTraceContext {
    traceId: string | null;
    spanId: string | null;
}
/**
 * captureEventTraceContext snapshots the current active span so emitted events keep correlation identifiers.
 */
export declare function captureEventTraceContext(): EventTraceContext;
