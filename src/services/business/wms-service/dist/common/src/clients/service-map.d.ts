export declare const ServiceKeys: {
    readonly AUTH_TCP: "AUTH_TCP";
    readonly PERMISSION_TCP: "PERMISSION_TCP";
    readonly PARTY_GRPC: "PARTY_GRPC";
    readonly AUDIT_TCP: "AUDIT_TCP";
    readonly NOTIFICATION_TCP: "NOTIFICATION_TCP";
};
export type ServiceKey = (typeof ServiceKeys)[keyof typeof ServiceKeys];
export interface ServiceEndpointConfig {
    host: string;
    port: number;
}
export declare const SERVICE_ENDPOINTS_CONFIG: {
    readonly AUTH_TCP: ServiceEndpointConfig;
    readonly PERMISSION_TCP: ServiceEndpointConfig;
    readonly PARTY_GRPC: ServiceEndpointConfig;
    readonly AUDIT_TCP: ServiceEndpointConfig;
    readonly NOTIFICATION_TCP: ServiceEndpointConfig;
};
