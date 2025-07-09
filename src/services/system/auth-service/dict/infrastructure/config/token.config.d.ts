export declare const TokenConfigName = "token";
export interface ITokenConfig {
    accessTokenValidity: number;
    refreshTokenValidity: number;
    issuer: string;
    audience: string;
}
declare const _default: (() => {
    accessTokenValidity: number;
    refreshTokenValidity: number;
    issuer: string;
    audience: string;
}) & import("@nestjs/config").ConfigFactoryKeyHost<{
    accessTokenValidity: number;
    refreshTokenValidity: number;
    issuer: string;
    audience: string;
}>;
export default _default;
