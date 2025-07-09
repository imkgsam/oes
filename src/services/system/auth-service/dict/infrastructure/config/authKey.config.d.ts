export declare const AuthKeyConfigName = "authkey";
export interface IAuthKeyConfig {
    privateKeyPath: string;
    publicKeyPath: string;
}
declare const _default: (() => {
    publicKeyPath: string;
    privateKeyPath: string;
}) & import("@nestjs/config").ConfigFactoryKeyHost<{
    publicKeyPath: string;
    privateKeyPath: string;
}>;
export default _default;
